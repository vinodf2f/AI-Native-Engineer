import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { MemoryDemo } from '../../../components/MemoryDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/bb3')({
  component: Bb3Page,
})

const { prev, next } = getNeighbors('bb3')

function Bb3Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('building-blocks')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Chat memory</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          Multi-turn history without blowing your context window or your budget.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          The chat API is <strong className="text-zinc-100">stateless</strong>. It remembers
          nothing between calls. So how does a support bot remember that you said your name and
          order id five messages ago? Your app resends the conversation history with every call.
          "Memory" is not a model feature. It is your code keeping a transcript.
        </p>

        <Callout title="QuickBite picture">
          User: "Hi, mera naam Rahul hai, order QB-8821." Four messages later: "So what happens to{' '}
          <em>my order</em>?" The words "my order" only make sense because the earlier messages are
          in the payload. Drop them, and the bot asks "which order?" — a broken product.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">The problem: history grows every turn</h2>
        <p>
          Every call re-sends the full transcript, and you are billed for those prompt tokens{' '}
          <em>again</em> on each call. Turn 1 costs 200 tokens. Turn 20 resends all previous 19
          turns plus the new one. Cost per call grows linearly, and eventually you hit the context
          window limit and the API rejects the request.
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Three strategies</h2>
        <ol className="list-decimal ml-5 space-y-3">
          <li>
            <strong className="text-zinc-200">Full history</strong> — send everything, every time.
            Perfect memory. Fine for short chats (support tickets that close in 5-6 turns). Cost
            grows with every turn.
          </li>
          <li>
            <strong className="text-zinc-200">Sliding window</strong> — send only the last N
            messages (plus the system prompt). Predictable, capped cost. But the model forgets
            anything older than the window: names, order ids, promises made earlier.
          </li>
          <li>
            <strong className="text-zinc-200">Summarize old turns</strong> — when history gets
            long, make one extra call to compress old messages into a short summary. Send the
            summary plus recent messages. Best of both: old facts survive, cost stays bounded. The
            price is one extra compression call every so often.
          </li>
        </ol>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 my-4 font-mono text-[11px] text-zinc-400 flex flex-wrap gap-2 items-center">
          <span className="text-zinc-300">system</span>
          <span>+</span>
          <span className="text-red-400/70">old turns (drop or summarize)</span>
          <span>+</span>
          <span className="text-sky-300/90">recent turns</span>
          <span>+</span>
          <span className="text-zinc-300">new user message</span>
        </div>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Rules that keep you out of trouble</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">Never drop the system prompt.</strong> It goes on
            every call, windowed or not.
          </li>
          <li>
            <strong className="text-zinc-200">Cut at message boundaries,</strong> never mid-message.
            Half a tool call or half a JSON block confuses the model.
          </li>
          <li>
            <strong className="text-zinc-200">Keep facts, not filler,</strong> in summaries:
            names, ids, decisions, promises. Not "the user greeted the bot."
          </li>
          <li>
            <strong className="text-zinc-200">Log what you send.</strong> If an answer looks wrong,
            the first thing to check is which messages were actually in the payload.
          </li>
        </ul>

        <Callout title="How chat products do it">
          ChatGPT-style products use a mix: recent messages verbatim, older ones summarized or
          retrieved. The demo below runs the same three strategies with real API calls, so you can
          feel the cost and the forgetting.
        </Callout>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          Chat with the bot. Tell it your name and order id, send a few more messages, then ask
          "what is my name?" Watch the payload panel: full history grows every turn, the window
          drops old messages (and the bot forgets you), and the summary strategy compresses old
          turns into a stored summary.
        </p>
        <MemoryDemo />

        <UnderTheHood
          title="How this works: buildPayload + maybeSummarize in MemoryDemo"
          description="The demo keeps the full transcript locally (the truth), then builds a per-call payload from the chosen strategy. Summary mode makes one extra compression call when old turns fall outside the window, then sends summary + recent messages."
          language="tsx"
          code={`function buildPayload(turns, summary, strategy) {
  const visible = strategy === 'full' ? turns : turns.slice(-WINDOW)
  const msgs = [SYSTEM]                       // system always survives
  if (strategy === 'summary' && summary) {
    msgs.push({ role: 'system', content: \`Earlier summary: \${summary}\` })
  }
  return [...msgs, ...visible]
}

// compression call when old turns fall outside the window
const res = await chat([
  { role: 'system', content: 'Summarize in 2-3 sentences. Keep facts: names, ids.' },
  { role: 'user', content: oldTurns.map(t => t.role + ': ' + t.content).join('\\n') },
])
setSummary(res.content)                       // replaces old turns in future calls`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'The chat API is stateless. So how does a multi-turn support chat remember what you said 5 messages ago?',
            options: [
              'OpenAI stores your conversation on their servers for 30 days',
              'The model fine-tunes itself on your chat as you talk',
              'Your app resends the conversation history with every API call',
              'The browser caches embeddings of past messages',
            ],
            answer: 2,
            explanation:
              'There is no server-side memory. Each call carries the full messages array. "Memory" is your code keeping the transcript — which is exactly why history drives cost.',
          },
          {
            prompt: 'A support chat runs 40 turns. Each new call costs noticeably more than the first. Why?',
            options: [
              'OpenAI raises prices for long conversations',
              'Every call re-sends the full history, and those prompt tokens are billed again each time',
              'The model gets slower as it remembers more',
              'Assistant messages are billed at double rate',
            ],
            answer: 1,
            explanation:
              'Prompt tokens are billed per call. Full-history chat means turn N re-bills turns 1..N-1 every time. This is the number one surprise in production chat costs.',
          },
          {
            prompt: 'You switch to a sliding window of the last 4 messages. What do you gain and what do you lose?',
            options: [
              'Gain: better answers. Lose: nothing',
              'Gain: predictable, capped cost per call. Lose: the model forgets anything older than the window — names, order ids from early in the chat',
              'Gain: no more hallucination. Lose: streaming stops working',
              'Gain: faster GPU. Lose: the API key expires sooner',
            ],
            answer: 1,
            explanation:
              'The window caps cost but deletes old context. Try it in the demo: tell the bot your name, chat past the window, then ask your name. It will not know.',
          },
          {
            prompt: 'When is summarize-and-keep-recent better than a plain sliding window?',
            options: [
              'Always — summaries are free',
              'Never — windows are strictly better',
              'Long chats where early details still matter later (order id, a promised refund). One compression call keeps the meaning without resending 40 turns',
              'Only when users write in Hindi',
            ],
            answer: 2,
            explanation:
              'Summarization trades one extra call for keeping old facts alive. For short chats it is overkill; for long support conversations it is the standard pattern.',
          },
        ]}
        onComplete={() => setStatus('bb3', 'complete')}
        nextPath="/concept/bb4"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
