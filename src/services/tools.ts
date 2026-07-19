/**
 * Tool calling for bb1.
 * Model chooses a function; our code runs it (mock QuickBite backend).
 */

export type JsonSchema = {
  type: 'object'
  properties: Record<string, { type: string; description?: string }>
  required?: string[]
}

export type ToolDef = {
  name: string
  description: string
  parameters: JsonSchema
}

/** OpenAI / xAI chat.completions tools shape */
export type ApiTool = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: JsonSchema
  }
}

export type ToolCallRequest = {
  id: string
  name: string
  arguments: string
}

export type ToolRunLog = {
  id: string
  name: string
  args: Record<string, unknown>
  result: unknown
  ms: number
}

/** QuickBite mock tools — same world as the rest of the course. */
export const QUICKBITE_TOOLS: ToolDef[] = [
  {
    name: 'get_order',
    description:
      'Look up a QuickBite order by id. Returns status, items, restaurant, and delivery ETA.',
    parameters: {
      type: 'object',
      properties: {
        order_id: {
          type: 'string',
          description: 'Order id like QB-8821',
        },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'check_refund_policy',
    description:
      'Return the refund / replacement rule for a reason code (wrong_item, late, cancelled, other).',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'One of: wrong_item, late, cancelled, other',
        },
      },
      required: ['reason'],
    },
  },
  {
    name: 'start_refund',
    description:
      'Start a refund for an order. Only call after you know the order exists and policy allows it. Returns a refund request id.',
    parameters: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'Order id' },
        amount_inr: { type: 'number', description: 'Refund amount in INR' },
        reason: { type: 'string', description: 'Short reason for the refund' },
      },
      required: ['order_id', 'amount_inr', 'reason'],
    },
  },
]

export function toApiTools(defs: ToolDef[] = QUICKBITE_TOOLS): ApiTool[] {
  return defs.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }))
}

const ORDERS: Record<
  string,
  {
    order_id: string
    status: string
    items: string[]
    restaurant: string
    total_inr: number
    delivered_at?: string
    issue_note?: string
  }
> = {
  'QB-8821': {
    order_id: 'QB-8821',
    status: 'delivered',
    items: ['Butter chicken burger', 'Masala fries'],
    restaurant: 'Bombay Bun Co.',
    total_inr: 420,
    delivered_at: '18 min ago',
    issue_note: 'Customer reported wrong burger (veg instead of butter chicken)',
  },
  'QB-1102': {
    order_id: 'QB-1102',
    status: 'out_for_delivery',
    items: ['Paneer wrap', 'Nimbu soda'],
    restaurant: 'Wrap Factory',
    total_inr: 280,
    issue_note: 'Rider delayed in rain; ETA +25 min',
  },
  'QB-4400': {
    order_id: 'QB-4400',
    status: 'cancelled',
    items: ['Veg thali'],
    restaurant: 'Home Kitchen',
    total_inr: 199,
  },
}

const POLICIES: Record<string, string> = {
  wrong_item:
    'Wrong item: full refund or free replacement within 30 minutes of delivery. Customer chooses.',
  late: 'Late delivery over 20 min past ETA: ₹50 coupon or 10% off next order. Full refund only if order cancelled by kitchen.',
  cancelled: 'Cancelled before prep: full refund in 3–5 working days. After prep starts: no refund, coupon only.',
  other: 'Escalate to human support for anything outside wrong_item / late / cancelled.',
}

function normalizeOrderId(raw: unknown): string {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
  return s
}

/** Run one tool in our mock backend. Never trust the model with real money without your checks. */
export function executeTool(name: string, argsJson: string): unknown {
  let args: Record<string, unknown> = {}
  try {
    args = JSON.parse(argsJson || '{}') as Record<string, unknown>
  } catch {
    return { error: 'invalid_json_arguments', raw: argsJson }
  }

  if (name === 'get_order') {
    const id = normalizeOrderId(args.order_id)
    const order = ORDERS[id]
    if (!order) {
      return {
        found: false,
        order_id: id,
        message: 'No order with that id. Ask the user to check QB-#### format.',
      }
    }
    return { found: true, ...order }
  }

  if (name === 'check_refund_policy') {
    const reason = String(args.reason ?? 'other')
      .toLowerCase()
      .trim()
    const key = reason in POLICIES ? reason : 'other'
    return { reason: key, policy: POLICIES[key] }
  }

  if (name === 'start_refund') {
    const id = normalizeOrderId(args.order_id)
    const amount = Number(args.amount_inr)
    const reason = String(args.reason ?? '')
    if (!ORDERS[id]) {
      return { ok: false, error: 'order_not_found', order_id: id }
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: 'invalid_amount' }
    }
    return {
      ok: true,
      refund_id: `RF-${id.slice(3)}-${Date.now().toString().slice(-4)}`,
      order_id: id,
      amount_inr: amount,
      reason,
      status: 'queued',
      eta: '3–5 working days to original payment method',
    }
  }

  return { error: 'unknown_tool', name }
}

export function runToolCalls(calls: ToolCallRequest[]): ToolRunLog[] {
  return calls.map((c) => {
    const t0 = performance.now()
    let args: Record<string, unknown> = {}
    try {
      args = JSON.parse(c.arguments || '{}') as Record<string, unknown>
    } catch {
      args = { _raw: c.arguments }
    }
    const result = executeTool(c.name, c.arguments)
    return {
      id: c.id,
      name: c.name,
      args,
      result,
      ms: Math.round(performance.now() - t0),
    }
  })
}
