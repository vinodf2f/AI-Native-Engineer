import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { AgentTraceDiagram } from '../../../components/AgentTraceDiagram'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { LessonRef } from '../../../components/LessonRef'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/a1')({
  component: A1Page,
})

const { prev, next } = getNeighbors('a1')

function A1Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('agents')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">What an agent actually is</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          A loop, some tools, and a stop condition. That is the whole secret.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          Forget the hype for a minute. An "AI agent" in almost every production codebase is one
          thing: <strong className="text-zinc-100">the tool-calling pattern from <LessonRef id="bb1" />,
          wrapped in a loop.</strong> Instead of one round trip (model asks for a tool, you run it,
          model answers), the model can ask for <em>another</em> tool, and another, until it has
          enough to answer.
        </p>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 my-4 font-mono text-[11px] text-zinc-400 flex flex-wrap gap-2 items-center">
          <span className="text-amber-300/90">think (model call)</span>
          <span>→</span>
          <span className="text-sky-300/90">act (your code runs a tool)</span>
          <span>→</span>
          <span className="text-zinc-300">observe (result goes back)</span>
          <span>→</span>
          <span className="text-emerald-300/90">think again… or stop</span>
        </div>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">The three ingredients</h2>
        <ol className="list-decimal ml-5 space-y-3">
          <li>
            <strong className="text-zinc-200">A loop.</strong> The model's response goes back into
            the next request, with tool results attached. Each trip around the loop is one
            iteration — and one billable API call (<LessonRef id="bb4" /> instincts apply).
          </li>
          <li>
            <strong className="text-zinc-200">Tools.</strong> Same as <LessonRef id="bb1" />: the model proposes, your
            code executes. Nothing changes here except the model gets multiple chances to use them.
          </li>
          <li>
            <strong className="text-zinc-200">A stop condition.</strong> Two exits, always: the
            model answers in plain text (no more tool calls), or your max-steps limit fires.
            Without the second exit, a confused model loops forever, burning money.
          </li>
        </ol>

        <Callout title="QuickBite picture">
          "QB-8821 pe wrong item aaya, refund?" With single-shot <LessonRef id="bb1">tool calling</LessonRef>, the model gets
          one tool then must answer. As an agent, it can do what a human support rep does: look up
          the order, <em>then</em> check the refund policy, <em>then</em> start the refund — three
          steps, decided one at a time, based on what each step returned.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">What makes it feel "agentic"</h2>
        <p>
          The only new thing versus <LessonRef id="bb1" /> is that <strong className="text-zinc-200">the model chooses
          the next step based on the previous step's result.</strong> It doesn't know at the start
          that it will need the policy check — it decides <em>after</em> seeing the order says
          "wrong burger." That sequencing- decisions-at-runtime property is all people mean by
          "agentic."
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">When NOT to use an agent</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">Single, predictable lookup</strong> — one RAG call or
            one tool call is cheaper, faster, and can't go off the rails.
          </li>
          <li>
            <strong className="text-zinc-200">Fixed pipeline you already know</strong> — if steps
            are always A → B → C, write A → B → C in code. Don't pay a model to rediscover your
            own flowchart.
          </li>
          <li>
            <strong className="text-zinc-200">Anything where a wrong step is expensive</strong> —
            without guards (<LessonRef id="a4" />), an agent can take a wrong action confidently.
          </li>
        </ul>
        <p className="text-[13px] text-zinc-500">
          Rule of thumb: use an agent when the <em>sequence</em> of steps genuinely depends on data
          you only see at runtime. Otherwise, keep it deterministic.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Watch one loop run</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          No API key needed — this is a replay of a real agent trace. Watch the transcript grow
          with every iteration (that growth is the cost), and notice exactly where and why the
          loop stops.
        </p>
        <AgentTraceDiagram />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'An agent, at its core, is…',
            options: [
              'A much larger model with built-in memory',
              'The tool-calling pattern wrapped in a loop: model picks a tool, your code runs it, result goes back, repeat until the model answers in plain text',
              'A fine-tuned model trained on agent data',
              'A rules engine with an LLM attached to it',
            ],
            answer: 1,
            explanation:
              'Behind the marketing, every production agent is this same loop. Frameworks add state handling and nicer syntax, but the think → act → observe cycle is universal.',
          },
          {
            prompt: 'What ends an agent loop?',
            options: [
              'The model gets tired after enough steps',
              'OpenAI ends the conversation automatically',
              'Either the model replies with no tool_calls (it has a final answer), or your max-steps guard fires',
              'The user closes the chat window',
            ],
            answer: 2,
            explanation:
              'Two exits, always. The natural one: the model stops asking for tools. The safety one: a step cap you control. The second is not optional — it is the difference between a bug and a bill.',
          },
          {
            prompt: 'In the loop, who decides which tool runs next?',
            options: [
              'A flowchart you write in advance',
              'The model proposes the next call based on results so far; your code executes it (and can refuse)',
              'The tool framework picks randomly',
              'The previous tool decides the next one',
            ],
            answer: 1,
            explanation:
              'This runtime decision-making is the entire difference from a fixed pipeline. The model sees "wrong burger" and decides it now needs the policy. You never wrote that branch.',
          },
          {
            prompt: 'A user asks "what is your refund policy?" — one policy doc lookup. Should this be an agent?',
            options: [
              'Yes, agents are always better',
              'Yes, if you use a big enough model',
              'No — a single RAG lookup answers it. One call is cheaper, faster, and cannot wander off. Agents earn their cost only when the step sequence is unknowable upfront',
              'Only if the policy is very long',
            ],
            answer: 2,
            explanation:
              'Every iteration is a full API call. If you already know the shape of the work, deterministic code beats a model rediscovering it — on cost, latency, and reliability.',
          },
        ]}
        onComplete={() => setStatus('a1', 'complete')}
        nextPath="/concept/a2"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
