import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { ProxyCostDemo } from '../../../components/ProxyCostDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { LessonRef } from '../../../components/LessonRef'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/bb4')({
  component: Bb4Page,
})

const { prev, next } = getNeighbors('bb4')

function Bb4Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('building-blocks')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Keys, proxy, cost</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          How real apps wire AI safely — and what it actually costs.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          Every demo in this course calls OpenAI directly from your browser, with your key in the
          page. That is fine for learning on your own machine. It is <strong className="text-zinc-100">
          never acceptable in a shipped product</strong>, and this lesson is about why — plus the
          simple pattern every real app uses instead.
        </p>

        <Callout title="Why the browser key must die">
          Open devtools on any page running this course: Network tab → any request → Authorization
          header → your full key, ready to copy. Anyone who visits your site can take it and run up
          your bill. There is no obfuscation that fixes this. If code runs on the user's machine,
          the user can read its secrets.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">The production pattern: your server as proxy</h2>
        <p>
          The browser calls <em>your</em> endpoint (<code className="font-mono text-zinc-400">/api/chat</code>)
          with your normal app auth. Your server holds the OpenAI key in an environment variable and
          makes the real API call. The key never leaves your infrastructure.
        </p>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 my-4 font-mono text-[11px] text-zinc-400 flex flex-wrap gap-2 items-center">
          <span className="text-zinc-300">browser</span>
          <span>→</span>
          <span className="text-amber-300/90">your /api/chat (auth, limits, logs)</span>
          <span>→</span>
          <span className="text-sky-300/90">OpenAI (key in server env)</span>
        </div>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">The proxy is not just a key hider</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">Auth</strong> — only logged-in users can call it.
          </li>
          <li>
            <strong className="text-zinc-200">Rate limits</strong> — 20 messages per user per day,
            so one user cannot burn your budget.
          </li>
          <li>
            <strong className="text-zinc-200">Prompt assembly</strong> — the system prompt and tool
            definitions live server-side, where users cannot tamper with them.
          </li>
          <li>
            <strong className="text-zinc-200">Logging</strong> — tokens per call, per user, per
            feature. You cannot manage cost you cannot see.
          </li>
          <li>
            <strong className="text-zinc-200">Budget caps</strong> — kill switch when spend crosses
            a threshold.
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Cost literacy: tokens to money</h2>
        <p>
          Pricing is per million tokens, split into input (what you send) and output (what the model
          writes). Output costs several times more than input. The formula every demo in this course
          uses:
        </p>

        <pre className="rounded border border-zinc-800 bg-zinc-950 px-4 py-3 text-[12px] leading-relaxed text-zinc-400 overflow-x-auto">
{`cost = (prompt_tokens / 1e6) * input_price
     + (completion_tokens / 1e6) * output_price`}
        </pre>

        <p>
          The trap: <strong className="text-zinc-200">everything you send is re-billed every call</strong>.
          System prompt, tool definitions, RAG chunks, <LessonRef id="bb3">chat history</LessonRef> — resent and re-charged on
          each request. A "200 token reply" with 2,000 tokens of context costs 10x more than it looks.
        </p>

        <Callout title="QuickBite at scale">
          10,000 support chats a day, 1,800 tokens in and 200 out per call on gpt-4o-mini:
          roughly $1.50 a month per thousand calls — cheap. Switch the model to a premium tier and
          the same traffic costs 15-20x more. Model choice is a budget decision, not just a quality
          one. Try both in the calculator below.
        </Callout>

      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          No API key needed for this one. Flip between the two wiring patterns to see who can see
          the key, then use the calculator: pick a scenario, switch models, and watch the monthly
          bill move.
        </p>
        <ProxyCostDemo />

        <UnderTheHood
          title="The proxy in ~15 lines (Node / Hono / Express shape)"
          description="The whole production pattern is a small server route. Key in env, your auth, your limits, your logs. The client just calls /api/chat with a session cookie."
          language="tsx"
          code={`// server.ts — the key never leaves this process
import OpenAI from 'openai'
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.post('/api/chat', async (req, res) => {
  const user = await requireLogin(req)            // your normal app auth
  await rateLimit(user.id, { perDay: 20 })        // per-user budget
  const out = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: req.body.messages,                  // validate these!
  })
  logUsage(user.id, out.usage)                    // cost tracking
  res.json({ reply: out.choices[0].message.content })
})

// client.ts — no key anywhere
const r = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) })`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'Why is shipping your OpenAI key in the React app fine for this course but not for production?',
            options: [
              'Production requires TypeScript strict mode',
              'The key only works on localhost',
              'Anyone can open devtools, copy the key from network requests, and spend your money. Learning demos accept the risk; real apps cannot',
              'Browsers block OpenAI requests in production builds',
            ],
            answer: 2,
            explanation:
              'Code on the user\'s machine has no secrets. Devtools shows every request header. The only fix is keeping the key on infrastructure you control.',
          },
          {
            prompt: 'Besides hiding the key, what does your backend proxy add?',
            options: [
              'Nothing — it exists only for key secrecy',
              'Your own auth, per-user rate limits, usage logging, and budget caps — none of which can be enforced from client-side code',
              'It makes the model produce better answers',
              'It removes the need for system prompts',
            ],
            answer: 1,
            explanation:
              'Client-side limits are suggestions; anyone can edit them. Server-side limits are enforced. The proxy is where cost control and abuse prevention actually live.',
          },
          {
            prompt: 'Your support bot\'s bill doubled after launch, but traffic stayed flat. Most likely cause?',
            options: [
              'OpenAI quietly changed pricing',
              'You added full chat history — every call now resends and re-bills the whole transcript',
              'Users started typing longer messages',
              'Streaming responses cost double',
            ],
            answer: 1,
            explanation: (
              <>History, system prompts, and RAG context are re-sent on every call and billed every time. This is why <LessonRef id="bb3" /> is also a cost lesson.</>
            ),
          },
          {
            prompt: 'What is the cheapest safe setup for a 5-user beta?',
            options: [
              'Ship the key in the client but ask users nicely not to look',
              'A tiny serverless endpoint with the key in env plus a per-user daily cap. Even at 5 users, client-side keys are never acceptable',
              'Rotate a new key into the JS bundle every hour',
              'Base64-encode the key so nobody can read it',
            ],
            answer: 1,
            explanation:
              'A serverless function is nearly free at this scale and takes an afternoon. Encoding and rotation are not security — the key still ships to the browser.',
          },
        ]}
        onComplete={() => setStatus('bb4', 'complete')}
        nextPath="/concept/bb5"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
