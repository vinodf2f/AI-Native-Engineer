import { CHAT_PRICING, PROVIDERS, type ProviderId } from '../lib/providers'
import { loadSettings, resolveTask } from '../lib/storage'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type ChatCompletion = {
  content: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
  model: string
  provider: ProviderId
  finishReason: string
}

export async function createChatCompletion(
  messages: ChatMessage[],
  /** Override model id; provider still comes from Settings → chat task */
  model?: string,
  task: 'chat' | 'tools' = 'chat',
): Promise<ChatCompletion> {
  const settings = loadSettings()
  const resolved = resolveTask(task, settings)
  const resolvedModel = model ?? resolved.model
  const provider = resolved.provider
  const apiKey = resolved.apiKey
  const baseUrl = PROVIDERS[provider].baseUrl

  if (!apiKey) {
    throw new Error(
      `No ${PROVIDERS[provider].name} API key. Add it in Settings (used for “${task}”).`,
    )
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: resolvedModel, messages }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `${PROVIDERS[provider].name} error (${res.status})`)
  }

  const data = await res.json()
  const price = CHAT_PRICING[resolvedModel] ?? CHAT_PRICING['gpt-4o-mini']
  const { prompt_tokens, completion_tokens, total_tokens } = data.usage ?? {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  }

  return {
    content: data.choices[0].message.content,
    promptTokens: prompt_tokens,
    completionTokens: completion_tokens,
    totalTokens: total_tokens,
    cost: (prompt_tokens / 1_000_000) * price.in + (completion_tokens / 1_000_000) * price.out,
    model: resolvedModel,
    provider,
    finishReason: data.choices[0].finish_reason,
  }
}
