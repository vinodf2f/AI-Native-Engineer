import { loadSettings } from '../lib/storage'

export type EmbeddingResult = {
  vector: number[]
  model: string
  tokens: number
  cost: number
}

const PRICING: Record<string, number> = {
  'text-embedding-3-small': 0.02,
  'text-embedding-3-large': 0.13,
}

const BASE_URL = 'https://api.openai.com/v1'

export async function createEmbedding(
  input: string,
  model: string = 'text-embedding-3-small',
): Promise<EmbeddingResult> {
  const settings = loadSettings()
  if (!settings.apiKey) {
    throw new Error('No API key set. Add your OpenAI key in Settings.')
  }

  const res = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({ model, input }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `OpenAI API error (${res.status})`)
  }

  const data = await res.json()
  const tokens: number = data.usage?.total_tokens ?? 0
  const price = PRICING[model] ?? PRICING['text-embedding-3-small']

  return {
    vector: data.data[0].embedding as number[],
    model,
    tokens,
    cost: (tokens / 1_000_000) * price,
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}