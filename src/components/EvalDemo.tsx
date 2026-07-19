import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DEFAULT_EVAL_SET, scoreAnswer, type EvalResult } from '../services/eval'
import { RagPipeline } from '../services/rag'
import { hasAnyApiKey } from '../lib/storage'

const SAMPLE_DOC = `IRCTC Ticket Cancellation Policy

To cancel a confirmed train ticket, log in to the IRCTC website or app, go to My Transactions, then select Booked History. Click Cancel next to the booking you want to cancel.

Refund for cancelled trains is automatically credited to the original payment method within 5 to 7 working days. No action is required from the passenger.

Tatkal tickets can be cancelled only up to 24 hours before the scheduled departure of the train. No refund is provided after that window.

If you miss a train, file a TDR through the IRCTC TDR portal within 72 hours of departure. Refund processing for TDR cases takes 60 to 90 days.`

export function EvalDemo() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<EvalResult[]>([])
  const [logLines, setLogLines] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

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

  function log(s: string) {
    setLogLines((l) => [...l, s])
  }

  async function run() {
    setRunning(true); setResults([]); setLogLines([]); setProgress(0)
    try {
      const pipeline = new RagPipeline()
      log(`Ingesting IRCTC policy doc...`)
      await pipeline.ingest([{ text: SAMPLE_DOC, source: 'IRCTC Policy' }], 'recursive')
      log(`✓ ${pipeline.chunkCount} chunks embedded`)
      log(`Running ${DEFAULT_EVAL_SET.length} eval cases...\n`)

      const out: EvalResult[] = []
      for (let i = 0; i < DEFAULT_EVAL_SET.length; i++) {
        const c = DEFAULT_EVAL_SET[i]
        log(`[${i + 1}/${DEFAULT_EVAL_SET.length}] Q: "${c.query}"`)
        const answer = await pipeline.answer(c.query, 3)
        log(`   → "${answer.answer.slice(0, 80)}${answer.answer.length > 80 ? '…' : ''}"`)
        const sc = await scoreAnswer(answer.answer, c.expectedAnswer, c.expectedKeywords)
        const passed = sc.semanticScore > 0.5 && sc.keywordScore >= 0.5
        log(`   semantic=${sc.semanticScore.toFixed(3)}  keyword=${(sc.keywordScore * 100).toFixed(0)}%  ${passed ? '✓ PASS' : '✗ FAIL'}\n`)
        out.push({
          caseId: c.id, query: c.query,
          actualAnswer: answer.answer, expectedAnswer: c.expectedAnswer,
          semanticScore: sc.semanticScore, keywordScore: sc.keywordScore,
          keywordHits: sc.hits, keywordMisses: sc.misses, passed,
        })
        setProgress(i + 1)
        setResults([...out])
      }
      const passed = out.filter((r) => r.passed).length
      log(`Done. ${passed}/${out.length} passed.`)
    } finally {
      setRunning(false)
    }
  }

  const passCount = results.filter((r) => r.passed).length

  return (
    <div className="my-6 space-y-4">
      <button
        onClick={run}
        disabled={running}
        className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[13px] text-white disabled:opacity-50"
      >
        {running ? `Running eval… (${progress}/${DEFAULT_EVAL_SET.length})` : 'Run eval suite'}
      </button>

      {results.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-zinc-300 font-medium">Eval summary</span>
            <span className={`font-mono text-[14px] ${passCount === results.length ? 'text-emerald-400' : 'text-amber-400'}`}>
              {passCount}/{results.length} passed
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              animate={{ width: `${(passCount / results.length) * 100}%` }}
              className={`h-full ${passCount === results.length ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {results.map((r) => (
          <motion.div
            key={r.caseId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${r.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {r.passed ? 'PASS' : 'FAIL'}
              </span>
              <span className="text-[13px] text-zinc-300">{r.query}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="text-[11px]">
                <div className="text-zinc-500 mb-1">Actual</div>
                <div className="text-zinc-300">{r.actualAnswer}</div>
              </div>
              <div className="text-[11px]">
                <div className="text-zinc-500 mb-1">Expected</div>
                <div className="text-zinc-300">{r.expectedAnswer}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
              <span className={r.semanticScore > 0.5 ? 'text-emerald-400' : 'text-red-400'}>
                semantic {r.semanticScore.toFixed(3)}
              </span>
              <span className={r.keywordScore >= 0.5 ? 'text-emerald-400' : 'text-red-400'}>
                keyword {(r.keywordScore * 100).toFixed(0)}%
              </span>
              {r.keywordMisses.length > 0 && (
                <span className="text-red-400">missing: {r.keywordMisses.join(', ')}</span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {logLines.length > 0 && (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-500 max-h-56 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
          {logLines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  )
}