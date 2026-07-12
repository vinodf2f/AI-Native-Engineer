import { loadSettings } from '../lib/storage'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type ChatCompletion = {
  content: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
  model: string
  finishReason: string
}

const PRICING: Record<string, { in: number; out: number }> = {
  'gpt-4o-mini': { in: 0.00015, out: 0.0006 },
  'gpt-4o': { in: 0.0025, out: 0.01 },
}

const BASE_URL = 'https://api.openai.com/v1'

export async function createChatCompletion(
  messages: ChatMessage[],
  model?: string,
): Promise<ChatCompletion> {
  const settings = loadSettings()
  const resolvedModel = model ?? settings.model

  if (!settings.apiKey) {
    throw new Error('No API key set. Add your OpenAI key in Settings.')
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({ model: resolvedModel, messages }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `OpenAI API error (${res.status})`)
  }

  const data = await res.json()
  const price = PRICING[resolvedModel] ?? PRICING['gpt-4o-mini']
  const { prompt_tokens, completion_tokens, total_tokens } = data.usage

  return {
    content: data.choices[0].message.content,
    promptTokens: prompt_tokens,
    completionTokens: completion_tokens,
    totalTokens: total_tokens,
    cost: (prompt_tokens / 1_000_000) * price.in + (completion_tokens / 1_000_000) * price.out,
    model: resolvedModel,
    finishReason: data.choices[0].finish_reason,
  }
}