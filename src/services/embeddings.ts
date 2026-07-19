import { EMBED_PRICING, PROVIDERS } from '../lib/providers'
import { loadSettings, resolveTask } from '../lib/storage'

export type EmbeddingResult = {
  vector: number[]
  model: string
  tokens: number
  cost: number
}

export async function createEmbedding(
  input: string,
  model?: string,
): Promise<EmbeddingResult> {
  const settings = loadSettings()
  const resolved = resolveTask('embed', settings)
  const resolvedModel = model ?? resolved.model
  // Embeddings currently OpenAI-only in this course
  const apiKey = settings.openaiApiKey
  const baseUrl = PROVIDERS.openai.baseUrl

  if (!apiKey) {
    throw new Error('No OpenAI API key. Embeddings need OpenAI for now — add it in Settings.')
  }

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: resolvedModel, input }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `OpenAI embeddings error (${res.status})`)
  }

  const data = await res.json()
  const tokens: number = data.usage?.total_tokens ?? 0
  const price = EMBED_PRICING[resolvedModel] ?? EMBED_PRICING['text-embedding-3-small']

  return {
    vector: data.data[0].embedding as number[],
    model: resolvedModel,
    tokens,
    cost: (tokens / 1_000_000) * price,
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0
  let dot = 0,
    normA = 0,
    normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}
