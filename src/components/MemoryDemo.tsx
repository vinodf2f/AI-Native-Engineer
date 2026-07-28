import { useState } from 'react'
import { hasAnyApiKey } from '../lib/storage'
import { useExampleLang, EXAMPLES } from '../lib/exampleTexts'
import { createChatCompletion, type ChatMessage } from '../services/openai'

type ChatTurn = { role: 'user' | 'assistant'; content: string }
type Strategy = 'full' | 'window' | 'summary'

const WINDOW = 4

const SYSTEM: ChatMessage = {
  role: 'system',
  content:
    'You are QuickBite support. Reply in 1-2 short sentences. Use details the user gave earlier in this chat (name, order id) when they ask.',
}

const STRATEGIES: { id: Strategy; label: string; hint: string }[] = [
  { id: 'full', label: 'Full history', hint: 'Send everything, every call. Simple, honest, expensive.' },
  { id: 'window', label: 'Sliding window', hint: `Send only the last ${WINDOW} messages. Cheap, but forgets old details.` },
  { id: 'summary', label: 'Summarize old turns', hint: 'Compress old history into a summary, keep recent messages.' },
]

function buildPayload(turns: ChatTurn[], summary: string | null, strategy: Strategy): ChatMessage[] {
  const visible = strategy === 'full' ? turns : turns.slice(-WINDOW)
  const msgs: ChatMessage[] = [SYSTEM]
  if (strategy === 'summary' && summary) {
    msgs.push({ role: 'system', content: `Earlier conversation summary: ${summary}` })
  }
  return [...msgs, ...visible]
}

export function MemoryDemo() {
  const lang = useExampleLang()
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [summarizedCount, setSummarizedCount] = useState(0)
  const [strategy, setStrategy] = useState<Strategy>('full')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCall, setLastCall] = useState<{ roles: string[]; tokens: number; cost: number } | null>(null)
  const [totalCost, setTotalCost] = useState(0)

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

  const SUGGESTED = [
    EXAMPLES.memory.intro[lang],
    EXAMPLES.memory.late[lang],
    EXAMPLES.memory.refundWhen[lang],
    EXAMPLES.memory.whoAmI[lang],
  ]

  const preview = buildPayload(turns, summary, strategy)
  const previewChars = preview.reduce((n, m) => n + (m.content?.length ?? 0), 0)

  async function maybeSummarize(all: ChatTurn[]) {
    const cutoff = all.length - WINDOW
    if (cutoff <= summarizedCount) return
    const oldPart = all.slice(0, cutoff)
    setSummarizing(true)
    try {
      const res = await createChatCompletion([
        {
          role: 'system',
          content:
            'Summarize this support chat in 2-3 short sentences. Keep facts: names, order ids, issues, promises.',
        },
        { role: 'user', content: oldPart.map((t) => `${t.role}: ${t.content}`).join('\n') },
      ])
      setSummary(res.content)
      setSummarizedCount(cutoff)
      setTotalCost((c) => c + res.cost)
    } finally {
      setSummarizing(false)
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading || summarizing) return
    setInput('')
    setLoading(true)
    setError(null)
    const nextTurns: ChatTurn[] = [...turns, { role: 'user', content }]
    setTurns(nextTurns)
    try {
      const payload = buildPayload(nextTurns, summary, strategy)
      const res = await createChatCompletion(payload)
      const withReply: ChatTurn[] = [...nextTurns, { role: 'assistant', content: res.content }]
      setTurns(withReply)
      setLastCall({ roles: payload.map((m) => m.role), tokens: res.totalTokens, cost: res.cost })
      setTotalCost((c) => c + res.cost)
      if (strategy === 'summary') await maybeSummarize(withReply)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setTurns([])
    setSummary(null)
    setSummarizedCount(0)
    setLastCall(null)
    setTotalCost(0)
    setError(null)
  }

  return (
    <div className="my-6 space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStrategy(s.id)}
            title={s.hint}
            className={`rounded border px-2 py-1 text-[11px] transition-colors ${
              strategy === s.id
                ? 'border-emerald-600 bg-emerald-600/10 text-emerald-300'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          className="ml-auto rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          Reset chat
        </button>
      </div>
      <p className="text-[11px] text-zinc-500">{STRATEGIES.find((s) => s.id === strategy)?.hint}</p>

      {turns.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3 max-h-56 overflow-y-auto space-y-2">
          {turns.map((t, i) => (
            <p key={i} className="text-[12px]">
              <span className={t.role === 'user' ? 'text-sky-300' : 'text-emerald-300'}>
                {t.role === 'user' ? 'you' : 'bot'}:
              </span>{' '}
              <span className="text-zinc-300">{t.content}</span>
            </p>
          ))}
          {(loading || summarizing) && (
            <p className="text-[11px] text-zinc-500">
              {summarizing ? 'compressing old turns into a summary…' : 'thinking…'}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            disabled={loading || summarizing}
            className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600"
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={loading || summarizing || !input.trim()}
          className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-[13px] font-medium text-white"
        >
          Send
        </button>
      </div>

      {error && (
        <p className="text-[13px] text-red-300 rounded border border-red-500/30 bg-red-500/5 px-3 py-2">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-3">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
          Payload for your next message ({preview.length} messages, ~{previewChars} chars)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {preview.map((m, i) => (
            <span
              key={i}
              className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                m.role === 'system'
                  ? 'bg-zinc-800 text-zinc-400'
                  : m.role === 'user'
                    ? 'bg-sky-500/10 text-sky-300'
                    : 'bg-emerald-500/10 text-emerald-300'
              }`}
              title={(m.content ?? '').slice(0, 120)}
            >
              {m.role} ({m.content?.length ?? 0})
            </span>
          ))}
        </div>
        {strategy === 'window' && turns.length > WINDOW && (
          <p className="text-[11px] text-amber-300/80 mt-2">
            {turns.length - WINDOW} older message(s) dropped by the window. Ask "what is my name?" and watch the bot forget.
          </p>
        )}
        {summary && (
          <p className="text-[11px] text-zinc-500 mt-2">
            <span className="text-zinc-400 font-medium">Stored summary:</span> {summary}
          </p>
        )}
      </div>

      {(lastCall || totalCost > 0) && (
        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-zinc-500">
          {lastCall && <span>last call: {lastCall.tokens} tokens, ${lastCall.cost.toFixed(6)}</span>}
          <span>chat total: ${totalCost.toFixed(6)}</span>
        </div>
      )}
    </div>
  )
}
