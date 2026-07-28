import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { hasAnyApiKey } from '../lib/storage'
import { useExampleLang, EXAMPLES } from '../lib/exampleTexts'
import { createStructuredCompletion } from '../services/openai'

const supportIntentSchema = z.object({
  action: z.enum(['refund', 'cancel', 'status', 'complaint', 'other']),
  orderId: z.string().min(1),
  reason: z.string(),
  urgency: z.enum(['low', 'medium', 'high']),
})

const classificationSchema = z.object({
  category: z.enum(['delay', 'wrong_item', 'refund', 'cancellation', 'other']),
  priority: z.number().min(1).max(5),
  needsHuman: z.boolean(),
  summary: z.string().max(100),
})

const customerInfoSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  orderId: z.string().min(1),
  issue: z.string().min(1),
  sentiment: z.enum(['angry', 'frustrated', 'neutral', 'happy']),
})

type Preset = {
  label: string
  system: string
  textKey: keyof typeof EXAMPLES.structuredJson
  schema: z.ZodType<unknown>
  schemaLabel: string
}

const PRESETS: Preset[] = [
  {
    label: 'Extract support intent',
    system: `Extract structured data from a QuickBite support message. Return ONLY a JSON object with:
- action: "refund" | "cancel" | "status" | "complaint" | "other"
- orderId: string (the order id)
- reason: string (what the user says)
- urgency: "low" | "medium" | "high"
No markdown, no explanation. Valid JSON only.`,
    textKey: 'intent',
    schema: supportIntentSchema,
    schemaLabel: 'SupportIntent',
  },
  {
    label: 'Classify ticket',
    system: `Classify this QuickBite support message. Return ONLY JSON with:
- category: "delay" | "wrong_item" | "refund" | "cancellation" | "other"
- priority: number 1–5 (1 = urgent, 5 = low)
- needsHuman: boolean
- summary: string (max 100 chars)
No markdown, no explanation. Valid JSON only.`,
    textKey: 'classify',
    schema: classificationSchema,
    schemaLabel: 'Classification',
  },
  {
    label: 'Extract customer info',
    system: `Extract customer details from this message. Return ONLY JSON with:
- name: string
- phone: string (the phone number)
- orderId: string
- issue: string (describe the problem)
- sentiment: "angry" | "frustrated" | "neutral" | "happy"
No markdown, no explanation. Valid JSON only.`,
    textKey: 'customerInfo',
    schema: customerInfoSchema,
    schemaLabel: 'CustomerInfo',
  },
]

type AttemptResult =
  | { status: 'ok'; data: unknown; raw: string }
  | { status: 'parse_error'; error: string; raw: string }
  | { status: 'validation_error'; errors: { path: string; message: string }[]; raw: string }

type RunMeta = { cost: number; model: string; provider: string; tokens: number }

