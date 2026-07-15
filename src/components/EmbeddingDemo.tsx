import { useState } from 'react'
import { motion } from 'framer-motion'
import { useEmbedding } from '../hooks/useEmbedding'
import { cosineSimilarity } from '../services/embeddings'
import { loadSettings } from '../lib/storage'
import { EmbeddingScatter } from './EmbeddingScatter'

const DEFAULT_A = 'How do I get a refund for a cancelled train?'
const DEFAULT_B = 'How to claim money back when my train got cancelled?'

export function EmbeddingDemo() {
  const [textA, setTextA] = useState(DEFAULT_A)
  const [textB, setTextB] = useState(DEFAULT_B)
  const [submittedA, setSubmittedA] = useState(DEFAULT_A)
  const [submittedB, setSubmittedB] = useState(DEFAULT_B)

  const embA = useEmbedding(submittedA, Boolean(submittedA))
  const embB = useEmbedding(submittedB, Boolean(submittedB))

  const apiKey = loadSettings().apiKey
  if (!apiKey) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-5 py-4 my-6">
        <p className="text-[13px] text-red-200">
          No API key set. Add your OpenAI key in <a href="/settings" className="underline">Settings</a>.
        </p>
      </div>
    )
  }

  const bothLoaded = !!(embA.data?.vector && embB.data?.vector)
  const similarity = bothLoaded ? cosineSimilarity(embA.data!.vector, embB.data!.vector) : null

  function run() {
    setSubmittedA(textA)
    setSubmittedB(textB)
  }

  return (
    <div className="my-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InputBox label="Text A" value={textA} onChange={setTextA} loading={embA.isFetching} />
        <InputBox label="Text B" value={textB} onChange={setTextB} loading={embB.isFetching} />
      </div>

      <button
        onClick={run}
        disabled={embA.isFetching || embB.isFetching}
        className="rounded bg-zinc-100 hover:bg-white px-4 py-2 text-[13px] font-medium text-zinc-900 disabled:opacity-50"
      >
        {embA.isFetching || embB.isFetching ? 'Embedding…' : 'Embed both'}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <VectorPreview label="A" data={embA.data} error={embA.error ?? undefined} />
        <VectorPreview label="B" data={embB.data} error={embB.error ?? undefined} />
      </div>

      {bothLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4"
        >
          <p className="text-[12px] text-zinc-500 mb-2">2D projection (first 2 of {embA.data!.vector.length} dimensions   illustrative only)</p>
          <EmbeddingScatter
            points={[
              { label: 'A', vector: embA.data!.vector, color: '#34d399' },
              { label: 'B', vector: embB.data!.vector, color: '#fbbf24' },
            ]}
          />
          <p className="text-[10px] text-zinc-600 text-center mt-2">
            Real distance lives in 1536D space   this 2D slice just hints at it.
          </p>
        </motion.div>
      )}

      {similarity !== null && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4"
        >
          <p className="text-[12px] text-zinc-500 mb-2">Cosine Similarity</p>
          <div className="flex items-end gap-4">
            <span className="font-mono text-3xl text-emerald-400">{similarity.toFixed(4)}</span>
            <div className="flex-1 mb-1">
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${similarity * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>unrelated (0.0)</span>
                <span>related (0.5)</span>
                <span>identical (1.0)</span>
              </div>
            </div>
          </div>
          <p className="text-[12px] text-zinc-500 mt-3">
            {similarity > 0.85
              ? 'Very similar meaning   these would retrieve the same docs.'
              : similarity > 0.5
                ? 'Related   partial overlap in meaning.'
                : similarity > 0.25
                  ? 'Weak relation   different topics, may not retrieve the same docs.'
                  : 'Unrelated   different topics entirely.'}
          </p>
        </motion.div>
      )}
    </div>
  )
}

function InputBox({
  label,
  value,
  onChange,
  loading,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  loading?: boolean
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-[12px] text-zinc-500 mb-1">
        <span>{label}</span>
        {loading && <span className="text-zinc-600 animate-pulse">embedding…</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600"
      />
    </div>
  )
}

function VectorPreview({
  label,
  data,
  error,
}: {
  label: string
  data?: { vector: number[]; model: string; tokens: number; cost: number }
  error?: Error
}) {
  if (error) {
    return <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">{String(error.message)}</div>
  }
  if (!data) {
    return (
      <div className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-6 text-center text-[12px] text-zinc-600">
        Vector {label} appears here
      </div>
    )
  }
  const preview = data.vector.slice(0, 8)
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900 px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-zinc-500">Vector {label}</span>
        <span className="text-[10px] text-zinc-600">{data.vector.length} dims</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {preview.map((v, i) => (
          <span
            key={i}
            className={`font-mono text-[10px] px-1 rounded ${v >= 0 ? 'text-emerald-300/70 bg-emerald-500/5' : 'text-red-300/70 bg-red-500/5'}`}
          >
            {v.toFixed(3)}
          </span>
        ))}
        <span className="font-mono text-[10px] text-zinc-600 px-1">... +{data.vector.length - 8} more</span>
      </div>
      <div className="text-[10px] text-zinc-600">
        {data.tokens} tokens · ${data.cost.toFixed(7)}
      </div>
    </div>
  )
}