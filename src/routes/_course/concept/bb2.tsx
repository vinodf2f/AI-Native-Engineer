import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { StructuredJsonDemo } from '../../../components/StructuredJsonDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { LessonRef } from '../../../components/LessonRef'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/bb2')({
  component: Bb2Page,
})

const { prev, next } = getNeighbors('bb2')

function Bb2Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('building-blocks')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Structured JSON you can trust</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          Schema, validate, retry. Turn free text into data your app can use.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          <LessonRef id="bb1">Tool calling</LessonRef> is great when the model needs to <em>do</em> something. But many
          products need the model to <em>return structured data</em>: classify a ticket, extract
          fields from a message, fill a form. For that you need the model to output JSON — and you
          need to trust that JSON.
        </p>

        <Callout title="QuickBite picture">
          A user writes "My order QB-8821 arrived with wrong items, give refund." You don't want
          that as a blob of text — you want{' '}
          <code className="font-mono text-zinc-400">{'{'} action: 'refund', orderId: 'QB-8821',
          urgency: 'high' {'}'}</code> fed into your triage system. Structured JSON is the bridge
          between free-text input and typed code.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Three layers of reliability</h2>
        <ol className="list-decimal ml-5 space-y-3">
          <li>
            <strong className="text-zinc-200">JSON mode</strong> — Tell the API to return valid
            JSON. Use <code className="font-mono text-zinc-400">{'{'} response_format: {'{'} type:
            'json_object' {'}'} {'}'}</code> and the model will never return plain text.
          </li>
          <li>
            <strong className="text-zinc-200">Schema + validation</strong> — Define the shape you
            expect (with Zod or JSON Schema). Parse the model's output and check every field.
          </li>
          <li>
            <strong className="text-zinc-200">Retry loop</strong> — If validation fails, send the
            error back to the model. It usually fixes itself in one more call.
          </li>
        </ol>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 my-4 font-mono text-[11px] text-zinc-400 flex flex-wrap gap-2 items-center">
          <span className="text-zinc-300">free text</span>
          <span>→</span>
          <span className="text-amber-300/90">JSON mode</span>
          <span>→</span>
          <span className="text-sky-300/90">Zod validate</span>
          <span>→</span>
          {<span className="text-red-400/70">retry if fail</span>}
          <span>→</span>
          <span className="text-zinc-300">typed data</span>
        </div>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Layer 1: JSON mode</h2>
        <p>
          OpenAI and Grok both support <code className="font-mono text-zinc-400">response_format:
          {'{'} type: 'json_object' {'}'}</code>. When set, the model will always return valid
          JSON. But it still needs a system prompt that tells it <em>what</em> to put in the JSON.
        </p>
        <p className="text-[13px] text-zinc-500">
          Without a shape in the prompt, the model decides what keys to include itself. Always pair
          JSON mode with a schema description in your system prompt.
        </p>

        <pre className="rounded border border-zinc-800 bg-zinc-950 px-4 py-3 text-[12px] leading-relaxed text-zinc-400 overflow-x-auto">
{`// System prompt + JSON mode
{ role: 'system', content: 'Return ONLY JSON with: name (string), age (number). No markdown.' }
{ response_format: { type: 'json_object' } }`}
        </pre>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Layer 2: Schema + validation</h2>
        <p>
          JSON mode guarantees valid JSON syntax, but not the <em>shape</em>. The model might
          return <code className="font-mono text-zinc-400">{'{'} "name": "Rahul" {'}'}</code> when
          you also needed <code className="font-mono text-zinc-400">age</code>. Always validate
          programmatically.
        </p>

        <Callout title="Zod is your friend">
          Define a schema with Zod, call <code className="font-mono text-zinc-400">safeParse</code>,
          and catch the failures. The error tells you exactly which field is missing or wrong.
        </Callout>

        <pre className="rounded border border-zinc-800 bg-zinc-950 px-4 py-3 text-[12px] leading-relaxed text-zinc-400 overflow-x-auto">
{`// Validate with Zod
const Schema = z.object({
  name: z.string(),
  age: z.number(),
})
const result = Schema.safeParse(JSON.parse(raw))
if (!result.success) {
  console.log(result.error.issues)  // which fields failed
}`}
        </pre>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Layer 3: Retry on failure</h2>
        <p>
          When validation fails, add a user message with the errors and call the API again. The
          model sees its mistake and fixes it. One retry usually works; two is almost always enough.
        </p>

        <pre className="rounded border border-zinc-800 bg-zinc-950 px-4 py-3 text-[12px] leading-relaxed text-zinc-400 overflow-x-auto">
{`// Retry after failed validation
messages.push(
  { role: 'assistant', content: modelResponse },
  { role: 'user', content: \`Your response failed.\${errors}\` },
)
const fixed = await chat(messages)`}
        </pre>

        <p className="text-[13px] text-zinc-500">
          Each retry costs another completion call. Budget accordingly, and set a max retry count
          (usually 2-3) to avoid infinite loops.
        </p>

        <Callout title="When not to use JSON mode">
          If you already have <LessonRef id="bb1">tool calling</LessonRef>, you get structured output for free — the tool
          response IS validated JSON. JSON mode is for cases where you don't want to define a full
          tool (classification, extraction, form filling).
        </Callout>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          Pick a scenario. The demo calls the model with JSON mode, validates the output with Zod,
          and retries automatically if validation fails. Watch the steps.
        </p>
        <StructuredJsonDemo />

        <UnderTheHood
          title="How this works: response_format + Zod safeParse + retry loop"
          description="createStructuredCompletion passes response_format to the API. The demo then validates with Zod.safeParse. If it fails, it builds a new user message with the validation errors and retries — exactly what a production app would do."
          language="tsx"
          code={`// 1) Call with JSON mode
const res = await createStructuredCompletion(
  messages,
  { type: 'json_object' },
)

// 2) Parse + validate
let parsed: unknown
try { parsed = JSON.parse(res.content) } catch { /* retry */ }
const result = schema.safeParse(parsed)

// 3) Retry on failure
if (!result.success) {
  const errors = result.error.issues
    .map(i => \`- \${i.path.join('.')}: \${i.message}\`)
    .join('\\n')

  messages.push(
    { role: 'assistant', content: res.content },
    { role: 'user', content: \`Fix these:\\n\${errors}\\nReturn valid JSON.\` },
  )

  const fixed = await createStructuredCompletion(messages, { type: 'json_object' })
}`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'You set response_format: { type: "json_object" }. The model returns { "name": "Rahul" }. You needed both name and age. What happened?',
            options: [
              'JSON mode is broken — switch to json_schema',
              'JSON mode guarantees valid JSON syntax, not the right shape. Always validate with a schema after parsing.',
              'The model ignored your system prompt — retry with higher temperature',
              'JSON mode only works with GPT-4, not mini models',
            ],
            answer: 1,
            explanation: 'JSON mode ensures the output is valid JSON. It does not enforce the schema. You tell the model the shape via the system prompt, but the only way to be sure is to validate programmatically (Zod, JSON Schema, etc.).',
          },
          {
            prompt: 'Validation fails. The model returned extra fields your schema doesn\'t allow. What should you do?',
            options: [
              'Throw away the response and show the user an error',
              'Add a retry message with the specific errors: "Return ONLY the fields listed in the schema." Most models fix it in one retry.',
              'Increase temperature — random models output fewer fields',
              'Switch to a different AI provider',
            ],
            answer: 1,
            explanation: 'The retry loop is cheap and effective. Tell the model exactly what went wrong ("field X is not in the schema") and ask it to fix. Usually works on the first retry. Set a max retries limit (2-3) for safety.',
          },
          {
            prompt: 'You already have tool calling set up. When would you still use JSON mode instead?',
            options: [
              'Never — tools cover everything JSON mode does',
              'When you don\'t need a function call, just data extraction or classification — JSON mode is simpler, cheaper (one round trip), and doesn\'t require tool definitions',
              'JSON mode is always faster than tools',
              'Only with xAI models — OpenAI doesn\'t need JSON mode',
            ],
            answer: 1,
            explanation: 'Tool calling shines for actions (get_order, start_refund). But for pure data extraction or classification, JSON mode is simpler — one call, no tool definitions, no tool execution step. Pick the right tool for the job.',
          },
          {
            prompt: 'How many retries should a production system attempt before giving up?',
            options: [
              '0 — one shot or fail',
              'Always retry exactly 5 times — more is safer',
              '2-3 max. Most failures fix on the first retry. Beyond 3, the model is probably confused or the prompt is wrong.',
              'Retry indefinitely — the model will eventually get it right',
            ],
            answer: 2,
            explanation: 'In practice, the first retry fixes 95%+ of failures. A second retry covers almost all. After 3 attempts, something fundamental is wrong (bad prompt, wrong model, impossible schema). Set a cap to avoid runaway costs.',
          },
        ]}
        onComplete={() => setStatus('bb2', 'complete')}
        nextPath="/concept/bb3"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
