import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { VectorStore, type SearchResult } from '../services/vectorStore'
import { hasAnyApiKey } from '../lib/storage'

const SEED_DOCS = [
  'To cancel a confirmed train ticket, log in to IRCTC, go to My Transactions, select Booked History, and click Cancel.',
  'Refund for cancelled trains is automatically credited to the original payment method within 5-7 working days.',
  'Tatkal tickets can be cancelled only up to 24 hours before departure; no refund after that.',
  'To file a TDR for a missed train, visit the TDR portal under My Transactions within 72 hours of departure.',
  'How to book a retiring room at a railway station: apply online at irctctourism.com up to 60 days in advance.',
  'Vande Bharat Express offers optionally catered meals; veg and non-veg options are available at the time of booking.',
  'GST returns must be filed monthly via the GST portal; due date is the 20th of the following month.',
  'To apply for a new PAN card, submit Form 49A online at the NSDL portal with Aadhaar-linked identity proof.',
]

export function VectorStoreDemo() {
  const storeRef = useRef<VectorStore>(new VectorStore())
  const [query, setQuery] = useState('How do I cancel my train ticket?')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [addedSeed, setAddedSeed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [customText, setCustomText] = useState('')

  const hasKey = hasAnyApiKey()
  if (!hasKey) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-5 py-4 my-6">
        <p className="text-[13px] text-red-200">
          Add an API key in <a href="/settings" className="underline">Settings</a>.
        </p>
      </div>
    )
  }

  const search = useQuery({
    queryKey: ['vector-search', submittedQuery],
    queryFn: () => storeRef.current.search(submittedQuery, 5),
    enabled: Boolean(submittedQuery),
  })

  async function addSeed() {
    setAdding(true)
    try {
      for (const doc of SEED_DOCS) {
        await storeRef.current.add(doc, { source: 'IRCTC FAQ' })
      }
      setAddedSeed(true)
    } finally {
      setAdding(false)
    }
  }

  async function addCustom() {
    if (!customText.trim()) return
    setAdding(true)
    try {
      await storeRef.current.add(customText.trim(), { source: 'user' })
      setCustomText('')
    } finally {
      setAdding(false)
    }
  }

  function runSearch() {
    if (query.trim()) setSubmittedQuery(query.trim())
    else search.refetch()
  }

  function clearAll() {
    storeRef.current.clear()
    setAddedSeed(false)
    setSubmittedQuery('')
    search.refetch()
  }

  const storeSize = storeRef.current.size()

  return (
    <div className="my-6 space-y-5">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-zinc-500">In-browser vector store</span>
          <span className="text-[11px] font-mono text-zinc-600">{storeSize} chunks</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {!addedSeed && (
            <button
              onClick={addSeed}
              disabled={adding}
              className="rounded bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-[12px] text-white disabled:opacity-50"
            >
              {adding ? 'Embedding…' : '+ Add 8 IRCTC sample docs'}
            </button>
          )}
          {addedSeed && (
            <button
              onClick={clearAll}
              className="rounded border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 text-[12px] text-zinc-400"
            >
              Clear store
            </button>
          )}
        </div>

        {addedSeed && (
          <div className="mt-3 flex gap-2">
            <input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Add your own document chunk…"
              className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[12px] text-zinc-200 outline-none focus:border-zinc-600"
            />
            <button
              onClick={addCustom}
              disabled={adding || !customText.trim()}
              className="rounded bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 text-[12px] text-white disabled:opacity-50"
            >
              Embed + add
            </button>
          </div>
        )}
      </div>

      {addedSeed && (
        <>
          <div>
            <label className="block text-[12px] text-zinc-500 mb-1">Query</label>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask something…"
                className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600"
              />
              <button
                onClick={runSearch}
                disabled={search.isFetching}
                className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-[13px] text-white disabled:opacity-50"
              >
                {search.isFetching ? 'Searching…' : 'Search'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-600 mt-1">top-5 nearest chunks by cosine similarity</p>
          </div>

          {search.error && (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
              {String((search.error as Error).message)}
            </div>
          )}

          <AnimatePresence>
            {search.data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {search.data.map((r: SearchResult) => <ResultCard key={r.id} r={r} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

function ResultCard({ r }: { r: SearchResult }) {
  const hue = Math.max(0, Math.min(120, (r.score - 0.1) * 150))
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: r.rank * 0.06 }}
      className="rounded border border-zinc-800 bg-zinc-900 px-4 py-3"
    >
      <div className="flex items-center gap-3 mb-1">
        <span className="font-mono text-[11px] text-zinc-600 w-6">#{r.rank}</span>
        <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full"
            style={{ width: `${r.score * 100}%`, background: `hsl(${hue}, 70%, 50%)` }}
          />
        </div>
        <span className="font-mono text-[12px]" style={{ color: `hsl(${hue}, 70%, 60%)` }}>
          {r.score.toFixed(4)}
        </span>
      </div>
      <p className="text-[13px] text-zinc-300">{r.text}</p>
      <p className="text-[10px] text-zinc-600 mt-1">{r.metadata.source} · id {r.id}</p>
    </motion.div>
  )
}