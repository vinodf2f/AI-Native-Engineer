import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { RagDemo } from '../../../components/RagDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { CONCEPTS } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/b4')({
  component: B4Page,
})

const idx = CONCEPTS.findIndex((c) => c.id === 'b4')
const prev = idx > 0 ? CONCEPTS[idx - 1] : null
const next = idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : null

function B4Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Basics</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">RAG Pipeline</h1>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          <strong>RAG</strong> = Retrieval-Augmented Generation. Plain English: <em>before answering a question, fetch the most relevant documents, give them to the LLM as context, and ask it to answer based on them.</em> That's it. The LLM doesn't memorise your IRCTC policy   you hand it the policy pages on every query.
        </p>

        <Callout title="Why RAG even exists">
          LLMs are trained on the public internet, not your private documents. They don't know your company's policy, your codebase, your contracts. Fine-tuning teaches the model new patterns but is expensive and forgets quickly. RAG is the cheaper alternative: keep docs external, fetch the right ones per query, paste them into the prompt. The model can then quote them.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">The 4 steps of every RAG pipeline</h2>
        <ol className="space-y-3 mt-2 list-decimal ml-5">
          <li><strong className="text-zinc-200">Chunk:</strong> split documents into small pieces (e.g. ~500 chars each). Why not whole docs? Embeddings of huge text dilute meaning; long text also blows the context window later.</li>
          <li><strong className="text-zinc-200">Embed + store:</strong> turn each chunk into a vector, store it (B3).</li>
          <li><strong className="text-zinc-200">Retrieve:</strong> embed the user's question, find top-K closest chunks (B2 + B3).</li>
          <li><strong className="text-zinc-200">Generate:</strong> paste retrieved chunks + question into a chat prompt; the LLM answers grounded in them (B1).</li>
        </ol>
        <p className="text-[13px] text-zinc-500">Steps 2-3 you've already built. Step 4 is B1 + a smarter prompt. Step 1   chunking   is what this lesson focuses on, because it's the step beginners skip and seniors obsess over.</p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Chunking: why size and overlap matter</h2>
        <p>
          The chunk size you choose changes everything. Too small (50 chars) and you'll split an idea across two chunks   the embedding captures a fragment, not the meaning. Too large (2000 chars) and one chunk mixes multiple topics   retrieval returns a chunk whose main idea isn't relevant. The sweet spot is usually <strong>300-800 chars</strong> with <strong>50-100 chars of overlap</strong> so ideas that span a boundary don't fall through the crack.
        </p>

        <Callout title="Relatable analogy: cutting a textbook">
          You're photocopying pages for an exam. Cut too small (one sentence per sheet) and you'll miss the connecting idea. Cut too large (whole chapter) and you'll waste your bag space hauling irrelevant content. <strong>Overlap</strong> = running the last sentence of the previous sheet onto the next   so an idea that crosses a page break isn't lost.
        </Callout>

        <h3 className="text-[15px] font-semibold text-zinc-200 mt-6">Three common strategies</h3>
        <ul className="space-y-2 mt-2">
          <li><strong className="text-zinc-200">Fixed-size:</strong> every N characters. Simple, predictable, but splits mid-sentence.</li>
          <li><strong className="text-zinc-200">Recursive (paragraph-aware):</strong> try to split on paragraphs, fall back to sentences, then chars. Preserves structure. <em>Production default in LangChain.</em></li>
          <li><strong className="text-zinc-200">Sentence-based:</strong> group N sentences per chunk. Good for short, dense content.</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Grounding &amp; citations: keeping the LLM honest</h2>
        <p>
          Without constraints, an LLM will happily make up an answer when retrieved docs don't actually contain it. The standard fix is a <strong>system prompt</strong> that tells the model: "Use only the provided context. If the answer isn't there, say so." You also instruct it to cite chunks as <code className="font-mono text-zinc-400">[1]</code>, <code className="font-mono text-zinc-400">[2]</code> etc., so you can map the answer back to its source.
        </p>
        <p className="text-[13px] text-zinc-500">This is the bare minimum. Senior-level RAG adds <em>reranking</em> (a second model re-orders top-K), <em>hybrid search</em> (BM25 + vector), and <em>eval sets</em> (B7) to catch regressions. We'll cover those in Phase C.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          Adjust chunk size and overlap   watch the preview chunks split differently. Click <strong>Embed chunks → store</strong>, then ask "How do I cancel my train ticket?"   the model answers with citations [1], [2]. Try "What if I miss my train?" and "How do I book a retiring room?"   note how each surfaces different chunks. Then ask something the doc doesn't cover ("How do I cook biryani?") and watch the model correctly refuse.
        </p>
        <RagDemo />

        <UnderTheHood
          title="How this works: services/rag.ts"
          description="The RagPipeline composes the building blocks from B1-B3: chunk → embed (B2) → store (B3) → retrieve (B3) → chat-completion (B1). One fresh pipeline keeps state for one document set."
          language="tsx"
          code={`export class RagPipeline {
  store = new VectorStore()

  async ingest(docs, strategy = 'recursive') {
    for (const doc of docs) {
      const chunks = chunkText(doc.text, strategy)
      for (const c of chunks) {
        await this.store.add(c, { source: doc.source })
      }
    }
  }

  async answer(query: string, topK = 3): Promise<RagAnswer> {
    const citations = await this.store.search(query, topK)
    const context = citations.map((c, i) => \`[\${i+1}] \${c.text}\`).join('\\n\\n')
    const messages = [
      { role: 'system', content: 'Answer using only the context below. Cite as [1], [2]. Say if unsure.' },
      { role: 'user', content: \`Context:\\n\${context}\\n\\nQuestion: \${query}\` },
    ]
    const completion = await createChatCompletion(messages)
    return { answer: completion.content, citations, totalCost: completion.cost }
  }
}`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'You embed a 50-page IRCTC policy as a single 30,000-char chunk. The user asks "How do I file a TDR?" What goes wrong?',
            options: [
              'The embedding is too large to store in pgvector',
              'The single huge chunk mixes many topics, so the embedding dilutes the TDR idea   retrieval may not rank it high for related queries',
              'OpenAI rejects chunks over 1000 chars',
              'Nothing   larger chunks always give better answers',
            ],
            answer: 1,
            explanation: 'One chunk per doc is the most common beginner mistake. A chunk for "TDR filing" buried inside a 50-page policy has its embedding averaged with cancellation, tatkal, retiring rooms, Vande Bharat meals   every neighbouring topic dilutes it. Splitting into focused chunks lets the TDR chunk rank for TDR queries.',
          },
          {
            prompt: 'What is the role of the overlap when chunking?',
            options: [
              'It makes embeddings faster to compute',
              'It lets the LLM see each chunk twice',
              'It prevents an idea that crosses a chunk boundary from being lost entirely from the retrieval set',
              'It reduces the total number of chunks (saves storage)',
            ],
            answer: 2,
            explanation: 'Without overlap, a sentence that straddles chunk #1 and #2 is split mid-thought   neither chunk captures the full idea. Overlap runs the last N chars of chunk #1 onto the start of #2, so the bridging idea exists in both. Production RAG uses 50-100 chars overlap with ~500-char chunks.',
          },
          {
            prompt: 'What does the system prompt "Answer using only the context below. Say if unsure." actually do?',
            options: [
              'Guarantees the model will never hallucinate',
              'Trains the model on your documents at runtime',
              'Strongly biases the model to ground answers in retrieved chunks and to refuse when context is missing   a soft guardrail, not a guarantee',
              'Triggers GPT-4o instead of GPT-4o-mini automatically',
            ],
            answer: 2,
            explanation: 'No prompt can guarantee zero hallucination. But an explicit grounding instruction massively reduces the rate. Real production systems add a second LLM (a "critic") to check whether the answer is supported by the citations. We cover this in B7 evaluation.',
          },
          {
            prompt: 'A user asks "How do I cook biryani?" to the IRCTC RAG demo. What should happen?',
            options: [
              'The model invents a biryani recipe from its training data',
              'Retrieval returns train-related chunks (low scores); the grounded model says it doesn\'t have enough information to answer',
              'The pipeline throws an exception',
              'The model searches Google automatically',
            ],
            answer: 1,
            explanation: 'Retrieval still runs   it returns train chunks even though they\'re semantically distant from biryani. But the model sees those chunks don\'t address the question and, with the grounding prompt, refuses. This is the "I don\'t have enough information" moment   exactly what you want to see, not a hallucinated recipe.',
          },
        ]}
        onComplete={() => setStatus('b4', 'complete')}
        nextPath="/concept/b5"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}