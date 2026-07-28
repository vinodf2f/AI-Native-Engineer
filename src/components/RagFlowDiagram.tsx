import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../lib/theme'
import { LessonRef } from './LessonRef'

type Stage = 'query' | 'embed' | 'search' | 'rank' | 'result'

type ExampleQuery = {
  query: string
  chunks: { text: string; score: number; tag: string }[]
}

const EXAMPLES: ExampleQuery[] = [
  {
    query: 'How do I cancel my train ticket?',
    chunks: [
      { text: 'To cancel a confirmed train ticket, go to IRCTC Booked History and click Cancel.', score: 0.84, tag: 'train / cancel' },
      { text: 'Refund for cancelled trains is credited within 5-7 working days.', score: 0.71, tag: 'train / refund' },
      { text: 'Tatkal tickets can be cancelled only up to 24 hours before departure.', score: 0.58, tag: 'train / tatkal' },
      { text: 'GST returns must be filed monthly by the 20th of next month.', score: 0.19, tag: 'gst / unrelated' },
    ],
  },
  {
    query: 'refund kaise milega',
    chunks: [
      { text: 'Refund for cancelled trains is credited within 5-7 working days.', score: 0.78, tag: 'train / refund' },
      { text: 'To cancel a confirmed train ticket, go to IRCTC Booked History and click Cancel.', score: 0.69, tag: 'train / cancel' },
      { text: 'Tatkal tickets can be cancelled only up to 24 hours before departure.', score: 0.49, tag: 'train / tatkal' },
      { text: 'To apply for a new PAN card, submit Form 49A at the NSDL portal.', score: 0.21, tag: 'pan / unrelated' },
    ],
  },
  {
    query: 'How to file GST return online',
    chunks: [
      { text: 'GST returns must be filed monthly by the 20th of next month.', score: 0.81, tag: 'gst / direct' },
      { text: 'To apply for a new PAN card, submit Form 49A at the NSDL portal.', score: 0.34, tag: 'pan / tax docs' },
      { text: 'To cancel a confirmed train ticket, go to IRCTC Booked History and click Cancel.', score: 0.16, tag: 'train / unrelated' },
      { text: 'Refund for cancelled trains is credited within 5-7 working days.', score: 0.14, tag: 'train / unrelated' },
    ],
  },
]

const STAGES: { key: Stage; label: string; sub: string }[] = [
  { key: 'query', label: '1. User query', sub: 'Plain text typed by user' },
  { key: 'embed', label: '2. Embed query', sub: 'API call: OpenAI /v1/embeddings → 1536-dim vector' },
  { key: 'search', label: '3. Cosine vs every chunk', sub: 'Compare query vector with each stored chunk' },
  { key: 'rank', label: '4. Sort by score', sub: 'Highest cosine = most semantically similar' },
  { key: 'result', label: '5. Return top-k', sub: 'Send ranked text chunks to LLM (next: RAG lesson)' },
]

