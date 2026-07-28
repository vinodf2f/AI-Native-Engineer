import { useState } from 'react'
import { CHAT_PRICING } from '../lib/providers'
import { LessonRef } from './LessonRef'

type Mode = 'direct' | 'proxy'

const SCENARIOS = [
  { label: 'Short support reply', inTok: 300, outTok: 80 },
  { label: 'RAG answer (3 chunks)', inTok: 1800, outTok: 200 },
  { label: 'Tool round trip (2 calls)', inTok: 1500, outTok: 150 },
  { label: 'Agent loop (5 steps)', inTok: 6000, outTok: 800 },
]

export function ProxyCostDemo() {
  const [mode, setMode] = useState<Mode>('direct')
  const [model, setModel] = useState('gpt-4o-mini')
  const [inTok, setInTok] = useState(SCENARIOS[1].inTok)
  const [outTok, setOutTok] = useState(SCENARIOS[1].outTok)
  const [callsPerDay, setCallsPerDay] = useState(1000)

  const price = CHAT_PRICING[model] ?? CHAT_PRICING['gpt-4o-mini']
  const perCall = (inTok / 1_000_000) * price.in + (outTok / 1_000_000) * price.out
  const perDay = perCall * callsPerDay
  const perMonth = perDay * 30

  return (
    <div className="my-6 space-y-6">
      {/* Part 1 — where does the key live? */}
      <div>
        <div className="flex gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={`rounded border px-2 py-1 text-[11px] transition-colors ${
              mode === 'direct'
                ? 'border-red-600 bg-red-600/10 text-red-300'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            Direct from browser (this course)
          </button>
          <button
            type="button"
            onClick={() => setMode('proxy')}
            className={`rounded border px-2 py-1 text-[11px] transition-colors ${
              mode === 'proxy'
                ? 'border-emerald-600 bg-emerald-600/10 text-emerald-300'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            Through your backend (production)
          </button>
        </div>

        {mode === 'direct' ? (
          <div className="space-y-2">
            <FlowRow
              boxes={['Browser (React app)', 'OpenAI API']}
              labels={['Authorization: Bearer sk-…your real key']}
            />
            <ul className="list-disc ml-5 space-y-1 text-[12px] text-zinc-400">
              <li>Anyone: devtools → Network → copy the key → spend your quota.</li>
              <li>The key sits in your JS bundle or localStorage. Both are readable.</li>
              <li>Fine for learning on your own machine. Never ship this to users.</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-2">
            <FlowRow
              boxes={['Browser', 'Your server (/api/chat)', 'OpenAI API']}
              labels={['your session cookie', 'key from process.env']}
            />
            <ul className="list-disc ml-5 space-y-1 text-[12px] text-zinc-400">
              <li>Client never sees the OpenAI key. It only knows your endpoint.</li>
              <li>Your server adds: login check, per-user rate limit, usage logs, budget caps.</li>
              <li>Leaked client = no key leaked. You can rotate keys server-side anytime.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Part 2 — cost calculator */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-4 space-y-3">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500">Cost calculator</p>

        <div className="flex flex-wrap gap-1.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => { setInTok(s.inTok); setOutTok(s.outTok) }}
              className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
          <label className="block">
            <span className="text-zinc-500 block mb-1">Model</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-zinc-200"
            >
              {Object.keys(CHAT_PRICING).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <NumberField label="Prompt tokens / call" value={inTok} onChange={setInTok} />
          <NumberField label="Output tokens / call" value={outTok} onChange={setOutTok} />
          <NumberField label="Calls / day" value={callsPerDay} onChange={setCallsPerDay} />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] font-mono pt-1">
          <span className="text-zinc-300">${perCall.toFixed(6)} <span className="text-zinc-500">/ call</span></span>
          <span className="text-zinc-300">${perDay.toFixed(2)} <span className="text-zinc-500">/ day</span></span>
          <span className="text-emerald-300">${perMonth.toFixed(2)} <span className="text-zinc-500">/ month</span></span>
        </div>
        <p className="text-[11px] text-zinc-500">
          Remember <LessonRef id="bb3">chat memory</LessonRef>: history and system prompts are re-sent (and re-billed) on every call. Token counts above should include them.
        </p>
      </div>
    </div>
  )
}

function FlowRow({ boxes, labels }: { boxes: string[]; labels: string[] }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 flex flex-wrap items-center gap-2 font-mono text-[11px]">
      {boxes.map((b, i) => (
        <span key={b} className="flex items-center gap-2">
          <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200">{b}</span>
          {i < boxes.length - 1 && (
            <span className="flex items-center gap-1 text-zinc-500">
              <span>→</span>
              <span className="text-[10px] text-amber-300/80">{labels[i]}</span>
              <span>→</span>
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="text-zinc-500 block mb-1">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-zinc-200"
      />
    </label>
  )
}
