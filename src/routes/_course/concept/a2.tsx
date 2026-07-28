import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { AgentLoopDemo } from '../../../components/AgentLoopDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { LessonRef } from '../../../components/LessonRef'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/a2')({
  component: A2Page,
})

const { prev, next } = getNeighbors('a2')

function A2Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('agents')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Build a small agent by hand</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          Think → call tool → observe, in plain TypeScript. No framework, ~20 lines.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          This is the lesson where agents stop being theory. You are going to run a real loop
          against the live API: the model decides which tool it needs, your code runs it, the
          result goes back, and this repeats until the model has an answer. The code is the same
          round trip from <LessonRef id="bb1" /> — just inside a <code className="font-mono text-zinc-400">for</code> loop.
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">The whole loop, in words</h2>
        <ol className="list-decimal ml-5 space-y-2">
          <li>Send messages + tool definitions to the model.</li>
          <li>
            If the reply has <strong className="text-zinc-200">no tool_calls</strong>, that text is
            the final answer. <strong className="text-zinc-200">Return it. Loop over.</strong>
          </li>
          <li>
            Otherwise, append the assistant's tool_calls message to the transcript (the API is
            stateless — <LessonRef id="bb3" />), run each tool yourself, and append the results as{' '}
            <code className="font-mono text-zinc-400">role: 'tool'</code> messages.
          </li>
          <li>Go to 1. Give up after a fixed number of iterations.</li>
        </ol>

        <Callout title="Read it until you can write it">
          The UnderTheHood snippet below is ~20 lines and is genuinely the entire mechanism behind
          every agent framework you will ever meet. If you can write this loop from memory, you can
          read any agent code in any codebase. That is the goal of this whole section.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Two details that bite people</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">The transcript must include the assistant's tool_calls
            message,</strong> not just the results. Skip it and the API rejects the tool messages —
            a tool result must answer a specific tool_call id.
          </li>
          <li>
            <strong className="text-zinc-200">Every iteration re-sends everything.</strong> A
            4-iteration agent run is 4 full API calls with a growing transcript. Watch the cost
            readout in the demo — agents are not free.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          The first preset needs three tools in sequence — the model can't know the refund rule
          until it sees the order. The greeting preset shows the other exit: zero iterations of
          tools, straight to an answer. Watch each loop step and where the run stops.
        </p>
        <AgentLoopDemo />

        <UnderTheHood
          title="How this works: services/agent.ts — runAgentLoop"
          description="The full agent, minus error handling and cost tracking. tools and executeTool are the same ones from the tool-calling lesson. The only new ideas: the for loop, the stop check, and appending both the assistant tool_calls message and the tool results before going around again."
          language="tsx"
          code={`for (let i = 0; i < maxSteps; i++) {
  const res = await postChat({ messages, tools, tool_choice: 'auto' }, 'tools')
  const msg = res.data.choices[0].message

  // stop: model answered in plain text
  if (!msg.tool_calls?.length) return msg.content

  // keep the transcript complete: assistant's request AND your results
  messages.push({ role: 'assistant', content: msg.content, tool_calls: msg.tool_calls })

  for (const call of msg.tool_calls) {
    const result = executeTool(call.function.name, call.function.arguments)
    messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
  }
}
// out of budget — in production, hand off to a human here
return 'Stopped: max steps reached.'`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'On each iteration of the loop, what does the model actually return?',
            options: [
              'Always a tool call',
              'Always final text',
              'Either tool_calls (keep looping) or plain text (stop) — your loop checks which one it got',
              'A probability score for each tool',
            ],
            answer: 2,
            explanation:
              'The stop condition is literally an if statement on the response shape. No tool_calls means the model is done. Everything else about agents is plumbing around that check.',
          },
          {
            prompt: 'Why must tool results go back into the messages array?',
            options: [
              'So OpenAI can bill for them',
              'The API is stateless — the model only "sees" a tool result if you paste it into the next request as a role: tool message',
              'To train the model on your tools',
              'It is optional but recommended',
            ],
            answer: 1,
            explanation: (
              <>Same lesson as <LessonRef id="bb3" />: no server-side memory. The growing transcript IS the agent's working memory, rebuilt and re-sent on every iteration.</>
            ),
          },
          {
            prompt: 'What happens if you run the loop without a max-steps cap?',
            options: [
              'Nothing — models always stop eventually',
              'The API cuts you off after 10 calls',
              'A confused or adversarial conversation can loop indefinitely, and every iteration is a full billable API call',
              'The tools stop working after an hour',
            ],
            answer: 2,
            explanation:
              'The cap is your only hard guarantee on cost and latency. Production agents also add per-run token budgets and timeouts for the same reason.',
          },
          {
            prompt: 'Compared to the single tool-calling round trip, the agent loop adds…',
            options: [
              'A smarter model',
              'Repeating the same round trip until the model stops asking for tools — with each iteration still costing a full call',
              'Server-side memory between calls',
              'Automatic error correction',
            ],
            answer: 1,
            explanation: (
              <>There is no new machinery. <LessonRef id="bb1" /> was one trip around this exact loop. An agent is N trips, chosen by the model at runtime.</>
            ),
          },
        ]}
        onComplete={() => setStatus('a2', 'complete')}
        nextPath="/concept/a3"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
