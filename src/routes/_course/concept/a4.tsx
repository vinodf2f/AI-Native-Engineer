import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { SupportAgentDemo } from '../../../components/SupportAgentDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { LessonRef } from '../../../components/LessonRef'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/a4')({
  component: A4Page,
})

const { prev, next } = getNeighbors('a4')

function A4Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('agents')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">QuickBite support agent</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          Loop + tools + policy + guardrails. The whole course, wired into one agent.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          Time to assemble everything. This agent uses the <LessonRef id="a2">hand-built loop</LessonRef>, the tools from <LessonRef id="bb1" />
          tools, the refund policy knowledge — and adds the piece that makes it shippable:{' '}
          <strong className="text-zinc-100">guardrails that live in code, not in the prompt.</strong>
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">The rule that matters most</h2>
        <p>
          A prompt instruction is a <em>suggestion</em>. The model can ignore it, misunderstand it,
          or be talked out of it by an angry user. A code rule <em>always runs</em>. So every rule
          involving money, safety, or verification in this agent is an if statement in your
          TypeScript:
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">Refund cap (₹500).</strong> The model may{' '}
            <em>ask</em> to refund ₹2000. Your guard blocks the call before it executes and hands
            back a message: escalate to a human.
          </li>
          <li>
            <strong className="text-zinc-200">Verify before refund.</strong>{' '}
            <code className="font-mono text-zinc-400">start_refund</code> is blocked unless{' '}
            <code className="font-mono text-zinc-400">get_order</code> already verified that order
            in this conversation. No refunds on vibes.
          </li>
          <li>
            <strong className="text-zinc-200">Max 5 iterations.</strong> Whatever the model wants,
            the loop stops. Budget guaranteed by construction.
          </li>
        </ul>

        <Callout title="How real systems layer this">
          Production support agents combine both kinds: <strong className="text-zinc-200">hard
          rules in code</strong> for money and safety (deterministic, auditable), and{' '}
          <strong className="text-zinc-200">model judgment</strong> for soft calls (does this user
          seem furious? is this topic out of scope?). The model-judged layer adds flexibility, but
          when they disagree, the code rule wins. Always.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">The handoff is a feature</h2>
        <p>
          Juniors ask "how do I make the agent handle everything?" Seniors ask "how does it fail?"
          A support agent that escalates 10% of conversations — cleanly, with the full context
          passed to a human — is a success. One that confidently processes a bad refund is a
          incident report. Watch the third preset below: the agent's best moment in this whole
          course is when it stops and hands off.
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">And the usual suspects still apply</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            Every iteration re-sends the transcript (<LessonRef id="bb3" />) — a 4-step resolution
            costs 4 growing calls.
          </li>
          <li>
            Log every step (<LessonRef id="bb4" />). When a refund goes wrong, the trace — calls,
            args, results, blocks — is the only way to see what the model decided and why.
          </li>
          <li>
            Eval the whole flow (<LessonRef id="b7" />): golden conversations, not just golden
            answers. "Angry user + ₹2000 demand → must end in escalation" is a test case.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          Three scenarios. The first resolves cleanly end to end. The second answers from policy
          without touching money. The third is the important one: watch the guard block the
          oversized refund and the agent escalate — that red box is production-grade behavior.
        </p>
        <SupportAgentDemo />

        <UnderTheHood
          title="How this works: guardToolCall in SupportAgentDemo"
          description="runAgentLoop (from the hand-built agent lesson) calls this hook before executing any tool. Returning allow:false swaps the real execution for your message — the model reads it and adapts (usually by escalating). The model proposes; your code disposes."
          language="tsx"
          code={`function guardToolCall(name, args, ctx) {
  if (name === 'start_refund') {
    // rule 1: verify before money moves
    if (!ctx.fetchedOrders.has(args.order_id.toUpperCase())) {
      return { allow: false, result: {
        ok: false, error: 'verify_first',
        message: 'Call get_order before refunding. Never refund an unverified order.',
      } }
    }
    // rule 2: hard cap — prompt can't talk its way past this
    if (args.amount_inr > 500) {
      return { allow: false, result: {
        ok: false, error: 'refund_cap_exceeded',
        message: 'Above ₹500 needs a human. Call escalate_to_human.',
      } }
    }
  }
  return { allow: true }
}`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'Why is the ₹500 refund cap a code rule instead of a line in the system prompt?',
            options: [
              'Code runs faster than prompts',
              'Prompts are suggestions the model can ignore or be talked out of; code always runs. Money and safety rules must be deterministic',
              'OpenAI does not allow numbers in prompts',
              'It uses fewer tokens',
            ],
            answer: 1,
            explanation:
              'An angry or clever user can pressure a model past any instruction. An if statement has no such weakness. Prompt for tone, code for rules.',
          },
          {
            prompt: 'The model calls start_refund before ever calling get_order. What should happen?',
            options: [
              'Execute it — the model knows best',
              'Your guard blocks it and returns "verify first" — the model adapts and fetches the order',
              'Delete the tool',
              'Restart the whole conversation',
            ],
            answer: 1,
            explanation:
              'The blocked result is itself a message to the model. Guards do not just prevent damage — they steer the agent back onto the right path.',
          },
          {
            prompt: 'A user is furious and demands ₹2000. The well-built agent…',
            options: [
              'Refunds ₹2000 to calm them down',
              'Refuses and ends the chat',
              'Hits the cap, escalates to a human with full context — a clean handoff beats a heroic model',
              'Loops until the user gives up',
            ],
            answer: 2,
            explanation:
              'Escalation is not the agent failing; it is the agent working as designed. The failure mode is an agent that confidently does something it should never do.',
          },
          {
            prompt: 'Why log every step of an agent run in production?',
            options: [
              'For the marketing dashboard',
              'Logs are only for errors',
              'When a refund goes wrong, the trace — calls, args, results, blocks — is the only way to reconstruct what the model decided and why',
              'To make demos look good',
            ],
            answer: 2,
            explanation:
              'Agent decisions happen at runtime, so you cannot review them in advance like code. The trace is your audit trail, your debug tool, and your eval dataset.',
          },
        ]}
        onComplete={() => setStatus('a4', 'complete')}
        nextPath="/concept/bb6"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
