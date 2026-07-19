import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { hasAnyApiKey } from '../lib/storage'
import { createChatCompletion, type ChatMessage } from '../services/openai'

type Mode = 'system' | 'fewShot' | 'json'

const DEFAULTS: Record<Mode, {
  system: string
  user: string
  extra: string
  exampleUser: string
  exampleAssistant: string
}> = {
  system: {
    system: 'You are a concise assistant for the IRCTC helpdesk. Reply in 2 sentences.',
    user: 'My train was cancelled. What do I do?',
    extra: '',
    exampleUser: '',
    exampleAssistant: '',
  },
  fewShot: {
    system: 'You classify customer feedback into one of: refund, schedule, cleanliness, food, other. Reply with the label only.',
    user: 'The food on Rajdhani was cold and stale.',
    extra: '',
    exampleUser: 'I want my money back, the train was 4 hours late.',
    exampleAssistant: 'refund',
  },
  json: {
    system: 'You extract structured data. Return ONLY valid JSON, no markdown fences.',
    user: 'Cricketer Virat Kohli was born on 5 November 1988 in Delhi. He is a right-handed batsman.',
    extra: 'Output schema: {"name": string, "birthDate": string, "birthPlace": string, "role": string}',
    exampleUser: '',
    exampleAssistant: '',
  },
}

function buildMessages(mode: Mode, fields: typeof DEFAULTS[Mode]): ChatMessage[] {
  const msgs: ChatMessage[] = [{ role: 'system', content: fields.system }]
  if (mode === 'fewShot') {
    msgs.push({ role: 'user', content: fields.exampleUser })
    msgs.push({ role: 'assistant', content: fields.exampleAssistant })
  }
  if (mode === 'json' && fields.extra) {
    msgs.push({ role: 'system', content: fields.extra })
  }
  msgs.push({ role: 'user', content: fields.user })
  return msgs
}

export function PromptLab() {
  const [mode, setMode] = useState<Mode>('system')
  const [fields, setFields] = useState(DEFAULTS.system)
  const [triggered, setTriggered] = useState(false)

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['prompt-lab', mode, fields],
    queryFn: () => createChatCompletion(buildMessages(mode, fields)),
    enabled: false,
  })

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

  function pickMode(m: Mode) {
    setMode(m)
    setFields(DEFAULTS[m])
    setTriggered(false)
  }

  function patch(p: Partial<typeof fields>) {
    setFields((f) => ({ ...f, ...p }))
  }

  function run() {
    if (!triggered) setTriggered(true)
    refetch()
  }

  return (
    <div className="my-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['system', 'fewShot', 'json'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => pickMode(m)}
            className={`rounded px-3 py-1.5 text-[12px] transition-colors ${
              mode === m ? 'bg-emerald-600 text-white' : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            {m === 'system' && 'System prompt'}
            {m === 'fewShot' && 'Few-shot examples'}
            {m === 'json' && 'Structured JSON'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-[12px] text-zinc-500 mb-1">System prompt</label>
        <textarea
          value={fields.system}
          onChange={(e) => patch({ system: e.target.value })}
          rows={5}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] font-mono text-zinc-200 outline-none focus:border-zinc-600"
        />
      </div>

      {mode === 'fewShot' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] text-zinc-500 mb-1">Example user</label>
            <textarea
              value={fields.exampleUser}
              onChange={(e) => patch({ exampleUser: e.target.value })}
              rows={4}
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] font-mono text-zinc-200 outline-none focus:border-zinc-600"
            />
          </div>
          <div>
            <label className="block text-[12px] text-zinc-500 mb-1">Example assistant</label>
            <textarea
              value={fields.exampleAssistant}
              onChange={(e) => patch({ exampleAssistant: e.target.value })}
              rows={4}
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] font-mono text-zinc-200 outline-none focus:border-zinc-600"
            />
          </div>
        </div>
      )}

      {mode === 'json' && (
        <div>
          <label className="block text-[12px] text-zinc-500 mb-1">Schema instruction (2nd system message)</label>
          <textarea
            value={fields.extra}
            onChange={(e) => patch({ extra: e.target.value })}
            rows={4}
            className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] font-mono text-zinc-200 outline-none focus:border-zinc-600"
          />
        </div>
      )}

      <div>
        <label className="block text-[12px] text-zinc-500 mb-1">User input</label>
        <textarea
          value={fields.user}
          onChange={(e) => patch({ user: e.target.value })}
          rows={4}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-[13px] font-mono text-zinc-200 outline-none focus:border-zinc-600"
        />
      </div>

      <button
        onClick={run}
        disabled={isFetching}
        className="rounded bg-zinc-100 hover:bg-white px-4 py-2 text-[13px] font-medium text-zinc-900 disabled:opacity-50"
      >
        {isFetching ? 'Calling…' : 'Run prompt'}
      </button>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {String((error as Error).message)}
        </div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-[12px] text-zinc-500 mb-2">Response · {data.completionTokens} completion tokens · ${data.cost.toFixed(6)}</p>
          <pre className="text-[13px] text-zinc-200 whitespace-pre-wrap font-mono leading-relaxed">{data.content}</pre>
          {mode === 'json' && (
            <div className="mt-3 pt-3 border-t border-zinc-800 text-[11px]">
              {isValidJson(data.content) ? (
                <span className="text-emerald-400">✓ Valid JSON</span>
              ) : (
                <span className="text-red-400">✗ Not valid JSON   model returned extra text. Tighten the prompt.</span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function isValidJson(s: string): boolean {
  try {
    JSON.parse(s.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim())
    return true
  } catch {
    return false
  }
}