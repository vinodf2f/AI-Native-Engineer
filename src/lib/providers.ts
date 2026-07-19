/**
 * Providers and models available in this course.
 * Chat APIs for OpenAI and xAI both speak the OpenAI-style /v1/chat/completions shape.
 */

export type ProviderId = 'openai' | 'xai'

/** Jobs demos can route to different provider+model pairs. */
export type TaskKind = 'chat' | 'embed' | 'stream' | 'tools' | 'voice'

export type ModelRef = {
  provider: ProviderId
  model: string
}

export type ProviderInfo = {
  id: ProviderId
  name: string
  baseUrl: string
  keyPlaceholder: string
  docsUrl: string
  blurb: string
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    blurb: 'Chat, embeddings, tools. Default for Foundations demos.',
  },
  xai: {
    id: 'xai',
    name: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    keyPlaceholder: 'xai-...',
    docsUrl: 'https://console.x.ai/',
    blurb: 'Grok chat models. Good for cheap multi-step chains; voice later.',
  },
}

export type CatalogModel = {
  id: string
  label: string
  /** Rough relative cost hint for learners */
  cost: 'low' | 'mid' | 'high'
  /** What this model is good for in the course */
  goodFor: TaskKind[]
  note?: string
}

export const MODEL_CATALOG: Record<ProviderId, CatalogModel[]> = {
  openai: [
    {
      id: 'gpt-4o-mini',
      label: 'gpt-4o-mini',
      cost: 'low',
      goodFor: ['chat', 'stream', 'tools'],
      note: 'Default for most lessons',
    },
    {
      id: 'gpt-4o',
      label: 'gpt-4o',
      cost: 'mid',
      goodFor: ['chat', 'stream', 'tools'],
      note: 'Higher quality when mini is weak',
    },
    {
      id: 'text-embedding-3-small',
      label: 'text-embedding-3-small',
      cost: 'low',
      goodFor: ['embed'],
      note: 'RAG / similarity demos',
    },
  ],
  xai: [
    {
      id: 'grok-3-mini',
      label: 'grok-3-mini',
      cost: 'low',
      goodFor: ['chat', 'stream', 'tools'],
      note: 'Cheap steps in a chain',
    },
    {
      id: 'grok-3',
      label: 'grok-3',
      cost: 'mid',
      goodFor: ['chat', 'stream', 'tools'],
    },
    {
      id: 'grok-2-vision-1212',
      label: 'grok-2-vision',
      cost: 'mid',
      goodFor: ['chat'],
      note: 'Image + text (later demos)',
    },
  ],
}

/** USD per 1M tokens — rough, for cost literacy in demos. Update when prices move. */
export const CHAT_PRICING: Record<string, { in: number; out: number }> = {
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'gpt-4o': { in: 2.5, out: 10 },
  'grok-3-mini': { in: 0.3, out: 0.5 },
  'grok-3': { in: 3, out: 15 },
  'grok-2-vision-1212': { in: 2, out: 10 },
}

export const EMBED_PRICING: Record<string, number> = {
  'text-embedding-3-small': 0.02,
}

export const TASK_LABELS: Record<TaskKind, { title: string; hint: string }> = {
  chat: {
    title: 'Chat / complete',
    hint: 'One-shot answers, prompt lab, most Foundations demos',
  },
  stream: {
    title: 'Streaming',
    hint: 'Token-by-token UI demos',
  },
  tools: {
    title: 'Tools / agents',
    hint: 'Function calling and multi-step chains',
  },
  embed: {
    title: 'Embeddings',
    hint: 'Similarity, vector store, RAG retrieve (OpenAI today)',
  },
  voice: {
    title: 'Voice (soon)',
    hint: 'Speech in/out — wire when we ship the voice lesson',
  },
}

export function modelsForTask(provider: ProviderId, task: TaskKind): CatalogModel[] {
  return MODEL_CATALOG[provider].filter((m) => m.goodFor.includes(task))
}

export function defaultModels(): Record<TaskKind, ModelRef> {
  return {
    chat: { provider: 'openai', model: 'gpt-4o-mini' },
    stream: { provider: 'openai', model: 'gpt-4o-mini' },
    tools: { provider: 'openai', model: 'gpt-4o-mini' },
    embed: { provider: 'openai', model: 'text-embedding-3-small' },
    voice: { provider: 'xai', model: 'grok-3-mini' },
  }
}
