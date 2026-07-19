import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { streamChatCompletion } from '../services/streaming'
import { hasAnyApiKey, resolveTask } from '../lib/storage'

export function StreamingDemo() {
  const [prompt, setPrompt] = useState('Explain how train ticket refunds work on IRCTC, in plain Hindi-English for an Indian user. Keep it under 100 words.')
  const [output, setOutput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ tokens: number; ms: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

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

  async function start() {
    setOutput('')
    setError(null)
    setStats(null)
    setStreaming(true)
    const ac = new AbortController()
    abortRef.current = ac
    const start = performance.now()
    let tokenCount = 0

    try {
      await streamChatCompletion(
        [{ role: 'user', content: prompt }],
        resolveTask('stream').model,
        ac.signal,
        {
          onToken: (t) => {
            tokenCount++
            setOutput((cur) => cur + t)
          },
          onDone: () => {
            const ms = Math.round(performance.now() - start)
            setStats({ tokens: tokenCount, ms })
            setStreaming(false)
          },
          onError: (e) => {
            setError(e)
            setStreaming(false)
          },
        },
      )
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(String((e as Error).message))
      }
      setStreaming(false)
    }
  }

  function cancel() {
    abortRef.current?.abort()
    setStreaming(false)
  }

  return (
    <div className="my-6 space-y-4">
      <div>
        <label className="block text-[12px] text-zinc-500 mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600"
        />
      </div>

      <div className="flex gap-2">
        {!streaming ? (
          <button
            onClick={start}
            className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[13px] text-white"
          >
            Stream answer
          </button>
        ) : (
          <button
            onClick={cancel}
            className="rounded bg-red-600 hover:bg-red-500 px-4 py-2 text-[13px] text-white"
          >
            Cancel stream
          </button>
        )}
        {stats && !streaming && (
          <span className="self-center text-[12px] text-zinc-500 ml-2 font-mono">
            {stats.tokens} tokens · {stats.ms}ms · {(stats.tokens / (stats.ms / 1000)).toFixed(1)} tok/s
          </span>
        )}
        {streaming && (
          <span className="self-center text-[12px] text-emerald-400 ml-2 animate-pulse">streaming…</span>
        )}
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">{error}</div>
      )}

      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <p className="text-[12px] text-zinc-500 mb-2">
              {streaming ? 'Live output' : 'Final answer'}
              {streaming && <span className="ml-2 inline-block w-2 h-3.5 bg-emerald-500 align-middle animate-pulse" />}
            </p>
            <p className="text-[14px] text-zinc-200 leading-relaxed font-mono">{output}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}