export function StructuredJsonDemo() {
  const lang = useExampleLang()
  const [presetIdx, setPresetIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<AttemptResult[]>([])
  const [meta, setMeta] = useState<RunMeta | null>(null)

  const preset = PRESETS[presetIdx]
  const presetUser = EXAMPLES.structuredJson[preset.textKey][lang]
  const hasKey = hasAnyApiKey()

  if (!hasKey) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-5 py-4 my-6">
        <p className="text-[13px] text-red-200">
          Add an API key in <a href="/settings" className="underline">Settings</a>.
        </p>
      </div>
    )
  }

  function validate(raw: string, schema: z.ZodType<unknown>): AttemptResult {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { status: 'parse_error', error: raw.slice(0, 200), raw }
    }

    const result = schema.safeParse(parsed)
    if (result.success) {
      return { status: 'ok', data: result.data, raw }
    }

    const errors = result.error.issues.map((iss) => ({
      path: iss.path.join('.'),
      message: iss.message,
    }))
    return { status: 'validation_error', errors, raw }
  }

  async function run() {
    setLoading(true)
    setError(null)
    setAttempts([])
    setMeta(null)

    try {
      let currentSystem = preset.system
      let currentUser = presetUser
      const results: AttemptResult[] = []

      for (let round = 0; round < 3; round++) {
        const messages = round === 0
          ? [
              { role: 'system' as const, content: currentSystem },
              { role: 'user' as const, content: currentUser },
            ]
          : [
              { role: 'system' as const, content: currentSystem },
              { role: 'user' as const, content: presetUser },
              { role: 'assistant' as const, content: results[results.length - 1]?.raw ?? '' },
              { role: 'user' as const, content: currentUser },
            ]

        const res = await createStructuredCompletion(
          messages,
          { type: 'json_object' },
          undefined,
          'chat',
        )

        const attempt = validate(res.content, preset.schema)
        results.push(attempt)

        if (attempt.status === 'ok') {
          setAttempts(results)
          setMeta({
            cost: res.cost,
            model: res.model,
            provider: res.provider,
            tokens: res.promptTokens + res.completionTokens,
          })
          setLoading(false)
          return
        }

        if (attempt.status === 'validation_error') {
          const fields = attempt.errors.map((e) => `- ${e.path}: ${e.message}`).join('\n')
          currentUser = `Your response failed validation:\n${fields}\n\nFix and return ONLY valid JSON matching the schema. No explanation.`
        } else {
          currentUser = 'Your response was not valid JSON. Return ONLY valid JSON, no markdown, no explanation.'
        }
      }

      setAttempts(results)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="my-6 space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onClick={() => { setPresetIdx(i); setAttempts([]); setMeta(null); setError(null) }}
            className={`rounded border px-2 py-1 text-[11px] transition-colors ${
              i === presetIdx
                ? 'border-emerald-600 bg-emerald-600/10 text-emerald-300'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Schema: {preset.schemaLabel}</p>
        <pre className="text-[11px] text-zinc-400 font-mono overflow-x-auto">
          {printSchema(preset.schema)}
        </pre>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">User message</p>
        <p className="text-[13px] text-zinc-300">{presetUser}</p>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-[13px] font-medium text-white"
      >
        {loading ? 'Running…' : 'Extract with JSON mode'}
      </button>

      {error && (
        <p className="text-[13px] text-red-300 rounded border border-red-500/30 bg-red-500/5 px-3 py-2">
          {error}
        </p>
      )}

      <AnimatePresence>
        {attempts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {attempts.map((a, i) => (
              <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                <p className="text-[11px] font-medium mb-2 flex items-center gap-2">
                  {i === 0 ? (
                    <span className="text-amber-300">Attempt 1 — JSON mode</span>
                  ) : (
                    <span className="text-amber-300">Attempt {i + 1} — retry with feedback</span>
                  )}
                  {a.status === 'ok' && <span className="text-emerald-500 text-[11px]">✓ passed</span>}
                  {a.status === 'parse_error' && <span className="text-red-400 text-[11px]">✗ invalid JSON</span>}
                  {a.status === 'validation_error' && <span className="text-red-400 text-[11px]">✗ schema failed</span>}
                </p>

                {a.raw && (
                  <pre className="text-[11px] text-zinc-400 font-mono bg-zinc-900 rounded px-2 py-1.5 overflow-x-auto mb-2 max-h-32">
                    {a.raw}
                  </pre>
                )}

                {a.status === 'parse_error' && (
                  <p className="text-[12px] text-red-300">Could not parse as JSON.</p>
                )}

                {a.status === 'validation_error' && (
                  <ul className="space-y-1">
                    {a.errors.map((e, ei) => (
                      <li key={ei} className="text-[12px] text-red-300">
                        <code className="text-zinc-500">{e.path}</code>: {e.message}
                      </li>
                    ))}
                  </ul>
                )}

                {a.status === 'ok' && (
                  <pre className="text-[12px] text-emerald-300 font-mono bg-zinc-900 rounded px-2 py-1.5 overflow-x-auto">
                    {JSON.stringify(a.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {meta && (
        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-zinc-500">
          <span>{meta.provider}/{meta.model}</span>
          <span>${meta.cost.toFixed(6)}</span>
          <span>{meta.tokens} tokens</span>
        </div>
      )}
    </div>
  )
}

function printSchema(schema: z.ZodType<unknown>): string {
  if (schema instanceof z.ZodObject) {
    const lines: string[] = ['{']
    for (const [key, shape] of Object.entries(schema.shape)) {
      const required = !(shape instanceof z.ZodOptional) && !(shape instanceof z.ZodNullable)
      const type = describeType(shape)
      lines.push(`  ${key}${required ? '' : '?'}: ${type}`)
    }
    lines.push('}')
    return lines.join('\n')
  }
  return String(schema)
}

function describeType(shape: z.ZodType<unknown>): string {
  if (shape instanceof z.ZodString) return 'string'
  if (shape instanceof z.ZodNumber) return 'number'
  if (shape instanceof z.ZodBoolean) return 'boolean'
  if (shape instanceof z.ZodEnum) return shape.options.map(String).join(' | ')
  if (shape instanceof z.ZodOptional || shape instanceof z.ZodNullable) {
    const inner = describeType((shape as any).innerType ?? shape)
    return `${inner} | null`
  }
  return 'unknown'
}
