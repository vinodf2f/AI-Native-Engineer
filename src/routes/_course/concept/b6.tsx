import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { StreamingDemo } from '../../../components/StreamingDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { CONCEPTS } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/b6')({
  component: B6Page,
})

const idx = CONCEPTS.findIndex((c) => c.id === 'b6')
const prev = idx > 0 ? CONCEPTS[idx - 1] : null
const next = idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : null

function B6Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Basics</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Streaming + UI</h1>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          A normal LLM call takes ~2-10 seconds to complete before you can show anything. That feels broken   every ChatGPT-style UI you've used shows tokens <em>as they arrive</em>, not after. That visual effect isn't decoration; it's how you make an 8-second response feel like 1 second.
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">What streaming actually is</h2>
        <p>
          With a normal HTTP request, the server holds the entire response and sends it once at the end. With <strong>streaming</strong>, the server sends chunks as soon as they're ready, over a persistent connection. The browser processes each chunk as it arrives.
        </p>
        <p>
          OpenAI's API supports a <code className="font-mono text-zinc-400">stream: true</code> flag that switches on this mode. Instead of one big JSON response, OpenAI sends a series of small ones   each carrying one piece of the answer. The browser processes each chunk as it arrives.
        </p>

        <Callout title="Relatable analogy: a cricket score on a live ticker">
          A non-streaming API is like waiting for the entire match to end before someone tells you who won. A streaming API is the live ticker on Cricbuzz   every ball, every run, every wicket arrives as it happens. The match isn't faster; your perception of progress is.
        </Callout>

        <p className="text-[13px] text-zinc-500">
          Under the hood, OpenAI uses <strong>SSE</strong> (Server-Sent Events): each token arrives as a line of text like <code className="font-mono text-zinc-400">data: &#123;"choices"&#58; [&#123;"delta"&#58; &#123;"content"&#58; " टोकन "&#125;&#125;]&#125;</code>. The stream ends with <code className="font-mono text-zinc-400">data: [DONE]</code>.
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Two things you must get right in the UI</h2>

        <h3 className="text-[15px] font-semibold text-zinc-200 mt-4">1. Cancelability (the AbortController pattern)</h3>
        <p>
          A long stream wastes money if the user changes their mind. The standard pattern: create an <code className="font-mono text-zinc-400">AbortController</code>, pass its <code className="font-mono text-zinc-400">signal</code> to <code className="font-mono text-zinc-400">fetch</code>, and call <code className="font-mono text-zinc-400">ac.abort()</code> in the cancel button. The fetch resolves immediately; no more tokens are billed.
        </p>

        <h3 className="text-[15px] font-semibold text-zinc-200 mt-4">2. Progressive rendering</h3>
        <p>
          Append each token to a React state as it arrives. Framer Motion can fade-in the block once; React's re-render loop handles the rest. <strong>Don't animate per token</strong>   at 30 tokens/second that causes jank. The text simply grows.
        </p>

        <Callout title="Production tip: citations snap in after streaming">
          In a real RAG UI, retrieval happens <em>before</em> generation. So typically: (1) fetch docs (~200ms), (2) render citations list, (3) start streaming LLM answer grounded in those docs. The user sees citations appear immediately   even if the answer is still being generated   which keeps perceived latency low.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Measuring perceived latency</h2>
        <p>
          The metric that matters is <strong>time-to-first-token (TTFT)</strong>   how many ms between pressing "Send" and seeing the first text appear. Streaming usually cuts perceived latency by 70%+ vs waiting for a full response, even if total time is identical. Track this in your observability (Phase C).
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          Click <strong>Stream answer</strong>   tokens appear one-by-one. Click <strong>Cancel stream</strong> mid-answer to abort (you'll see the response stop, and the rest is unbilled). Try it twice: once with a small prompt (fast TTFT), once with a long answer request (you can really see the stream). Note the tokens/sec stat.
        </p>
        <StreamingDemo />

        <UnderTheHood
          title="How this works: services/streaming.ts"
          description="The service wires together fetch + ReadableStream + AbortController. Each SSE line is parsed as a small JSON; the delta content is appended via the onToken callback. The caller (component) just feeds callbacks into React state."
          language="tsx"
          code={`export async function streamChatCompletion(messages, model, signal, cb) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${apiKey}\` },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  })
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      if (line.slice(5).trim() === '[DONE]') return cb.onDone()
      const json = JSON.parse(line.slice(5))
      const token = json.choices[0].delta.content
      if (token) cb.onToken(token)
    }
  }
}`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'Total time to generate a full response is the same with streaming vs. non-streaming. Why does streaming still feel dramatically faster to the user?',
            options: [
              'Streaming uses a faster model automatically',
              'Time-to-first-token drops dramatically   the user sees the first word after ~150ms instead of waiting 8s for the full answer',
              'Streaming skips the embedding step',
              'Streaming batches multiple user queries together',
            ],
            answer: 1,
            explanation: 'TTFT (time-to-first-token) is the perceived-latency metric. Total wall-clock time is unchanged, but humans treat "I see words already" as fast even when completion takes the same 8 seconds. This is why every commercial LLM UI streams.',
          },
          {
            prompt: 'Why do we pass an AbortController signal into fetch() in the streaming service?',
            options: [
              'To prevent the LLM from generating too many tokens',
              'To let the user cancel the stream   calling ac.abort() immediately resolves the fetch and stops OpenAI from billing for further tokens',
              'To set the request timeout to 5 seconds',
              'To compress the response payload',
            ],
            answer: 1,
            explanation: 'AbortController is the browser\'s standard way to cancel any async operation. Pass signal to fetch → the request and its reader die instantly on abort(). You also save the unbilled portion of the answer   measurable cost saving at scale.',
          },
          {
            prompt: 'Each line arriving in the stream looks like `data: {"choices":[{"delta":{"content":"token"}}]}`. What is this format called?',
            options: [
              'WebSockets',
              'Server-Sent Events (SSE)',
              'gRPC streaming',
              'GraphQL subscriptions',
            ],
            answer: 1,
            explanation: 'SSE is the standard text/event-stream protocol. Each event is a `data:` line ending with a newline. OpenAI chose SSE because it works over plain HTTP (no upgrade handshake, works through proxies) and browsers support it natively via EventSource or fetch + ReadableStream.',
          },
          {
            prompt: 'In a production RAG UI, why do citations appear before the streamed answer starts?',
            options: [
              'Citations are cached forever; answers are not',
              'Retrieval runs first and is fast (~200ms), so the UI shows matched chunks immediately   making the user feel something is happening while the LLM generates the grounded answer',
              'The LLM refuses to start streaming until citations are rendered',
              'Citations are static and hardcoded',
            ],
            answer: 1,
            explanation: 'This "snap-in" pattern is the senior-engineer move. Total latency is the same; perceived latency drops because the user sees proof of retrieval within 200ms instead of staring at a blank screen for 8 seconds while the LLM composes its answer.',
          },
        ]}
        onComplete={() => setStatus('b6', 'complete')}
        nextPath="/concept/b7"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}