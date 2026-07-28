import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LessonRef } from './LessonRef'
import { useExampleLang, EXAMPLES } from '../lib/exampleTexts'

type TraceStep = {
  kind: 'user' | 'think' | 'run' | 'final'
  iter?: number
  title: string
  body: string
  /** If set, body comes from EXAMPLES.trace[localKey] in the user's example language */
  localKey?: keyof typeof EXAMPLES.trace
  call?: { name: string; args: string }
  payloadNote?: string
}

const TRACE: TraceStep[] = [
  {
    kind: 'user',
    title: 'User message',
    body: '',
    localKey: 'userMsg',
    payloadNote: 'call 1 sends: system + user (2 messages)',
  },
  {
    kind: 'think',
    iter: 1,
    title: 'Iteration 1 — model decides',
    body: 'Needs live order data before it can say anything. It does not guess. It asks for a tool.',
    call: { name: 'get_order', args: '{ "order_id": "QB-8821" }' },
  },
  {
    kind: 'run',
    iter: 1,
    title: 'Your code runs it',
    body: '{ found: true, status: "delivered", issue_note: "wrong burger (veg instead of butter chicken)", total_inr: 420 }',
    payloadNote: 'call 2 sends: previous + tool result (4 messages)',
  },
  {
    kind: 'think',
    iter: 2,
    title: 'Iteration 2 — model decides',
    body: 'Knows the problem is real. Now it needs the rule: is wrong item refundable?',
    call: { name: 'check_refund_policy', args: '{ "reason": "wrong_item" }' },
  },
  {
    kind: 'run',
    iter: 2,
    title: 'Your code runs it',
    body: '{ policy: "Wrong item: full refund or free replacement within 30 minutes of delivery." }',
    payloadNote: 'call 3 sends: previous + tool result (6 messages)',
  },
  {
    kind: 'think',
    iter: 3,
    title: 'Iteration 3 — model decides',
    body: 'Policy allows it and the order is verified. It can act, not just talk.',
    call: { name: 'start_refund', args: '{ "order_id": "QB-8821", "amount_inr": 420, "reason": "wrong item" }' },
  },
  {
    kind: 'run',
    iter: 3,
    title: 'Your code runs it',
    body: '{ ok: true, refund_id: "RF-8821-7731", eta: "3–5 working days" }',
    payloadNote: 'call 4 sends: previous + tool result (8 messages)',
  },
  {
    kind: 'final',
    title: 'Stop — model returns no tool_calls',
    body: '',
    localKey: 'finalAnswer',
  },
]

const COLORS: Record<TraceStep['kind'], string> = {
  user: 'border-zinc-700 text-zinc-300',
  think: 'border-amber-500/40 text-amber-300',
  run: 'border-sky-500/40 text-sky-300',
  final: 'border-emerald-500/40 text-emerald-300',
}

export function AgentTraceDiagram() {
  const lang = useExampleLang()
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    if (step >= TRACE.length - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setStep((s) => s + 1), 2200)
    return () => clearTimeout(t)
  }, [step, playing])

  return (
    <div className="my-6 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {TRACE.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setStep(i); setPlaying(false) }}
              className={`w-2 h-2 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
          >
            {playing ? '⏸ pause' : '▶ play'}
          </button>
          <button
            type="button"
            onClick={() => { setStep(0); setPlaying(true) }}
            className="rounded border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
          >
            ↺ replay
          </button>
        </div>
      </div>

      <div className="space-y-2 min-h-[220px]">
        <AnimatePresence>
          {TRACE.slice(0, step + 1).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded border px-3 py-2 ${COLORS[s.kind]}`}
            >
              <p className="text-[11px] font-semibold mb-0.5">
                {s.title}
                {s.iter && <span className="text-zinc-500 font-normal"> · loop continues</span>}
              </p>
              <p className="text-[12px] text-zinc-300">{s.localKey ? EXAMPLES.trace[s.localKey][lang] : s.body}</p>
              {s.call && (
                <p className="text-[11px] font-mono mt-1 text-zinc-400">
                  <span className="text-emerald-400">{s.call.name}</span>({s.call.args})
                </p>
              )}
              {s.payloadNote && (
                <p className="text-[10px] font-mono mt-1 text-zinc-600">{s.payloadNote}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {step === TRACE.length - 1 && (
        <p className="text-[11px] text-zinc-500 mt-3">
          Count it: 4 model calls for one user question. Each call re-sends the growing transcript
          (<LessonRef id="bb3" />). This is why agents cost more than single-shot flows — and why the stop condition
          and max-steps guard exist.
        </p>
      )}
    </div>
  )
}
