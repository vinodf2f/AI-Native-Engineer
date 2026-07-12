export type ConceptStatus = 'not-started' | 'in-progress' | 'complete'

export type ConceptMeta = {
  id: string
  title: string
  phase: 'A' | 'B' | 'C'
  status: ConceptStatus
}

export type Settings = {
  apiKey: string
  model: string
}

const PROGRESS_KEY = 'ai-course:progress'
const SETTINGS_KEY = 'ai-course:settings'
const CHANGE_EVENT = 'ai-course:change'

export function loadProgress(): Record<string, ConceptStatus> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveProgress(p: Record<string, ConceptStatus>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function setStatus(id: string, status: ConceptStatus) {
  const p = loadProgress()
  p[id] = status
  saveProgress(p)
}

export function loadSettings(): Settings {
  try {
    const s = localStorage.getItem(SETTINGS_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return { apiKey: '', model: 'gpt-4o-mini' }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb)
  return () => window.removeEventListener(CHANGE_EVENT, cb)
}