import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { LangGraphDemo } from '../../../components/LangGraphDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { LessonRef } from '../../../components/LessonRef'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/bb6')({
  component: Bb6Page,
})

const { prev, next } = getNeighbors('bb6')

function Bb6Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('agents')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">LangGraph without the magic</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          What the most popular agent framework actually buys you in production.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          You know the vocabulary already — state, nodes, edges, cycles from{' '}
          <LessonRef id="a3" />. This lesson answers the practical question: LangGraph is in every
          other job posting, so <strong className="text-zinc-100">what does it give you that your{' '}
          <LessonRef id="a2">hand-built loop</LessonRef> cannot?</strong> Same rule as{' '}
          <LessonRef id="bb5" />: no intelligence added. What gets added is durability.
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Five things a while loop can't give you</h2>
        <ol className="list-decimal ml-5 space-y-3">
          <li>
            <strong className="text-zinc-200">Checkpointing (durable execution).</strong> State is
            saved after every node. Process crashes, deploy happens, laptop closes — the run resumes
            from the last checkpoint, not from zero. A plain loop keeps state in a variable; lose
            the process, lose the run.
          </li>
          <li>
            <strong className="text-zinc-200">Human-in-the-loop.</strong> The graph can pause at a
            node and wait — minutes or days — for a human decision, then resume with that input.
            Our <LessonRef id="a4" /> refund cap <em>blocked</em> the model; the LangGraph version
            routes to an approval node where a human says yes or no.
          </li>
          <li>
            <strong className="text-zinc-200">Step streaming.</strong> Every node execution streams
            to your UI as it happens. The traces you watched in our demos? That shape of visibility
            comes built in.
          </li>
          <li>
            <strong className="text-zinc-200">Time travel.</strong> Every checkpoint is restorable:
            rewind to any past state, change an input, re-run from there. Debugging an agent stops
            being "add console.log and pray."
          </li>
          <li>
            <strong className="text-zinc-200">Tracing (LangSmith).</strong> Every run, every state
            transition, logged and inspectable. The <LessonRef id="bb4" /> logging habit, done for
            you.
          </li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">How it works, mechanically</h2>
        <p>
          You declare a state shape, write node functions (each reads state, returns new state),
          wire edges — including the conditional edge that is your stop rule — and compile with a{' '}
          <em>checkpointer</em>. Calling <code className="font-mono text-zinc-400">invoke()</code>{' '}
          runs the same think → act → observe cycle as your loop, but snapshots state between
          nodes and can pause mid-graph for a human.
        </p>

        <Callout title="The QuickBite upgrade">
          In <LessonRef id="a4" />, a ₹2000 refund demand hit a hard block and escalated. The
          LangGraph version is smoother: the conditional edge routes big refunds to a{' '}
          <strong className="text-zinc-200">human_approval node</strong>. The graph checkpoints and
          waits. A human approves or rejects in a dashboard. The graph resumes — approved: run the
          refund; rejected: answer within policy. Try it in the demo below — <em>you</em> play the
          human.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">When to adopt vs hand-roll</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">Adopt LangGraph when:</strong> runs are long-lived,
            must survive restarts, need human approvals, or your team already standardizes on it.
          </li>
          <li>
            <strong className="text-zinc-200">Hand-roll when:</strong> the loop is short and
            single-session — a support answer, an extraction chain. Your 20-line loop has zero
            dependencies and is fully debuggable.
          </li>
          <li>
            <strong className="text-zinc-200">Either way:</strong> find the tools and the stop
            condition first. Those two define what the agent can do and what it can cost.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it: be the human in the loop</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          No API key needed — a simulated LangGraph run of the angry-user scenario. Watch state
          checkpoint after every node. The graph pauses at the refund approval:{' '}
          <strong>you decide</strong>. Then click any checkpoint to time-travel and try the other
          branch.
        </p>
        <LangGraphDemo />

        <UnderTheHood
          title="The same flow in LangGraph JS (TypeScript)"
          description="State schema + nodes + edges + checkpointer. The approval node reads a human's decision from state; invoke() resumes the paused graph with that input. The loop is your hand-built one — durability is what's new."
          language="tsx"
          code={`const graph = new StateGraph(AgentState)
  .addNode('agent', callModel)            // think
  .addNode('tools', runTools)             // act
  .addNode('human_approval', waitForHuman) // pause: checkpoint and wait
  .addConditionalEdges('agent', route)     // no tool_calls → END
  .addConditionalEdges('tools', (s) =>
    s.refundAmount > 500 ? 'human_approval' : 'agent')
  .addEdge('tools', 'agent')               // the cycle = your while loop
  .compile({ checkpointer: new MemorySaver() })

// resumes after the human approves/rejects:
await graph.invoke(input, { configurable: { thread_id: 'chat-42' } })`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'What does a checkpointer give you that a plain while loop does not?',
            options: [
              'Faster model calls',
              'State saved after every node — a crashed or restarted run resumes from the last checkpoint instead of starting over',
              'Free API calls',
              'Automatic prompt improvement',
            ],
            answer: 1,
            explanation:
              'A while loop keeps state in a variable; kill the process and the run is gone. Checkpointing makes runs durable — the difference between a demo and a long-running production workflow.',
          },
          {
            prompt: 'Human-in-the-loop in LangGraph means…',
            options: [
              'A human writes the prompts',
              'The graph pauses at a node, waits for a human decision (minutes or days), then resumes with that input — like our refund approval',
              'The model asks a human for permission to start',
              'A human watches the logs afterward',
            ],
            answer: 1,
            explanation:
              'The pause is a first-class feature: state checkpoints, the run waits, and resumes with the human input. That is what turns a blocked refund into an approval workflow.',
          },
          {
            prompt: 'What is "time travel" in an agent framework?',
            options: [
              'Running the model faster than real time',
              'Restoring any past checkpoint and re-running from that state with different input — a debugging superpower',
              'Scheduling agents to run later',
              'Replaying the user\'s screen recording',
            ],
            answer: 1,
            explanation:
              'Every checkpoint is a restore point. When a run goes wrong at step 4, you rewind to step 3, tweak the input, and re-run — instead of reproducing the whole conversation.',
          },
          {
            prompt: 'Your flow is a 3-step extraction chain in one request/response cycle. LangGraph or hand-roll?',
            options: [
              'LangGraph — always use the popular tool',
              'Hand-roll — the loop is short and single-session, so a 20-line loop is simpler and fully debuggable. Adopt LangGraph when runs must survive restarts or need human approvals',
              'Neither — call the API once',
              'LangGraph, but only for the checkpointing',
            ],
            answer: 1,
            explanation:
              'Frameworks earn their complexity when you need durability, pauses, or team standards. For short loops, zero-dependency code wins. Same judgment call as LangChain.',
          },
        ]}
        onComplete={() => setStatus('bb6', 'complete')}
        nextPath="/concept/s1"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
