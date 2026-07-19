import { useState } from 'react'
import { motion } from 'framer-motion'
import { hasAnyApiKey } from '../lib/storage'
import { useCompletion } from '../hooks/useCompletion'
import type { ChatMessage } from '../services/openai'

export function CompletionDemo() {
  const [systemPrompt, setSystemPrompt] = useState('You are an assistant for an Indian SaaS startup. Reply in one concise sentence.')
  const [userPrompt, setUserPrompt] = useState('Explain what an LLM is to a fresh graduate joining as a frontend dev.')
  const [triggered, setTriggered] = useState(false)

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  const { data, isFetching, error, refetch } = useCompletion(messages, triggered)

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

  function send() {
    if (!triggered) setTriggered(true)
    refetch()
  }

  return (
    <div className="my-6 space-y-4">
      <div>
        <label className="block text-[12px] text-zinc-500 mb-1">System prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] font-mono text-zinc-200 outline-none focus:border-zinc-600"
        />
      </div>
      <div>
        <label className="block text-[12px] text-zinc-500 mb-1">User prompt</label>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={4}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] font-mono text-zinc-200 outline-none focus:border-zinc-600"
        />
      </div>

      <button
        onClick={send}
        disabled={isFetching}
        className="rounded bg-zinc-100 hover:bg-white px-4 py-2 text-[13px] font-medium text-zinc-900 disabled:opacity-50"
      >
        {isFetching ? 'Calling…' : 'Send to OpenAI'}
      </button>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {String((error as Error).message)}
        </div>
      )}

      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
        >
          <p className="text-[12px] text-zinc-500 mb-2">Response · {data.model}</p>
          <p className="text-[14px] text-zinc-200 leading-relaxed">{data.content}</p>
          <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-4 gap-2 text-center">
            <Stat label="Prompt" value={data.promptTokens} />
            <Stat label="Completion" value={data.completionTokens} />
            <Stat label="Total" value={data.totalTokens} />
            <Stat label="Cost" value={`$${data.cost.toFixed(6)}`} highlight />
          </div>
        </motion.div>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div>
      <div className={`font-mono text-[13px] ${highlight ? 'text-emerald-400' : 'text-zinc-300'}`}>{value}</div>
      <div className="text-[10px] text-zinc-600 uppercase tracking-wide">{label}</div>
    </div>
  )
}