import { PROVIDERS } from '../lib/providers'
import { loadSettings, resolveTask } from '../lib/storage'
import type { ChatMessage } from './openai'

export type StreamCallbacks = {
  onToken: (token: string) => void
  onDone: (full: string) => void
  onError: (err: string) => void
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  model: string | undefined,
  signal: AbortSignal,
  cb: StreamCallbacks,
): Promise<void> {
  const settings = loadSettings()
  const resolved = resolveTask('stream', settings)
  const resolvedModel = model ?? resolved.model
  const { provider, apiKey } = resolved
  const baseUrl = PROVIDERS[provider].baseUrl

  if (!apiKey) {
    cb.onError(`No ${PROVIDERS[provider].name} API key. Add it in Settings (streaming task).`)
    return
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: resolvedModel, messages, stream: true }),
      signal,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') return
    cb.onError((e as Error).message)
    return
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    cb.onError(err?.error?.message ?? `${PROVIDERS[provider].name} error (${res.status})`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    cb.onError('No response body to stream')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') {
          cb.onDone(full)
          return
        }
        try {
          const json = JSON.parse(payload)
          const token = json.choices?.[0]?.delta?.content
          if (token) {
            full += token
            cb.onToken(token)
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
    cb.onDone(full)
  } catch (e) {
    if ((e as Error).name === 'AbortError') return
    cb.onError((e as Error).message)
  }
}
