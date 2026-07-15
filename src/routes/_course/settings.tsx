import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { loadSettings, saveSettings } from '../../lib/storage'

export const Route = createFileRoute('/_course/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = loadSettings()
    setApiKey(s.apiKey)
    setModel(s.model)
  }, [])

  function save() {
    saveSettings({ apiKey: apiKey.trim(), model })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="max-w-xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-6">Settings</h1>

      <label className="block mb-2 text-[13px] font-medium text-zinc-300">OpenAI API Key</label>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-..."
        className="w-full mb-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-200 outline-none focus:border-zinc-600"
      />
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 mb-5 flex items-start gap-2">
        <span className="text-zinc-500 text-sm mt-0.5 shrink-0">ℹ</span>
        <p className="text-[12px] text-zinc-500 leading-relaxed">
          Your key is stored <strong className="text-zinc-400">only in your browser's localStorage</strong>. It is never sent to any server except OpenAI's API directly from your browser.
          This is safe for learning but not production   in a real app, proxy through your own backend.
        </p>
      </div>

      <label className="block mb-2 text-[13px] font-medium text-zinc-300">Default Model</label>
      <select
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="w-full mb-6 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
      >
        <option value="gpt-4o-mini">gpt-4o-mini (cheapest, recommended)</option>
        <option value="gpt-4o">gpt-4o (higher quality)</option>
      </select>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Save
        </button>
        {saved && <span className="text-[13px] text-emerald-400">Saved ✓</span>}
        <button
          onClick={() => navigate({ to: '/concept/b1' })}
          className="ml-auto text-[13px] text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
        >
          Go to B1 →
        </button>
      </div>
    </div>
  )
}