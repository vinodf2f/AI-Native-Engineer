import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { ToolCallingDemo } from '../../../components/ToolCallingDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/bb1')({
  component: Bb1Page,
})

const { prev, next } = getNeighbors('bb1')

function Bb1Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('building-blocks')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Tool calling</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          The model picks a function. Your app runs it. That is how AI stops being only chat.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          So far the model only returned text. Real products need it to{' '}
          <strong className="text-zinc-100">use your systems</strong>: look up an order, read a
          policy table, start a refund. That pattern is called{' '}
          <strong className="text-zinc-100">tool calling</strong> (also function calling).
        </p>

        <Callout title="QuickBite picture">
          User: "QB-8821 pe wrong item aaya, refund?" The model should not invent status. It should
          ask your backend via tools: <code className="font-mono text-zinc-400">get_order</code>,
          maybe <code className="font-mono text-zinc-400">check_refund_policy</code>, then answer
          with real data.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">What actually happens</h2>
        <ol className="list-decimal ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">You send tools</strong> with the chat request: name,
            description, JSON argument schema.
          </li>
          <li>
            <strong className="text-zinc-200">Model replies with tool_calls</strong> (or plain text
            if it does not need a tool). It does not run your code.
          </li>
          <li>
            <strong className="text-zinc-200">Your code runs the function</strong> (DB, HTTP, mock).
            You decide auth and limits.
          </li>
          <li>
            <strong className="text-zinc-200">You send results back</strong> as{' '}
            <code className="font-mono text-zinc-400">role: tool</code> messages.
          </li>
          <li>
            <strong className="text-zinc-200">Model writes the user answer</strong> using those
            results.
          </li>
        </ol>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 my-4 font-mono text-[11px] text-zinc-400 flex flex-wrap gap-2 items-center">
          <span className="text-zinc-300">user</span>
          <span>→</span>
          <span className="text-amber-300/90">model: tool_calls</span>
          <span>→</span>
          <span className="text-sky-300/90">your execute()</span>
          <span>→</span>
          <span className="text-zinc-300">model: final text</span>
        </div>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">What the model never does</h2>
        <ul className="list-disc ml-5 space-y-1.5 text-zinc-400">
          <li>It does not open your database.</li>
          <li>It does not charge a card by itself.</li>
          <li>It only proposes: "please call start_refund with these args."</li>
        </ul>
        <p className="text-[13px] text-zinc-500">
          That split is the whole point. Keep money and auth in your code. Let the model choose{' '}
          <em>which</em> tool and <em>with what args</em>.
        </p>

        <Callout title="When you do not need a tool">
          "Hi" or "explain refunds in general" can be plain text. Tools cost extra tokens (often two
          model calls). Use them when the answer needs live or private data.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Good tool design</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">Clear names</strong> —{' '}
            <code className="font-mono text-zinc-400">get_order</code>, not{' '}
            <code className="font-mono text-zinc-400">doStuff</code>.
          </li>
          <li>
            <strong className="text-zinc-200">Tight descriptions</strong> — when to use the tool,
            and when not to.
          </li>
          <li>
            <strong className="text-zinc-200">Small args</strong> — ids and enums, not whole essays.
          </li>
          <li>
            <strong className="text-zinc-200">Safe defaults</strong> — refuse huge refunds; require
            a human for risky actions (later lessons).
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          QuickBite mock tools. Watch the three steps: model asks for a tool → your JS runs it →
          model answers. Try the "just say hi" preset to see a path with no tools.
        </p>
        <ToolCallingDemo />

        <UnderTheHood
          title="How this works: services/tools.ts + createToolCompletion"
          description="Tools are plain JSON schemas. executeTool is your backend (here a mock). createToolCompletion does one auto round trip: first completion with tools, run calls, second completion with role:tool results."
          language="tsx"
          code={`// 1) Describe tools
const tools = [{
  type: 'function',
  function: {
    name: 'get_order',
    description: 'Look up a QuickBite order',
    parameters: {
      type: 'object',
      properties: { order_id: { type: 'string' } },
      required: ['order_id'],
    },
  },
}]

// 2) First call — model may return tool_calls
const r1 = await chat({ messages, tools, tool_choice: 'auto' })

// 3) You run the function (never the model)
const result = executeTool(name, argsJson)

// 4) Second call — give results back
messages.push(
  { role: 'assistant', tool_calls: r1.tool_calls },
  { role: 'tool', tool_call_id, content: JSON.stringify(result) },
)
const r2 = await chat({ messages }) // final user-facing text`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'Who runs get_order when the model "calls" it?',
            options: [
              'OpenAI / xAI runs it on their servers automatically',
              'Your application code runs it after reading tool_calls from the response',
              'The browser SQL engine',
              'Nobody — tool_calls is only documentation',
            ],
            answer: 1,
            explanation:
              'The API only returns a structured request. Your backend (or this demo mock) executes and returns JSON in a tool message.',
          },
          {
            prompt: 'User says only "Hi". What should a well-prompted support bot do?',
            options: [
              'Always call get_order with a random id',
              'Reply in plain text without tools',
              'Call start_refund for goodwill',
              'Refuse to answer until an order id is given',
            ],
            answer: 1,
            explanation:
              'Tools are for live data. A greeting does not need them. Extra tool calls waste tokens and can invent junk args.',
          },
          {
            prompt: 'Why keep start_refund as a tool instead of letting the model invent "refund done"?',
            options: [
              'Because models cannot output the word refund',
              'So your code controls money movement, ids, and audit logs; the model only proposes the action',
              'Because tools are free',
              'Because JSON is illegal in normal chat',
            ],
            answer: 1,
            explanation:
              'Side effects belong in your systems. The model chooses intent and args; you enforce policy and write the real refund row.',
          },
          {
            prompt: 'What is the usual minimum number of model HTTP calls for one tool use?',
            options: [
              'Zero — tools replace the model',
              'One — tools and answer in the same response always',
              'Two — one to request tools, one after you return results (unless the model skips tools)',
              'Ten — one per token',
            ],
            answer: 2,
            explanation:
              'Classic pattern is two completions when tools run. If the model answers without tools, one call is enough. Agents may loop more times later.',
          },
        ]}
        onComplete={() => setStatus('bb1', 'complete')}
        nextPath="/concept/bb2"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
