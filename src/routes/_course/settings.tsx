import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { loadSettings, saveSettings, type Settings } from '../../lib/storage'
import {
  MODEL_CATALOG,
  PROVIDERS,
  TASK_LABELS,
  type ProviderId,
  type TaskKind,
} from '../../lib/providers'

export const Route = createFileRoute('/_course/settings')({
  component: SettingsPage,
})

const TASK_ORDER: TaskKind[] = ['chat', 'stream', 'tools', 'embed', 'voice']

function SettingsPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<Settings>(() => loadSettings())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(loadSettings())
  }, [])

  function save() {
    saveSettings({
      openaiApiKey: form.openaiApiKey.trim(),
      xaiApiKey: form.xaiApiKey.trim(),
      models: form.models,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function setKey(provider: ProviderId, value: string) {
    setForm((f) =>
      provider === 'openai' ? { ...f, openaiApiKey: value } : { ...f, xaiApiKey: value },
    )
  }

  function setTaskProvider(task: TaskKind, provider: ProviderId) {
    const models = MODEL_CATALOG[provider]
    const preferred =
      models.find((m) => m.goodFor.includes(task))?.id ?? models[0]?.id ?? form.models[task].model
    setForm((f) => ({
      ...f,
      models: {
        ...f.models,
        [task]: { provider, model: preferred },
      },
    }))
  }

  function setTaskModel(task: TaskKind, model: string) {
    setForm((f) => ({
      ...f,
      models: {
        ...f.models,
        [task]: { ...f.models[task], model },
      },
    }))
  }

  return (
    <div className="max-w-xl mx-auto px-6 md:px-8 py-10 pb-24">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Add API keys</h1>
      <p className="text-[13px] text-zinc-500 mb-8 leading-relaxed">
        Keys stay in your browser only. Pick which provider and model each kind of demo uses.
        Useful when you chain steps (cheap model to classify, stronger model for the final answer).
      </p>

      {/* Keys */}
      <h2 className="text-[13px] font-semibold text-zinc-200 mb-3">API keys</h2>
      <div className="space-y-5 mb-8">
        {(['openai', 'xai'] as ProviderId[]).map((id) => {
          const p = PROVIDERS[id]
          const value = id === 'openai' ? form.openaiApiKey : form.xaiApiKey
          return (
            <div key={id}>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-[13px] font-medium text-zinc-300">{p.name}</label>
                <a
                  href={p.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Get key ↗
                </a>
              </div>
              <input
                type="password"
                value={value}
                onChange={(e) => setKey(id, e.target.value)}
                placeholder={p.keyPlaceholder}
                className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-200 outline-none focus:border-zinc-600"
              />
              <p className="mt-1 text-[11px] text-zinc-600">{p.blurb}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 mb-10 flex items-start gap-2">
        <span className="text-zinc-500 text-sm mt-0.5 shrink-0">ℹ</span>
        <p className="text-[12px] text-zinc-500 leading-relaxed">
          Keys go only to the matching API (OpenAI or xAI) from your browser. Fine for learning.
          Real products put a backend in front so keys never sit in the client.
        </p>
      </div>

      {/* Per-task models */}
      <h2 className="text-[13px] font-semibold text-zinc-200 mb-1">Model per task</h2>
      <p className="text-[12px] text-zinc-500 mb-4 leading-relaxed">
        Multi-step apps often mix models. Example: xAI mini to classify intent → OpenAI to write
        the user-facing reply. LangChain lesson will let you try combinations live.
      </p>

      <div className="space-y-4 mb-10">
        {TASK_ORDER.map((task) => {
          const meta = TASK_LABELS[task]
          const ref = form.models[task]
          const catalog = MODEL_CATALOG[ref.provider]
          const options =
            task === 'embed'
              ? MODEL_CATALOG.openai.filter((m) => m.goodFor.includes('embed'))
              : catalog.filter((m) => m.goodFor.includes(task) || catalog.length < 3)
          const disabled = task === 'voice'
          const embedLocked = task === 'embed'

          return (
            <div
              key={task}
              className={`rounded-lg border border-zinc-800 px-3 py-3 ${disabled ? 'opacity-60' : 'bg-zinc-900/30'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-[13px] font-medium text-zinc-200">
                    {meta.title}
                    {disabled && (
                      <span className="ml-2 text-[10px] uppercase text-zinc-600">soon</span>
                    )}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{meta.hint}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={embedLocked ? 'openai' : ref.provider}
                  disabled={disabled || embedLocked}
                  onChange={(e) => setTaskProvider(task, e.target.value as ProviderId)}
                  className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[12px] text-zinc-200 outline-none focus:border-zinc-600 disabled:opacity-50"
                >
                  <option value="openai">OpenAI</option>
                  <option value="xai">xAI</option>
                </select>
                <select
                  value={ref.model}
                  disabled={disabled}
                  onChange={(e) => setTaskModel(task, e.target.value)}
                  className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[12px] text-zinc-200 outline-none focus:border-zinc-600 disabled:opacity-50"
                >
                  {(options.length ? options : catalog).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                      {m.note ? ` — ${m.note}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {embedLocked && (
                <p className="mt-1.5 text-[10px] text-zinc-600">
                  Embeddings use OpenAI in this course for now.
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Save
        </button>
        {saved && <span className="text-[13px] text-emerald-400">Saved ✓</span>}
        <Link
          to="/concept/b1"
          className="ml-auto text-[13px] text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
        >
          Start Foundations →
        </Link>
      </div>

      <button
        type="button"
        onClick={() => navigate({ to: '/' })}
        className="mt-6 text-[12px] text-zinc-600 hover:text-zinc-400"
      >
        ← Home
      </button>
    </div>
  )
}
