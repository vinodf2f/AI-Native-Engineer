import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Callout } from '../../../components/Callout'
import { EmbeddingDemo } from '../../../components/EmbeddingDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { CONCEPTS } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/b2')({
  component: B2Page,
})

const idx = CONCEPTS.findIndex((c) => c.id === 'b2')
const prev = idx > 0 ? CONCEPTS[idx - 1] : null
const next = idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : null

function B2Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Basics</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Embeddings</h1>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          An embedding is a list of numbers representing the <em>meaning</em> of text. That's it. "The cat sat on the mat" becomes <code className="font-mono text-zinc-400">[0.012, -0.43, 0.88, ...]</code> — 1536 numbers for <code className="font-mono text-zinc-400">text-embedding-3-small</code>.
        </p>
        <p className="text-[13px] text-zinc-500">In Indian context: a user typing <span className="font-mono text-zinc-400">"train refund kaise milega"</span> and another typing <span className="font-mono text-zinc-400">"how to get money back for cancelled train"</span> should have <em>close</em> embeddings — same idea, different words. That's what makes embeddings useful for Indian users who mix Hindi-English.</p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Meaning as coordinates</h2>
        <p>
          Think of each number in the vector as a coordinate in a high-dimensional space. Texts with <strong>similar meaning</strong> land close together; texts with different meaning land far apart. This works because the embedding model was trained on billions of sentences and learned a geometry of meaning.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-3 gap-3 my-6"
        >
          {[
            { a: 'I want to eat pani puri', b: 'Craving golgappa tonight', close: true },
            { a: 'I want to eat pani puri', b: 'The stock market crashed today', close: false },
            { a: 'I want to eat pani puri', b: 'Also craving vada pav', close: 'mid' },
          ].map((ex) => (
            <div key={ex.a + ex.b} className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-3">
              <div className="text-[11px] text-zinc-400 mb-1">"{ex.a}"</div>
              <div className="text-[11px] text-zinc-400 mb-2">"{ex.b}"</div>
              <div className={`h-1 rounded-full ${ex.close === true ? 'bg-emerald-500' : ex.close === 'mid' ? 'bg-amber-500' : 'bg-red-500'}`} />
            </div>
          ))}
        </motion.div>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Why this is the foundation of RAG</h2>
        <p>
          If every chunk of your documents has an embedding, and the user's question also gets an embedding, then <strong>finding the relevant chunks = finding nearest neighbors in vector space</strong>. That's retrieval. Everything in B3-B4 builds on this single idea.
        </p>

        <Callout title="Relatable analogy: IRCTC search">
          On IRCTC you type "CSMT" and the system knows you mean Mumbai CST — that's exact match. Embeddings do the same idea but for <em>meaning</em>: a user asking <span className="font-mono text-zinc-400">"how to get refund for cancelled train"</span> finds the same FAQ as <span className="font-mono text-zinc-400">"train cancel hone par refund kaise milega"</span> — no words overlap, embeddings still land close.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Cosine similarity: how "close" is measured</h2>
        <p>
          We don't measure distance in embedding space with a ruler. We measure the <strong>angle</strong> between two vectors. If they point in the same direction (cosine = 1), meanings are identical. If perpendicular (0), unrelated. If opposite (-1), antonymous — in theory.
        </p>
        <p className="text-[13px] text-zinc-500">
          Math, for the curious: cosine(θ) = (A·B) / (|A|·|B|) — dot product over magnitudes. You'll implement this yourself in the service file. It's ~5 lines of code.
        </p>

        <Callout title="Will I ever see a score of -1?">
          <strong>No, practically never.</strong> Modern embedding models (OpenAI, Cohere, BGE) place all texts in the positive cosine region. Real scores range from ~0.10 (totally unrelated) to ~0.95 (same idea rephrased). Negative cosine is textbook math that essentially never happens with production embeddings.
          <br /><br />
          The closest you'll get to "opposite" is around <strong>0.10-0.20</strong>: e.g. <span className="font-mono text-zinc-400">"I love this product"</span> vs <span className="font-mono text-zinc-400">"Worst purchase of my life"</span> still scores ~0.55+ because both live in the "product review" cluster. That's why production RAG tunes thresholds on the realistic 0.2–0.9 range and uses percentile rank within your corpus — not raw cosine values.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Dimensionality: bigger isn't always better</h2>
        <p>
          OpenAI's <code className="font-mono text-zinc-400">text-embedding-3-small</code> has 1536 dimensions. <code className="font-mono text-zinc-400">-large</code> has 3072. More dimensions capture more nuance, but cost more storage and more compute at search time. We'll use <code className="font-mono text-zinc-400">-small</code> for this course — it's the production default for most RAG apps.
        </p>
      </section>

      <Callout title="Common confusion: 'good' vs 'bad' scores high — why?">
        Type <span className="font-mono text-zinc-400">"good"</span> in Text A and <span className="font-mono text-zinc-400">"bad"</span> in Text B in the demo below. You'll see a score around 0.55-0.70 — not negative. Antonyms aren't opposites in vector space; they're <em>grammatically interchangeable</em>, so they live in the same neighbourhood ("evaluative adjective describing something"). Embeddings capture co-occurrence, not polarity.
        <br /><br />
        Try these in the demo to see cosine correctly separate <em>completely unrelated</em> topics (scores near 0.1-0.2):
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>"good" vs "bad" → ~0.60 (same grammar role, same cluster — antonyms don't oppose)</li>
          <li>"good" vs "What time does the Mumbai local leave for Pune?" → ~0.15 (totally different topics)</li>
          <li>"Restaurant menu prices" vs "Cricket score from yesterday's match" → ~0.18 (no shared context)</li>
          <li>"React hooks tutorial" vs "How to file GST return online" → ~0.12 (different domains)</li>
        </ul>
        <strong>Takeaway:</strong> embeddings capture meaning, but they miss negation and sentiment polarity. For sentiment-sensitive features, layer a classifier or an LLM reasoning step on top — don't rely on cosine alone.
      </Callout>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          Defaults show the same question asked two different ways. Watch the score. Then try: (A) "I want to eat pani puri" vs (B) "Craving golgappa tonight" — same food, no shared words. Then try (A) "How is the stock market doing" vs (B) "Share market kaisa hai" — Hinglish vs English.
        </p>
        <EmbeddingDemo />

        <UnderTheHood
          title="How this works: services/embeddings.ts (embed call + cosine from scratch)"
          description="The demo embeds both texts via OpenAI's /v1/embeddings endpoint, then computes cosine similarity locally — no second API call. The cosine function is 5 lines of math."
          language="tsx"
          code={`export async function createEmbedding(input: string, model = 'text-embedding-3-small') {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${apiKey}\`,
    },
    body: JSON.stringify({ model, input }),
  })
  const data = await res.json()
  return {
    vector: data.data[0].embedding as number[],
    tokens: data.usage.total_tokens,
    cost: (data.usage.total_tokens / 1e6) * 0.02,
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'Two sentences share no words in common but describe the same idea (e.g. "how to get refund for cancelled train" vs "train cancel hone par refund kaise milega"). What will their cosine similarity look like?',
            options: [
              'Close to -1 (opposite meaning)',
              'Close to 0.1 (unrelated, since no words match)',
              'Above 0.5 (similar meaning despite different words)',
              'Exactly 1 (identical vectors)',
            ],
            answer: 2,
            explanation: 'Embeddings capture meaning, not surface words. Same idea in two scripts/wordings = embeddings land close. This is the superpower that makes semantic search work for Hinglish + English users.',
          },
          {
            prompt: 'You test "good" vs "bad" in the live demo and see a score of 0.62. What does this tell you about embeddings?',
            options: [
              'The embedding model is broken — antonyms should score negative',
              'Cosine similarity is the wrong metric for vectors',
              'Embeddings capture grammatical context/co-occurrence, not sentiment polarity — "good" and "bad" appear in similar sentence slots',
              'OpenAI is intentionally biasing scores to be positive',
            ],
            answer: 2,
            explanation: 'See the "Common confusion" callout: antonyms like good/bad substitute for each other in sentences ("the food was good/bad"), so their embeddings sit in the same neighbourhood. For sentiment, layer a classifier or an LLM reasoning step on top of embeddings.',
          },
        ]}
        onComplete={() => setStatus('b2', 'complete')}
        nextPath="/concept/b3"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}