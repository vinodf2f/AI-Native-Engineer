import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Callout } from '../../../components/Callout'
import { TokenAnimation } from '../../../components/TokenAnimation'
import { CompletionDemo } from '../../../components/CompletionDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/b1')({
  component: B1Page,
})

const { prev, next } = getNeighbors('b1')

function B1Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">{sectionLabel('foundations')}</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">How models work</h1>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          An LLM is a function. You give it text, it returns text. That's the whole mental model to start with   everything else (tokens, costs, roles, context windows) is detail about <em>how</em> that function works.
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Tokens: the unit the model thinks in</h2>
        <p>
          LLMs don't see characters. They see <strong>tokens</strong>   small chunks roughly 4 chars of English, or part of a word. "hamburger" → 3 tokens ["ham","burg","er"]. Code like <code className="font-mono text-zinc-400">useState</code> → 1-3 tokens.
        </p>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-[12px] text-zinc-500 mb-2">Watch how an English sentence breaks into tokens:</p>
          <TokenAnimation text="The quick brown fox jumps over the lazy dog." chunkSize={4} />
        </motion.div>

        <p className="text-[13px] text-zinc-500">Why you'll care: OpenAI bills you per token. Latency scales with tokens. Context windows are measured in tokens. Token literacy = cost literacy.</p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Context window: the model's RAM</h2>
        <p>
          Every model has a fixed <strong>context window</strong>   tokens of input + output it can hold at once. <code className="font-mono text-zinc-400">gpt-4o-mini</code>: 128K tokens. That sounds huge, but it carries your system prompt, retrieved docs, prior turns and the model's reply. Embed your entire IRCTC FAQ + all your code docs and context fills up fast   and anything beyond the boundary silently scrolls off, like older commits in a Git log.
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Three roles, not just "the message"</h2>
        <p>Chat APIs accept a list of messages, each with a role:</p>
        <ul className="space-y-2 mt-2">
          <li><strong className="text-emerald-300">system</strong>   the "rules of engagement." Sets persona, constraints, format. Like <code className="font-mono text-zinc-400">tsconfig.json</code>: shapes everything downstream.</li>
          <li><strong className="text-sky-300">user</strong>   the actual question or input from the human.</li>
          <li><strong className="text-amber-300">assistant</strong>   the model's previous replies (keeps conversation memory).</li>
        </ul>

        <Callout title="Relatable analogy">
          Think of a chat completion as a <strong>props object</strong>: <code className="font-mono">messages: [{`{ role: 'system', content }, { role: 'user', content }`}]</code>. The LLM is a pure render function over those props. No state, no side effects   that's why same input gives same output (at temperature 0).
        </Callout>

        <p className="mt-6">The model also has a <strong>temperature</strong> (0 = deterministic, 1 = more random). Low for factual Q&A, higher for creative brainstorming. We'll keep it at default for now.</p>

        <Callout title="Cost trap Indian teams miss">
          Devanagari script (Hindi/Marathi) tokenizes far less efficiently than English. A single Devanagari word like <span className="font-mono text-zinc-400">नमस्ते</span> burns 5-6 tokens versus 1 for "hello". Same idea, ~5× cost. If a client has multilingual users, estimate token costs on their translated content   not just the English version.
        </Callout>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          Send a real request to OpenAI. Edit the system and user prompt. Watch the token counts and the cost of this single call.
        </p>
        <CompletionDemo />

        <UnderTheHood
          title="How this works: services/openai.ts → useCompletion hook → CompletionDemo component"
          description="The demo above is a 3-layer pattern. The service file (no React) talks to OpenAI. The hook (TanStack Query) handles caching/loading state. The component just renders."
          language="tsx"
          code={`export async function createChatCompletion(messages: ChatMessage[], model?: string) {
  const settings = loadSettings()
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${settings.apiKey}\`,
    },
    body: JSON.stringify({ model, messages }),
  })
  const data = await res.json()
  const price = PRICING[model] ?? PRICING['gpt-4o-mini']
  return {
    content: data.choices[0].message.content,
    promptTokens: data.usage.prompt_tokens,
    completionTokens: data.usage.completion_tokens,
    cost: (data.usage.prompt_tokens / 1e6) * price.in
        + (data.usage.completion_tokens / 1e6) * price.out,
  }
}

export function useCompletion(messages: ChatMessage[], enabled = false) {
  return useQuery({
    queryKey: ['completion', messages],
    queryFn: () => createChatCompletion(messages),
    enabled,
  })
}`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: "A user types 100 words (~130 tokens). With a 128K-token context window, how many similar exchanges can fit in context before the oldest ones scroll off?",
            options: ['Always unlimited   context never scrolls', 'Roughly 128,000 / 130 ≈ 985 exchanges', 'Exactly 1   context resets each call', 'OpenAI adds more context automatically'],
            answer: 1,
            explanation: 'Context is a fixed token budget. Older messages must be dropped (summarized or truncated) when new ones exceed the window. This is what "compaction" in opencode config does too.',
          },
          {
            prompt: 'Why does the system role come first and not the user role?',
            options: [
              'Order doesn\'t matter   only content matters',
              'It sets the rules the model applies when interpreting subsequent user messages',
              'The API rejects requests where user comes before system',
              'It\'s just a convention   there is no functional difference',
            ],
            answer: 1,
            explanation: 'The system message is the highest-priority instruction. Putting it first means the model treats later user inputs through that lens. Like a config file being parsed before app code runs.',
          },
        ]}
        onComplete={() => setStatus('b1', 'complete')}
        nextPath="/concept/b2"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}