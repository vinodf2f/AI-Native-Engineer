import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { hasAnyApiKey } from '../lib/storage'
import { useExampleLang, EXAMPLES } from '../lib/exampleTexts'
import { createToolCompletion } from '../services/openai'
import { QUICKBITE_TOOLS, type ToolRunLog, type ToolCallRequest } from '../services/tools'

const PRESET_DEFS = [
  { label: 'Wrong item + refund?', key: 'wrongItemRefund' as const },
  { label: 'Where is my order?', key: 'orderStatus' as const },
  { label: 'Just say hi (no tool)', key: 'greeting' as const },
]

type StepView =
  | { type: 'tool_calls'; calls: ToolCallRequest[] }
  | { type: 'tool_results'; logs: ToolRunLog[] }
  | { type: 'final'; content: string }
  | { type: 'assistant_text'; content: string; finishReason: string }

export function ToolCallingDemo() {
  const lang = useExampleLang()
  const PRESETS = PRESET_DEFS.map((p) => ({ label: p.label, text: EXAMPLES.tools[p.key][lang] }))
  const [userText, setUserText] = useState(PRESETS[0].text)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<StepView[]>([])
  const [meta, setMeta] = useState<{
    cost: number
    model: string
    provider: string
    usedTools: boolean
    tokens: number
  } | null>(null)

  const hasKey = hasAnyApiKey()
  if (!hasKey) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-5 py-4 my-6">
        <p className="text-[13px] text-red-200">
          Add an API key in <a href="/settings" className="underline">Settings</a>. Use the
          model set for the <strong>Tools / agents</strong> task.
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
      const result = await createToolCompletion({
        messages: [
          {
            role: 'system',
            content:
              'You are QuickBite support. Be short and clear. Use tools when you need live order data or policy text. Never invent order status. If the user only greets you, reply without tools.',
          },
          { role: 'user', content: userText },
        ],
      })
      const uiSteps: StepView[] = []
      for (const s of result.steps) {
        if (s.type === 'tool_calls' || s.type === 'tool_results' || s.type === 'final') {
          uiSteps.push(s)
        } else if (s.type === 'assistant_text' && !result.usedTools) {
          uiSteps.push(s)
        }
      }
      setSteps(uiSteps)
      setMeta({
        cost: result.cost,
        model: result.model,
        provider: result.provider,
        usedTools: result.usedTools,
        tokens: result.promptTokens + result.completionTokens,
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="my-6 space-y-4">
      {/* Available tools */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-3">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
          Tools your app exposes
        </p>
        <ul className="space-y-2">
          {QUICKBITE_TOOLS.map((t) => (
            <li key={t.name} className="text-[12px]">
              <code className="font-mono text-emerald-400/90">{t.name}</code>
              <span className="text-zinc-500"> · </span>
              <span className="text-zinc-400">{t.description}</span>
            </li>
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

      <div>
        <label className="block text-[12px] text-zinc-500 mb-1">User message</label>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          rows={3}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600 resize-y"
        />
      </div>

      <button
        type="button"
        onClick={run}
        disabled={loading || !userText.trim()}
        className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-[13px] font-medium text-white"
      >
        {loading ? 'Running (model → tools → model)…' : 'Run with tools'}
      </button>

      {error && (
        <p className="text-[13px] text-red-300 rounded border border-red-500/30 bg-red-500/5 px-3 py-2">
          {error}
        </p>
      )}

      <AnimatePresence>
        {steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {steps.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3"
              >
                {s.type === 'tool_calls' && (
                  <>
                    <p className="text-[11px] font-medium text-amber-300 mb-2">
                      1. Model requested tool(s)
                    </p>
                    <ul className="space-y-2">
                      {s.calls.map((c) => (
                        <li key={c.id} className="font-mono text-[11px] text-zinc-300">
                          <span className="text-emerald-400">{c.name}</span>
                          <pre className="mt-1 whitespace-pre-wrap text-zinc-500 overflow-x-auto">
                            {prettyJson(c.arguments)}
                          </pre>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {s.type === 'tool_results' && (
                  <>
                    <p className="text-[11px] font-medium text-sky-300 mb-2">
                      2. Your code ran the tools
                    </p>
                    <ul className="space-y-2">
                      {s.logs.map((log) => (
                        <li key={log.id} className="font-mono text-[11px]">
                          <span className="text-emerald-400">{log.name}</span>
                          <span className="text-zinc-600"> · {log.ms}ms</span>
                          <pre className="mt-1 whitespace-pre-wrap text-zinc-400 overflow-x-auto max-h-40">
                            {JSON.stringify(log.result, null, 2)}
                          </pre>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {(s.type === 'final' || s.type === 'assistant_text') && (
                  <>
                    <p className="text-[11px] font-medium text-emerald-300 mb-2">
                      {s.type === 'final' && steps.some((x) => x.type === 'tool_calls')
                        ? '3. Model final answer'
                        : 'Model answered (no tool needed)'}
                    </p>
                    <p className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {s.content}
                    </p>
                  </>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {meta && (
        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-zinc-500">
          <span>
            {meta.provider}/{meta.model}
          </span>
          <span>${meta.cost.toFixed(6)}</span>
          <span>{meta.tokens} tokens</span>
          <span>{meta.usedTools ? 'used tools' : 'no tools'}</span>
        </div>
      )}
    </div>
  )
}

function prettyJson(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}
