import { loadSettings } from '../lib/storage'
import type { ChatMessage } from './openai'

export type StreamCallbacks = {
  onToken: (token: string) => void
  onDone: (full: string) => void
  onError: (err: string) => void
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  model: string,
  signal: AbortSignal,
  cb: StreamCallbacks,
): Promise<void> {
  const settings = loadSettings()
  if (!settings.apiKey) {
    cb.onError('No API key set. Add your OpenAI key in Settings.')
    return
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    cb.onError(err?.error?.message ?? `OpenAI API error (${res.status})`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    cb.onError('Response body is not readable')
    return
  }
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') {
        cb.onDone(full)
        return
      }
      try {
        const json = JSON.parse(payload)
        const token = json.choices[0]?.delta?.content ?? ''
        if (token) {
          full += token
          cb.onToken(token)
        }
      } catch {
        // incomplete JSON, ignore — next chunk will complete it
      }
    }
  }
  cb.onDone(full)
}