export function RagFlowDiagram() {
  const [exIdx, setExIdx] = useState(0)
  const [stage, setStage] = useState<Stage>('query')
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<1 | 0.5 | 2>(1)
  const example = EXAMPLES[exIdx]
  const theme = useTheme()

  const col = {
    activeBorder: theme === 'dark' ? '#10b981' : '#059669',
    activeBg: theme === 'dark' ? 'rgba(16,185,129,0.08)' : 'rgba(5,150,105,0.10)',
    doneBorder: theme === 'dark' ? '#3f3f46' : '#d4d4d8',
    inactiveBorder: theme === 'dark' ? '#27272a' : '#e4e4e7',
    inactiveBg: theme === 'dark' ? 'rgba(24,24,27,0.4)' : 'rgba(244,244,245,0.6)',
    panel: theme === 'dark' ? 'rgba(24,24,27,0.4)' : 'rgba(244,244,245,0.7)',
  }

  useEffect(() => {
    if (!playing) return
    const order: Stage[] = ['query', 'embed', 'search', 'rank', 'result']
    let i = order.indexOf(stage)
    const t = setTimeout(() => {
      const next = order[(i + 1) % order.length]
      if (next === 'query') setExIdx((p) => (p + 1) % EXAMPLES.length)
      setStage(next)
    }, (stage === 'result' ? 3200 : 1800) / speed)
    return () => clearTimeout(t)
  }, [stage, exIdx, playing, speed])

  function rankColor(score: number) {
    const hue = Math.max(0, Math.min(120, (score - 0.1) * 150))
    return `hsl(${hue}, 70%, 55%)`
  }

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-5 light:bg-white light:border-zinc-300">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-zinc-200">How the full RAG flow works</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStage('query')}
            className="rounded border border-zinc-700 hover:border-zinc-500 px-2 py-1 text-[11px] text-zinc-400"
            title="Restart"
          >
            ↺
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded border border-zinc-700 hover:border-zinc-500 px-2 py-1 text-[11px] text-zinc-400"
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <div className="flex gap-0.5 rounded border border-zinc-700 overflow-hidden">
            {([0.5, 1, 2] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-1 text-[11px] font-mono ${speed === s ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
              >
                {s}×
              </button>
            ))}
          </div>
          <div className="ml-2 flex gap-1">
            {EXAMPLES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setExIdx(i); setStage('query') }}
                className={`h-1.5 w-6 rounded-full transition-colors ${i === exIdx ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-4">
        {/* Left: stage pipeline */}
        <div className="space-y-2">
          {STAGES.map((s, i) => {
            const active = stage === s.key
            const done = STAGES.findIndex((x) => x.key === stage) > i
            return (
              <motion.div
                key={s.key}
                animate={{
                  borderColor: active ? col.activeBorder : done ? col.doneBorder : col.inactiveBorder,
                  backgroundColor: active ? col.activeBg : col.inactiveBg,
                }}
                className="rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[11px] ${active ? 'text-emerald-300 light:text-emerald-700' : done ? 'text-zinc-400' : 'text-zinc-600 light:text-zinc-500'}`}>
                    {done ? '✓' : active ? '▶' : '○'}
                  </span>
                  <span className={`text-[13px] font-medium ${active ? 'text-emerald-200 light:text-emerald-800' : done ? 'text-zinc-300 light:text-zinc-800' : 'text-zinc-500 light:text-zinc-600'}`}>
                    {s.label}
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 ${active ? 'text-emerald-300/70 light:text-emerald-700/70' : 'text-zinc-600 light:text-zinc-500'}`}>{s.sub}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Right: live state */}
        <div className="space-y-3 min-h-[280px]">
          {/* Query chip */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 light:bg-zinc-100 light:border-zinc-300">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">User query</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={exIdx + '-' + stage}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[13px] text-zinc-100 font-medium"
              >
                "{example.query}"
              </motion.div>
            </AnimatePresence>
            {stage === 'embed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 font-mono text-[10px] text-emerald-400/70 bg-emerald-500/5 px-2 py-1 rounded inline-block light:text-emerald-700 light:bg-emerald-100"
              >
                POST /v1/embeddings → [0.083, -0.391, 0.918, … 1536 dims]
              </motion.div>
            )}
          </div>

          {/* Result chunks */}
          {(stage === 'search' || stage === 'rank' || stage === 'result') && (
            <div className="space-y-1.5">
              {example.chunks
                .slice()
                .sort((a, b) => stage === 'rank' || stage === 'result' ? b.score - a.score : 0)
                .map((c, i) => {
                  const dim = stage === 'search' ? 0.55 : 1
                  return (
                    <motion.div
                      key={c.text}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: dim, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 light:bg-zinc-100 light:border-zinc-300"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden light:bg-zinc-300">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${c.score * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="h-full rounded-full"
                            style={{ background: rankColor(c.score) }}
                          />
                        </div>
                        <span className="font-mono text-[11px]" style={{ color: rankColor(c.score) }}>
                          {c.score.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[12px] text-zinc-400 leading-snug light:text-zinc-700">{c.text}</p>
                      <p className="text-[9px] text-zinc-600 mt-0.5 light:text-zinc-500">{c.tag}</p>
                    </motion.div>
                  )
                })}
            </div>
          )}

          {stage === 'result' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300 light:bg-emerald-50 light:border-emerald-600 light:text-emerald-800"
            >
              → These top-3 chunks get sent to the LLM as context. <LessonRef id="b4">The RAG lesson</LessonRef> covers how that answer is generated.
            </motion.div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-zinc-600 mt-4 text-center light:text-zinc-500">
        {playing ? 'Auto-playing' : 'Paused'} · {speed}× speed · 3 example queries (incl. one Hinglish). Click dots to jump or use ⏸/▶ to control playback.
      </p>
    </div>
  )
}