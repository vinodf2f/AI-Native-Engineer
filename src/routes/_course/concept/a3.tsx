import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { AgentMapDemo } from '../../../components/AgentMapDemo'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { LessonRef } from '../../../components/LessonRef'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/a3')({
  component: A3Page,
})

const { prev, next } = getNeighbors('a3')

function A3Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('agents')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Read agents in any codebase</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          LangGraph and similar frameworks rename <LessonRef id="a2">the loop you built by hand</LessonRef>. Learn their five words, and any agent codebase becomes readable.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          In <LessonRef id="a2" /> you built an agent with a <code className="font-mono text-zinc-400">for</code> loop,
          an <code className="font-mono text-zinc-400">if</code>, and a messages array. Production
          teams usually don't hand-roll that — they use LangGraph, OpenAI's Agents SDK, the Vercel
          AI SDK, or CrewAI. Open any of their codebases and the first impression is alien:
          "state graphs", "nodes", "edges", "compiled graphs".{' '}
          <strong className="text-zinc-100">
            The one line to remember: a graph with a cycle is just a while loop with named parts.
          </strong>
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">The five words that cover 95% of agent code</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">State</strong> — the data carried between steps.
            Yours was the messages array.
          </li>
          <li>
            <strong className="text-zinc-200">Node</strong> — a function that reads state and
            returns new state. Your loop body was two: "call the model" and "run the tools."
          </li>
          <li>
            <strong className="text-zinc-200">Edge</strong> — fixed order between nodes. "After the
            model, run the tools" is an edge.
          </li>
          <li>
            <strong className="text-zinc-200">Conditional edge</strong> — a branch decided at
            runtime. Your <code className="font-mono text-zinc-400">if (no tool_calls) stop</code>.
            This is the only interesting branch in most agents.
          </li>
          <li>
            <strong className="text-zinc-200">Cycle</strong> — an edge that goes <em>backwards</em>,
            tools → model. That back edge IS your while loop.
          </li>
        </ul>

        <Callout title="Why frameworks exist at all, then">
          Same answer as <LessonRef id="bb5" />: not intelligence — plumbing. Persistence (resume a
          paused agent), streaming each step to a UI, human-in-the-loop pauses, retries, and
          multi-step branching that stays readable. The think → act → observe loop underneath is
          the one you wrote.
        </Callout>

        <p>
          <strong className="text-zinc-200">Read real code, often.</strong> Open-source agents
          either validate your understanding (same loop, new names) or teach you something new —
          both build confidence. Start with the OpenAI Agents SDK{' '}
          <a
            href="https://github.com/openai/openai-agents-js/blob/main/examples/customer-service/index.ts"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-800 underline-offset-2"
          >
            customer-service agent
          </a>{' '}
          (closest to our QuickBite agent) and its{' '}
          <a
            href="https://github.com/openai/openai-agents-js/tree/main/examples/agent-patterns"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-800 underline-offset-2"
          >
            agent patterns
          </a>
          . LangGraph gets its own lesson later in this section: <LessonRef id="bb6" />.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Explore the mapping</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          No API key needed. First, click through the concept mapping. Then flip through the three
          dialects — your loop, LangGraph, and an Agents SDK — and spot the loop in each.
        </p>
        <AgentMapDemo />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'Your messages array from the hand-built agent maps to which LangGraph concept?',
            options: [
              'A node',
              'An edge',
              'State — the data carried between steps',
              'The compiler',
            ],
            answer: 2,
            explanation:
              'State is whatever accumulates between steps. In your hand-rolled agent it was the transcript; LangGraph just makes you declare its shape explicitly.',
          },
          {
            prompt: "addConditionalEdges('agent', shouldContinue) corresponds to what in your hand-built loop?",
            options: [
              'The for loop counter',
              'Your if statement: no tool_calls → stop, otherwise go around again',
              'The tool definitions array',
              'The system prompt',
            ],
            answer: 1,
            explanation:
              'It is the runtime branch — the one decision that makes a chain into an agent. Everything else in the graph is fixed wiring.',
          },
          {
            prompt: "You see `await runner.run(agent, input)` in an SDK codebase and no loop anywhere. Where is the agent loop?",
            options: [
              'There is no loop — SDKs do not need one',
              'Inside the SDK. It runs the same think → tool → observe cycle for you; you declared tools and a max-turns number and it hides the plumbing',
              'The model runs the loop on its own servers',
              'The loop only exists in LangGraph',
            ],
            answer: 1,
            explanation: (
              <>Every framework runs your <LessonRef id="a2">hand-built</LessonRef> loop internally; they differ only in where it lives and what they add around it. Once you know that, no agent codebase is unreadable.</>
            ),
          },
          {
            prompt: 'Reviewing a stranger\'s agent PR, what should you find first?',
            options: [
              'Which LLM it uses',
              'The prompt template style',
              'Its tools (what it can do) and its stop condition (when it must stop) — together these define the blast radius',
              'Whether it uses TypeScript or Python',
            ],
            answer: 2,
            explanation:
              'Tools = possible actions, stop condition = worst-case cost. Those two facts tell you more about production risk than any other part of the code.',
          },
        ]}
        onComplete={() => setStatus('a3', 'complete')}
        nextPath="/concept/a4"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
