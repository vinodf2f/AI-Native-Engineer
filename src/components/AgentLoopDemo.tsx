import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { hasAnyApiKey } from '../lib/storage'
import { useExampleLang, EXAMPLES } from '../lib/exampleTexts'
import { runAgentLoop, type AgentStep } from '../services/agent'

const PRESET_DEFS = [
  { label: 'Wrong item → refund (3 tools)', key: 'wrongItem' as const },
  { label: 'Late order → what do I get?', key: 'lateOrder' as const },
  { label: 'Cancelled order refund', key: 'cancelled' as const },
  { label: 'Just a greeting (0 tools)', key: 'greeting' as const },
]

export function AgentLoopDemo() {
  const lang = useExampleLang()
  const PRESETS = PRESET_DEFS.map((p) => ({ label: p.label, text: EXAMPLES.agentLoop[p.key][lang] }))
  const [userText, setUserText] = useState(PRESETS[0].text)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [meta, setMeta] = useState<{ iterations: number; cost: number; tokens: number; stoppedBy: string } | null>(null)

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
              'You are QuickBite support. Use tools whenever you need live order data or policy text — as many steps as needed. Never invent order status or refund rules. When you have enough information, answer the user briefly in plain text.',
          },
          { role: 'user', content: userText },
        ],
        maxSteps: 5,
      })
      setSteps(result.steps)
      setMeta({
        iterations: result.iterations,
        cost: result.cost,
        tokens: result.promptTokens + result.completionTokens,
        stoppedBy: result.stoppedBy,
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="my-6 space-y-4">
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

      <div>
        <label className="block text-[12px] text-zinc-500 mb-1">User message</label>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          rows={2}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600 resize-y"
        />
      </div>

      <button
        type="button"
        onClick={run}
        disabled={loading || !userText.trim()}
        className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-[13px] font-medium text-white"
      >
        {loading ? 'Loop running (up to 5 iterations)…' : 'Run agent loop'}
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
              <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
                {s.type === 'tool_call' && (
                  <>
                    <p className="text-[11px] font-medium text-amber-300 mb-1">
                      Loop step — your code ran <span className="font-mono text-emerald-400">{s.name}</span>
                      <span className="text-zinc-600"> · {s.ms}ms</span>
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500 mb-1">
                      args: {JSON.stringify(s.args)}
                    </p>
                    <pre className="text-[11px] font-mono text-zinc-400 whitespace-pre-wrap overflow-x-auto max-h-32 bg-zinc-900 rounded px-2 py-1.5">
                      {JSON.stringify(s.result, null, 2)}
                    </pre>
                  </>
                )}
                {s.type === 'final' && (
                  <>
                    <p className="text-[11px] font-medium text-emerald-300 mb-1">
                      Stop — model answered in plain text (no tool_calls)
                    </p>
                    <p className="text-[13px] text-zinc-200 leading-relaxed">{s.content}</p>
                  </>
                )}
                {s.type === 'stopped' && (
                  <p className="text-[12px] text-red-300">
                    Hard stop: max steps reached. Without this guard a confused model could loop forever.
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
          <span>{meta.tokens} tokens</span>
          <span>stopped by: {meta.stoppedBy === 'final' ? 'model finished' : 'max steps'}</span>
        </div>
      )}
    </div>
  )
}
