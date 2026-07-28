import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { hasAnyApiKey } from '../lib/storage'
import { useExampleLang, EXAMPLES } from '../lib/exampleTexts'
import { runAgentLoop, type AgentStep, type GuardDecision, type GuardContext } from '../services/agent'

const REFUND_CAP_INR = 500

const PRESET_DEFS = [
  { label: 'Wrong item, fair refund (works)', key: 'wrongItem' as const },
  { label: 'Policy question only', key: 'policyQuestion' as const },
  { label: 'Angry user, ₹2000 demand (blocked)', key: 'angryBigRefund' as const },
]

const GUARD_RULES = [
  `Refunds above ₹${REFUND_CAP_INR} are blocked in code — the model is told to escalate instead`,
  'start_refund is blocked until get_order has verified the order in this conversation',
  'Hard stop after 5 loop iterations, whatever the model wants',
]

function guardToolCall(name: string, args: Record<string, unknown>, ctx: GuardContext): GuardDecision {
  if (name === 'start_refund') {
    const orderId = String(args.order_id ?? '').trim().toUpperCase()
    if (!ctx.fetchedOrders.has(orderId)) {
      return {
        allow: false,
        result: {
          ok: false,
          error: 'verify_first',
          message: 'Call get_order for this order before starting a refund. Never refund an unverified order.',
        },
      }
    }
    const amount = Number(args.amount_inr)
    if (Number.isFinite(amount) && amount > REFUND_CAP_INR) {
      return {
        allow: false,
        result: {
          ok: false,
          error: 'refund_cap_exceeded',
          message: `Refunds above ₹${REFUND_CAP_INR} need human approval. Call escalate_to_human with the details.`,
        },
      }
    }
  }
  return { allow: true }
}

export function SupportAgentDemo() {
  const lang = useExampleLang()
  const PRESETS = PRESET_DEFS.map((p) => ({ label: p.label, text: EXAMPLES.supportAgent[p.key][lang] }))
  const [userText, setUserText] = useState(PRESETS[0].text)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [meta, setMeta] = useState<{ iterations: number; cost: number; stoppedBy: string } | null>(null)

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

  async function run() {
    setLoading(true)
    setError(null)
    setSteps([])
    setMeta(null)
    try {
      const result = await runAgentLoop({
        messages: [
          {
            role: 'system',
            content:
              'You are QuickBite support, running as an agent. Verify orders with get_order before any refund. Check policy with check_refund_policy before promising anything. If a refund is blocked or the issue is outside policy, call escalate_to_human. Keep answers short and human.',
          },
          { role: 'user', content: userText },
        ],
        maxSteps: 5,
        guardToolCall,
      })
      setSteps(result.steps)
      setMeta({ iterations: result.iterations, cost: result.cost, stoppedBy: result.stoppedBy })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="my-6 space-y-4">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-amber-300/90 mb-1.5">
          Guard rules enforced by your code (not the prompt)
        </p>
        <ul className="list-disc ml-4 space-y-0.5">
          {GUARD_RULES.map((r) => (
            <li key={r} className="text-[12px] text-amber-200/70">{r}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setUserText(p.text)}
            className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        value={userText}
        onChange={(e) => setUserText(e.target.value)}
        rows={2}
        className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600 resize-y"
      />

      <button
        type="button"
        onClick={run}
        disabled={loading || !userText.trim()}
        className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-[13px] font-medium text-white"
      >
        {loading ? 'Agent working…' : 'Run support agent'}
      </button>

      {error && (
        <p className="text-[13px] text-red-300 rounded border border-red-500/30 bg-red-500/5 px-3 py-2">
          {error}
        </p>
      )}

      <AnimatePresence>
        {steps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2.5 ${
                  s.type === 'tool_call' && s.blocked
                    ? 'border-red-500/40 bg-red-500/5'
                    : 'border-zinc-800 bg-zinc-950/50'
                }`}
              >
                {s.type === 'tool_call' && (
                  <>
                    <p className="text-[11px] font-medium mb-1">
                      {s.blocked ? (
                        <span className="text-red-400">⛔ Blocked by guard rule — never executed</span>
                      ) : (
                        <span className="text-amber-300">
                          Ran <span className="font-mono text-emerald-400">{s.name}</span>
                        </span>
                      )}
                      {!s.blocked && <span className="text-zinc-600"> · {s.ms}ms</span>}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500 mb-1">
                      {s.name}({JSON.stringify(s.args)})
                    </p>
                    <pre className="text-[11px] font-mono text-zinc-400 whitespace-pre-wrap overflow-x-auto max-h-32 bg-zinc-900 rounded px-2 py-1.5">
                      {JSON.stringify(s.result, null, 2)}
                    </pre>
                  </>
                )}
                {s.type === 'final' && (
                  <>
                    <p className="text-[11px] font-medium text-emerald-300 mb-1">Agent's final answer</p>
                    <p className="text-[13px] text-zinc-200 leading-relaxed">{s.content}</p>
                  </>
                )}
                {s.type === 'stopped' && (
                  <p className="text-[12px] text-red-300">
                    Hard stop: 5 iterations used. Production behavior: hand off to a human with this trace.
                  </p>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {meta && (
        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-zinc-500">
          <span>{meta.iterations} iteration(s)</span>
          <span>${meta.cost.toFixed(6)}</span>
          <span>stopped by: {meta.stoppedBy === 'final' ? 'model finished' : 'max steps'}</span>
        </div>
      )}
    </div>
  )
}
