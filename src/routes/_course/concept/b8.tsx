import { useState, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { RagPipeline } from '../../../services/rag'
import { streamChatCompletion } from '../../../services/streaming'
import { hasAnyApiKey, resolveTask, setStatus } from '../../../lib/storage'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { RagFlowDiagram } from '../../../components/RagFlowDiagram'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'

export const Route = createFileRoute('/_course/concept/b8')({
  component: B8Page,
})

const SAMPLE_DOC = `IRCTC Ticket Cancellation Policy

To cancel a confirmed train ticket, log in to the IRCTC website or app, go to My Transactions, then select Booked History. Click Cancel next to the booking you want to cancel.

Refund for cancelled trains is automatically credited to the original payment method within 5 to 7 working days. No action is required from the passenger.

Tatkal tickets can be cancelled only up to 24 hours before the scheduled departure of the train. No refund is provided after that window.

If you miss a train, file a TDR through the IRCTC TDR portal within 72 hours of departure. Refund processing for TDR cases takes 60 to 90 days.`

const { prev, next } = getNeighbors('b8')

function B8Page() {
  const [query, setQuery] = useState('How do I cancel my train ticket?')
  const [chunks, setChunks] = useState<{ text: string; score: number }[] | null>(null)
  const [streamingOutput, setStreamingOutput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'ingesting' | 'ready' | 'done'>('idle')
  const [cost, setCost] = useState<{ embed: number; completion: number; total: number } | null>(null)
  const [log, setLog] = useState<string>('')
  const abortRef = useRef<AbortController | null>(null)
  const pipelineRef = useRef<RagPipeline | null>(null)

  const hasKey = hasAnyApiKey()
  if (!hasKey) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
        <p className="text-[13px] text-red-400">No API key. Add one in Settings.</p>
      </div>
    )
  }

  async function ingest() {
    setPhase('ingesting')
    const p = new RagPipeline()
    pipelineRef.current = p
    await p.ingest([{ text: SAMPLE_DOC, source: 'IRCTC Policy' }], 'recursive')
    setPhase('ready')
  }

  async function ask() {
    if (!pipelineRef.current || !query.trim()) return
    setPhase('done')
    setStreamingOutput('')
    setChunks(null)
    setCost(null)
    setLog('')

    const pipeline = pipelineRef.current
    const citations = await pipeline.store.search(query, 3)
    setChunks(citations.map((c) => ({ text: c.text, score: c.score })))

    const context = citations.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n')
    const embedCost = citations.reduce((s, c) => s + c.embeddingCost, 0)
    setLog(`Retrieved ${citations.length} chunks\n`)

    setStreaming(true)
    const ac = new AbortController()
    abortRef.current = ac
    let full = ''
    setLog((prev) => prev + 'Streaming answer...\n')

    await streamChatCompletion(
      [
        { role: 'system', content: 'Answer using only the context below. Cite sources as [1], [2]. Say if you don\'t know.' },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` },
      ],
      resolveTask('stream').model,
      ac.signal,
      {
        onToken: (t) => {
          full += t
          setStreamingOutput(full)
        },
        onDone: (final) => {
          setStreaming(false)
          setLog((prev) => prev + `Answer complete (${final.length} chars)\n`)
          setCost({ embed: embedCost, completion: 0.001, total: embedCost + 0.001 })
        },
        onError: (e) => {
          setLog((prev) => prev + `Error: ${e}\n`)
          setStreaming(false)
        },
      },
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">{sectionLabel('foundations')}</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Put it together</h1>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300 mb-6">
        <p>
          You built each Foundations piece on its own. Here they run as one system:
          document → chunk → embed → store → retrieve → prompt → stream → log.
        </p>
      </section>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-100 mb-1">Watch it move</h2>
        <p className="text-[12px] text-zinc-500 mb-3">
          Retrieval flow with example queries. Then try the live pipeline below.
        </p>
        <RagFlowDiagram />
      </div>

      <h2 className="text-sm font-semibold text-zinc-100 mb-3">Try the full flow live</h2>

      <section className="space-y-4">
        {phase === 'idle' && (
          <button
            onClick={ingest}
            className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[13px] text-white"
          >
            Ingest IRCTC policy doc
          </button>
        )}

        {phase === 'ingesting' && <p className="text-[13px] text-zinc-500 animate-pulse">Embedding chunks...</p>}

        {phase === 'ready' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-[12px] text-emerald-400">✓ Document embedded. Ask a question.</p>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600"
              />
              <button
                onClick={ask}
                disabled={streaming}
                className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-[13px] text-white disabled:opacity-50"
              >
                {streaming ? 'Streaming...' : 'Ask'}
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'done' && !streaming && (
          <div className="flex gap-2">
            <button
              onClick={() => { setPhase('ready'); setStreamingOutput(''); setChunks(null); setCost(null); setLog('') }}
              className="rounded border border-zinc-700 hover:border-zinc-500 px-3 py-2 text-[13px] text-zinc-400"
            >
              Ask another question
            </button>
            <button
              onClick={() => { setPhase('idle'); pipelineRef.current = null }}
              className="rounded border border-zinc-700 hover:border-zinc-500 px-3 py-2 text-[13px] text-zinc-400"
            >
              Re-ingest doc
            </button>
          </div>
        )}

        {chunks && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <p className="text-[12px] text-zinc-500">Top-3 chunks (B2/B3/B4)</p>
            {chunks.map((c, i) => (
              <div key={i} className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-zinc-600">[{i + 1}]</span>
                  <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${c.score * 100}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400">{c.score.toFixed(3)}</span>
                </div>
                <p className="text-[12px] text-zinc-400">{c.text}</p>
              </div>
            ))}
          </motion.div>
        )}

        {streamingOutput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
            <p className="text-[12px] text-zinc-500 mb-2">
              Answer (B1/B5/B6)
              {streaming && <span className="ml-2 inline-block w-2 h-3.5 bg-emerald-500 align-middle animate-pulse" />}
            </p>
            <p className="text-[14px] text-zinc-200 leading-relaxed">{streamingOutput}</p>
          </motion.div>
        )}

        {cost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded border border-zinc-800 bg-zinc-900/50 px-4 py-3 grid grid-cols-3 gap-2 text-center text-[12px]">
            <div><span className="font-mono text-emerald-400">${cost.total.toFixed(6)}</span><p className="text-zinc-500 text-[10px] mt-0.5">Total cost</p></div>
            <div><span className="font-mono text-zinc-300">{cost.embed.toFixed(6)}</span><p className="text-zinc-500 text-[10px] mt-0.5">Embed query</p></div>
            <div><span className="font-mono text-zinc-300">{cost.completion.toFixed(6)}</span><p className="text-zinc-500 text-[10px] mt-0.5">Completion (approx)</p></div>
          </motion.div>
        )}

        {log && (
          <div className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-600 leading-relaxed">
            <p className="text-[10px] text-zinc-700 mb-1">Eval log (B7)</p>
            {log.split('\n').map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </section>

      <Quiz
        questions={[
          {
            prompt: 'This page combined 7 concepts. Which one is missing from a production-ready assistant?',
            options: [
              'B1 (chat completion)   the SSRFetch stream response was generated by an LLM',
              'B2 (embeddings)   the query was embedded to find chunks',
              'B3 (vector store)   cosine similarity ranked the chunks',
              'None   all 7 concepts took part. The only thing not shown is a production eval suite running continuously.',
            ],
            answer: 3,
            explanation: 'Every concept contributed. B1 generated the answer, B2/B3 found chunks, B4 chunked the doc, B5 provided the system prompt, B6 streamed it, B7 logged it. A production system would add scheduled eval runs to catch regressions automatically.',
          },
          {
            prompt: 'If you were to deploy this as a real product tomorrow, what would you add beyond what\'s shown here?',
            options: [
              'Nothing   this is production-ready',
              'A backend proxy (so the API key is not exposed in every browser), rate limiting, user auth, and eval monitoring',
              'A better UI with React Native',
              'More documents to ingest',
            ],
            answer: 1,
            explanation: 'The API key sits in localStorage (ok for learning, not for production). A real deployment proxies through your own backend, adds rate limiting per user, persists history, and monitors response quality with a continuous eval pipeline.',
          },
        ]}
        onComplete={() => setStatus('b8', 'complete')}
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}