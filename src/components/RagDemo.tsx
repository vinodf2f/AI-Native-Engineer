import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RagPipeline, chunkText, type ChunkingStrategy, type RagAnswer } from '../services/rag'
import { loadSettings } from '../lib/storage'

const SAMPLE_DOC = `IRCTC Ticket Cancellation Policy

To cancel a confirmed train ticket, log in to the IRCTC website or app, go to My Transactions, then select Booked History. Click Cancel next to the booking you want to cancel.

Refund for cancelled trains is automatically credited to the original payment method within 5 to 7 working days. No action is required from the passenger.

Tatkal tickets can be cancelled only up to 24 hours before the scheduled departure of the train. No refund is provided after that window.

If you miss a train, file a TDR through the IRCTC TDR portal within 72 hours of departure. Refund processing for TDR cases takes 60 to 90 days.

Vande Bharat Express trains offer optionally catered meals. Both veg and non-veg options can be selected at the time of booking.

Retiring rooms at railway stations can be booked online at irctctourism.com up to 60 days in advance. Valid ID proof is required at check-in.`

export function RagDemo() {
  const pipelineRef = useRef<RagPipeline | null>(null)
  const [doc] = useState(SAMPLE_DOC)
  const [strategy, setStrategy] = useState<ChunkingStrategy>('recursive')
  const [chunkSize, setChunkSize] = useState(120)
  const [overlap, setOverlap] = useState(20)
  const [previewChunks, setPreviewChunks] = useState<string[]>([])
  const [ingested, setIngested] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [query, setQuery] = useState('How do I cancel my train ticket?')
  const [result, setResult] = useState<RagAnswer | null>(null)
  const [answering, setAnswering] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    setPreviewChunks(chunkText(doc, strategy, chunkSize, overlap))
  }, [doc, strategy, chunkSize, overlap])

  async function ingest() {
    setIngesting(true); setError(null); setResult(null)
    try {
      const pipeline = new RagPipeline()
      pipelineRef.current = pipeline
      await pipeline.ingest([{ text: doc, source: 'IRCTC Policy Doc' }], strategy)
      setIngested(true)
    } catch (e) {
      setError(String((e as Error).message))
    } finally {
      setIngesting(false)
    }
  }

  async function answer() {
    if (!pipelineRef.current || !query.trim()) return
    setAnswering(true); setError(null); setResult(null)
    try {
      const r = await pipelineRef.current.answer(query, 3)
      setResult(r)
    } catch (e) {
      setError(String((e as Error).message))
    } finally {
      setAnswering(false)
    }
  }

  function reset() {
    pipelineRef.current = null
    setIngested(false); setResult(null); setError(null)
  }

  return (
    <div className="my-6 space-y-5">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <p className="text-[12px] text-zinc-500 mb-2">Sample document (one IRCTC cancellation policy)</p>
        <pre className="text-[11.5px] font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto scrollbar-thin">{doc}</pre>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] text-zinc-600 mb-1">Chunking strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as ChunkingStrategy)}
            className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[12px] text-zinc-200"
          >
            <option value="recursive">Recursive (paragraph-aware)</option>
            <option value="fixed">Fixed size</option>
            <option value="sentence">Sentence-based</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-zinc-600 mb-1">Chunk size (chars): {chunkSize}</label>
          <input type="range" min={50} max={300} step={10} value={chunkSize} onChange={(e) => setChunkSize(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="block text-[11px] text-zinc-600 mb-1">Overlap: {overlap}</label>
          <input type="range" min={0} max={60} step={5} value={overlap} onChange={(e) => setOverlap(+e.target.value)} className="w-full" />
        </div>
      </div>

      <div>
        <p className="text-[11px] text-zinc-600 mb-2">Preview: {previewChunks.length} chunks</p>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto scrollbar-thin">
          {previewChunks.map((c, i) => (
            <div key={i} className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-2">
              <div className="font-mono text-[10px] text-zinc-600 mb-1">chunk #{i + 1} · {c.length} chars</div>
              <div className="text-[11.5px] text-zinc-400 line-clamp-3">{c}</div>
            </div>
          ))}
        </div>
      </div>

      {!ingested ? (
        <button
          onClick={ingest}
          disabled={ingesting}
          className="rounded bg-sky-600 hover:bg-sky-500 px-4 py-2 text-[13px] text-white disabled:opacity-50"
        >
          {ingesting ? 'Embedding chunks…' : `Embed ${previewChunks.length} chunks → store`}
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <span className="text-[12px] text-emerald-400">✓ {pipelineRef.current?.chunkCount ?? 0} chunks embedded & stored</span>
          <button onClick={reset} className="text-[12px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2">reset</button>
        </div>
      )}

      {ingested && (
        <>
          <div className="border-t border-zinc-800 pt-4">
            <label className="block text-[12px] text-zinc-500 mb-1">Question</label>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600"
              />
              <button
                onClick={answer}
                disabled={answering}
                className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-[13px] text-white disabled:opacity-50"
              >
                {answering ? 'Answering…' : 'Ask'}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">{error}</div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <p className="text-[12px] text-zinc-500 mb-2">Answer (grounded in retrieved chunks)</p>
                  <p className="text-[14px] text-zinc-200 leading-relaxed">{result.answer}</p>
                  <p className="mt-3 text-[10px] text-zinc-600 font-mono">cost: ${result.totalCost.toFixed(6)}</p>
                </div>

                <p className="text-[12px] text-zinc-500">Citations (top-3 retrieved)</p>
                <div className="space-y-2">
                  {result.citations.map((c) => (
                    <div key={c.id} className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-zinc-600">[{c.rank}]</span>
                        <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${c.score * 100}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-emerald-400">{c.score.toFixed(3)}</span>
                      </div>
                      <p className="text-[12px] text-zinc-400">{c.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}