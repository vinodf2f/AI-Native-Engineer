import { defaultModels, type ModelRef, type ProviderId, type TaskKind } from './providers'

export type ConceptStatus = 'not-started' | 'in-progress' | 'complete'

export type ConceptMeta = {
  id: string
  title: string
  section: SectionId
  status: ConceptStatus
  availability: 'ready' | 'soon'
  blurb?: string
}

export type SectionId =
  | 'words'
  | 'foundations'
  | 'building-blocks'
  | 'agents'
  | 'ship'

export type Settings = {
  openaiApiKey: string
  xaiApiKey: string
  /** Per-task provider + model (multi-step chains can mix). */
  models: Record<TaskKind, ModelRef>
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

function emptySettings(): Settings {
  return {
    openaiApiKey: '',
    xaiApiKey: '',
    models: defaultModels(),
  }
}

/** Load settings; migrates old { apiKey, model } shape. */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return emptySettings()
    const parsed = JSON.parse(raw) as Record<string, unknown>

    // Legacy single-key shape
    if (typeof parsed.apiKey === 'string' && !parsed.openaiApiKey) {
      const legacyModel = typeof parsed.model === 'string' ? parsed.model : 'gpt-4o-mini'
      const migrated: Settings = {
        openaiApiKey: parsed.apiKey,
        xaiApiKey: '',
        models: {
          ...defaultModels(),
          chat: { provider: 'openai', model: legacyModel },
          stream: { provider: 'openai', model: legacyModel },
          tools: { provider: 'openai', model: legacyModel },
        },
      }
      return migrated
    }

    const base = emptySettings()
    return {
      openaiApiKey: typeof parsed.openaiApiKey === 'string' ? parsed.openaiApiKey : '',
      xaiApiKey: typeof parsed.xaiApiKey === 'string' ? parsed.xaiApiKey : '',
      models: {
        ...base.models,
        ...(parsed.models && typeof parsed.models === 'object'
          ? (parsed.models as Settings['models'])
          : {}),
      },
    }
  } catch {
    return emptySettings()
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb)
  return () => window.removeEventListener(CHANGE_EVENT, cb)
}

export function getApiKey(provider: ProviderId, settings = loadSettings()): string {
  return provider === 'openai' ? settings.openaiApiKey : settings.xaiApiKey
}

export function hasAnyApiKey(settings = loadSettings()): boolean {
  return Boolean(settings.openaiApiKey?.trim() || settings.xaiApiKey?.trim())
}

export function resolveTask(task: TaskKind, settings = loadSettings()): ModelRef & { apiKey: string } {
  const ref = settings.models[task] ?? defaultModels()[task]
  // Embeddings: force OpenAI until we support another embed provider
  const resolved =
    task === 'embed'
      ? { provider: 'openai' as const, model: settings.models.embed?.model || 'text-embedding-3-small' }
      : ref
  return {
    ...resolved,
    apiKey: getApiKey(resolved.provider, settings),
  }
}

/** @deprecated use resolveTask('chat') — kept for gradual call-site updates */
export function legacyApiKey(settings = loadSettings()): string {
  return settings.openaiApiKey || settings.xaiApiKey
}
