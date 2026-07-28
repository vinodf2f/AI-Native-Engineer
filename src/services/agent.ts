/**
 * The agent loop (a2/a4).
 * One idea: repeat the bb1 round trip until the model answers in plain text.
 *
 * think → model returns tool_calls → your code runs them (guards can block)
 *       → results go back as role:tool messages → think again
 * stop  → model returns no tool_calls (final answer), or max steps hit
 */
import { postChat, type ChatMessage } from './openai'
import { executeTool, toApiTools, type ApiTool } from './tools'
import type { ProviderId } from '../lib/providers'

export type AgentToolStep = {
  type: 'tool_call'
  name: string
  args: Record<string, unknown>
  result: unknown
  /** True when a guard rule blocked execution (result is the guard's message) */
  blocked: boolean
  ms: number
}

export type AgentStep =
  | AgentToolStep
  | { type: 'final'; content: string }
  | { type: 'stopped'; reason: 'max_steps' }

export type AgentRun = {
  content: string
  steps: AgentStep[]
  iterations: number
  stoppedBy: 'final' | 'max_steps'
  promptTokens: number
  completionTokens: number
  cost: number
  model: string
  provider: ProviderId
}

export type GuardContext = {
  /** Order ids successfully fetched with get_order during this run */
  fetchedOrders: Set<string>
}

/** Return { allow: false, result } to block a tool call; the result is sent back to the model. */
export type GuardDecision = { allow: true } | { allow: false; result: unknown }

export async function runAgentLoop(options: {
  messages: ChatMessage[]
  tools?: ApiTool[]
  model?: string
  maxSteps?: number
  guardToolCall?: (
    name: string,
    args: Record<string, unknown>,
    ctx: GuardContext,
  ) => GuardDecision
}): Promise<AgentRun> {
  const tools = options.tools ?? toApiTools()
  const maxSteps = options.maxSteps ?? 5
  const messages: ChatMessage[] = [...options.messages]
  const steps: AgentStep[] = []
  const ctx: GuardContext = { fetchedOrders: new Set() }

  let promptTokens = 0
  let completionTokens = 0
  let cost = 0
  let model = ''
  let provider: ProviderId = 'openai'

  for (let iter = 1; iter <= maxSteps; iter++) {
    const res = await postChat(
      { model: options.model, messages, tools, tool_choice: 'auto' },
      'tools',
    )
    promptTokens += res.promptTokens
    completionTokens += res.completionTokens
    cost += res.cost
    model = res.model
    provider = res.provider

    const msg = res.data.choices[0].message as {
      content?: string | null
      tool_calls?: Array<{
        id: string
        type: string
        function: { name: string; arguments: string }
      }>
    }
    const rawCalls = msg.tool_calls ?? []

    // Stop condition: model answered in plain text
    if (rawCalls.length === 0) {
      const content = msg.content ?? ''
      steps.push({ type: 'final', content })
      return {
        content,
        steps,
        iterations: iter,
        stoppedBy: 'final',
        promptTokens,
        completionTokens,
        cost,
        model,
        provider,
      }
    }

    messages.push({
      role: 'assistant',
      content: msg.content ?? null,
      tool_calls: rawCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments ?? '{}' },
      })),
    })

    for (const tc of rawCalls) {
      const t0 = performance.now()
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>
      } catch {
        args = { _raw: tc.function.arguments }
      }

      const decision = options.guardToolCall?.(tc.function.name, args, ctx) ?? {
        allow: true as const,
      }

      let result: unknown
      let blocked = false
      if (decision.allow) {
        result = executeTool(tc.function.name, tc.function.arguments)
        if (tc.function.name === 'get_order' && typeof args.order_id === 'string') {
          ctx.fetchedOrders.add(args.order_id.trim().toUpperCase())
        }
      } else {
        result = decision.result
        blocked = true
      }

      steps.push({
        type: 'tool_call',
        name: tc.function.name,
        args,
        result,
        blocked,
        ms: Math.round(performance.now() - t0),
      })
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      })
    }
  }

  steps.push({ type: 'stopped', reason: 'max_steps' })
  return {
    content: `Stopped after ${maxSteps} steps without a final answer. In production this is where you hand off to a human.`,
    steps,
    iterations: maxSteps,
    stoppedBy: 'max_steps',
    promptTokens,
    completionTokens,
    cost,
    model,
    provider,
  }
}
