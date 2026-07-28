import { CHAT_PRICING, PROVIDERS, type ProviderId } from '../lib/providers'
import { loadSettings, resolveTask } from '../lib/storage'
import {
  runToolCalls,
  toApiTools,
  type ApiTool,
  type ToolCallRequest,
  type ToolRunLog,
} from './tools'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
  name?: string
}

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

export type ToolRoundTrip = {
  /** Final text the model sends to the user */
  content: string
  /** Steps: first model reply (may include tool_calls), tool results, final reply */
  steps: Array<
    | { type: 'assistant_text'; content: string; finishReason: string }
    | { type: 'tool_calls'; calls: ToolCallRequest[] }
    | { type: 'tool_results'; logs: ToolRunLog[] }
    | { type: 'final'; content: string }
  >
  promptTokens: number
  completionTokens: number
  cost: number
  model: string
  provider: ProviderId
  /** True if model never called a tool */
  usedTools: boolean
}

export async function postChat(body: Record<string, unknown>, task: 'chat' | 'tools' = 'chat') {
  const settings = loadSettings()
  const resolved = resolveTask(task, settings)
  const model = (body.model as string | undefined) ?? resolved.model
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
    body: JSON.stringify({ ...body, model }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `${PROVIDERS[provider].name} error (${res.status})`)
  }

  const data = await res.json()
  const price = CHAT_PRICING[model] ?? CHAT_PRICING['gpt-4o-mini']
  const usage = data.usage ?? {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  }
  const cost =
    (usage.prompt_tokens / 1_000_000) * price.in +
    (usage.completion_tokens / 1_000_000) * price.out

  return {
    data,
    model,
    provider,
    promptTokens: usage.prompt_tokens as number,
    completionTokens: usage.completion_tokens as number,
    totalTokens: (usage.total_tokens as number) ?? 0,
    cost,
  }
}

/**
 * Call chat completions with a `response_format` (e.g. JSON mode or structured outputs).
 * Shares the same auth/fetch/cost logic as the other helpers.
 */
export async function createStructuredCompletion(
  messages: ChatMessage[],
  responseFormat: Record<string, unknown>,
  model?: string,
  task: 'chat' | 'tools' = 'chat',
): Promise<ChatCompletion> {
  const {
    data,
    model: resolvedModel,
    provider,
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
  } = await postChat({ model, messages, response_format: responseFormat }, task)

  return {
    content: data.choices[0].message.content ?? '',
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
    model: resolvedModel,
    provider,
    finishReason: data.choices[0].finish_reason,
  }
}

export async function createChatCompletion(
  messages: ChatMessage[],
  model?: string,
  task: 'chat' | 'tools' = 'chat',
): Promise<ChatCompletion> {
  const { data, model: resolvedModel, provider, promptTokens, completionTokens, totalTokens, cost } =
    await postChat({ model, messages }, task)

  return {
    content: data.choices[0].message.content ?? '',
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
    model: resolvedModel,
    provider,
    finishReason: data.choices[0].finish_reason,
  }
}

/**
 * One tool-calling round trip (enough for teaching):
 * 1) model may request tools
 * 2) we run them locally
 * 3) model gets results and answers the user
 */
export async function createToolCompletion(options: {
  messages: ChatMessage[]
  tools?: ApiTool[]
  model?: string
}): Promise<ToolRoundTrip> {
  const tools = options.tools ?? toApiTools()
  const steps: ToolRoundTrip['steps'] = []
  let promptTokens = 0
  let completionTokens = 0
  let cost = 0

  const first = await postChat(
    {
      model: options.model,
      messages: options.messages,
      tools,
      tool_choice: 'auto',
    },
    'tools',
  )

  promptTokens += first.promptTokens
  completionTokens += first.completionTokens
  cost += first.cost

  const msg = first.data.choices[0].message as {
    content?: string | null
    tool_calls?: Array<{
      id: string
      type: string
      function: { name: string; arguments: string }
    }>
    role: string
  }
  const finishReason = first.data.choices[0].finish_reason as string

  const rawCalls = msg.tool_calls ?? []
  const calls: ToolCallRequest[] = rawCalls.map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: tc.function.arguments ?? '{}',
  }))

  if (calls.length === 0) {
    const content = msg.content ?? ''
    steps.push({ type: 'assistant_text', content, finishReason })
    steps.push({ type: 'final', content })
    return {
      content,
      steps,
      promptTokens,
      completionTokens,
      cost,
      model: first.model,
      provider: first.provider,
      usedTools: false,
    }
  }

  steps.push({ type: 'tool_calls', calls })
  const logs = runToolCalls(calls)
  steps.push({ type: 'tool_results', logs })

  const followUp: ChatMessage[] = [
    ...options.messages,
    {
      role: 'assistant',
      content: msg.content ?? null,
      tool_calls: rawCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments ?? '{}',
        },
      })),
    },
    ...logs.map((log) => ({
      role: 'tool' as const,
      tool_call_id: log.id,
      content: JSON.stringify(log.result),
    })),
  ]

  const second = await postChat(
    {
      model: options.model,
      messages: followUp,
      // no tools on second call — force a normal answer
    },
    'tools',
  )

  promptTokens += second.promptTokens
  completionTokens += second.completionTokens
  cost += second.cost

  const finalContent = second.data.choices[0].message.content ?? ''
  steps.push({ type: 'final', content: finalContent })

  return {
    content: finalContent,
    steps,
    promptTokens,
    completionTokens,
    cost,
    model: second.model,
    provider: second.provider,
    usedTools: true,
  }
}
