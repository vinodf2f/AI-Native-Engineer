import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Callout } from '../../../components/Callout'
import { VectorStoreDemo } from '../../../components/VectorStoreDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { CodeBlock } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/b3')({
  component: B3Page,
})

const { prev, next } = getNeighbors('b3')

function B3Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">{sectionLabel('foundations')}</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Vector stores</h1>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          A vector database is a specialized store that keeps vectors alongside metadata and lets you search by <strong>nearest neighbour</strong> instead of exact match. That's it. You store chunks of text + their embeddings; later you ask "which chunks are closest to this query embedding?" and it returns ranked results.
        </p>

        <Callout title="Relatable analogy: phone contacts">
          Your phone's contact search is exact match: type "Rahul" → it finds "Rahul Sharma". A vector store is the semantic version: type "the friend who works at the Mumbai startup" → it finds Rahul Sharma's contact because his notes/embedding are closest in meaning, even though no word matched.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Why not just an array + cosine?</h2>
        <p>
          You absolutely can   and that's exactly what the demo below does. For 100 documents, compute cosine between the query and every doc, sort, take top-5. Easy.
        </p>
        <p>
          <strong>The problem</strong>: this is <code className="font-mono text-zinc-400">O(n)</code>   compare against every vector. At 100 docs, instant. At 1 million IRCTC FAQ entries, you're computing 1 million dot products per query. At 100 million (think Zomato reviews), every search takes seconds.
        </p>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">ANN <span className="text-zinc-500 text-sm font-normal">(Approximate Nearest Neighbour)</span></h2>
        <p className="text-[13px] text-zinc-500 mb-3 mt-1">Searching 1 million docs without reading all of them</p>
        <p>
          A simple approach compares the query against every stored chunk   for 8 documents, that's 8 cosine checks, instant. But at 1 million IRCTC FAQ entries, checking every one means a million math operations per question. Too slow.
        </p>
        <p>
          Production vector DBs solve this with <strong>ANN</strong>: instead of comparing against everything, the database builds an index that lets it <em>guess</em> which chunks are worth checking   and skips the rest. You trade a tiny bit of accuracy (you might miss the #3 result occasionally) for a 1000× speedup. Almost always worth it.
        </p>

        <Callout title="Plain English analogy: finding a doctor in Mumbai">
          Imagine you need a heart doctor in Mumbai. <strong>Exact search</strong> (what our demo does): call every hospital in the city, ask "do you have a cardiologist?", collect answers. Slow but thorough. <br /><br />
          <strong>ANN approach</strong>: use a directory already grouped by <em>specialty</em> + <em>locality</em>, jump straight to "Cardiologists → South Mumbai", call only those few. You might miss a cardiologist on the boundary of South Mumbai   that's the "approximate" part. But you found your answer in seconds instead of hours. <br /><br />
          In pgvector, that directory is the <strong>index</strong>   built once (during setup, via <code className="font-mono text-zinc-400">CREATE INDEX</code>), reused on every query afterwards. The query doesn't rebuild the directory; it just consults it.
        </Callout>

        <p>The two most common ANN index types you'll see in tools like pgvector:</p>
        <ul className="space-y-2 mt-2">
          <li>
            <strong className="text-zinc-200">IVFFlat</strong>   the "directory by locality" version. Buckets vectors into <code className="font-mono text-zinc-400">N</code> groups; at query time checks only the relevant buckets (plus a few nearby ones, just in case).
          </li>
          <li>
            <strong className="text-zinc-200">HNSW</strong>   the "ask a friend who knows a friend" version. Builds a graph where similar vectors are connected by edges; search walks from vector to vector, getting closer at each step. This is the <em>production default</em> in pgvector, Qdrant, Weaviate.
          </li>
        </ul>
        <p className="text-[13px] text-zinc-500">You don't need to pick a winner   both are valid. pgvector defaults to HNSW, and most-production setups just use that default. The choice matters only at scale or for specific workloads.</p>

        <Callout title="pgvector: Postgres with vectors built in">
          <code className="font-mono text-zinc-400">pgvector</code> is a Postgres extension that adds a <code className="font-mono text-zinc-400">vector</code> column type. You store embeddings alongside your normal tables, then query with SQL:
          <div className="mt-2 mb-2">
            <CodeBlock
              language="sql"
              code={`SELECT id, content, embedding <=> $1 AS distance
FROM docs
ORDER BY embedding <=> $1
LIMIT 5;`}
            />
          </div>
          The <code className="font-mono text-zinc-400">&lt;=&gt;</code> operator is cosine distance. Add an HNSW index for cosine:
          <div className="mt-2 mb-2">
            <CodeBlock
              language="sql"
              code={`CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);`}
            />
          </div>
          <strong>Why this matters:</strong> no new database to operate. Your existing Postgres skills + one extension = a production vector store.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Metadata filtering</h2>
        <p>
          Real queries come with filters: "search only IRCTC docs from 2024" or "only show me docs in the cancellations category." Vector DBs support <strong>hybrid queries</strong>: filter by metadata first, then rank by vector similarity. Without filtering, you'd get the nearest chunk even if it's from the wrong category.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 my-4 font-mono text-[12px] text-zinc-400 overflow-x-auto"
        >
          <div className="text-zinc-600 mb-1">-- Real production query example:</div>
          {`SELECT content FROM docs `}
          <span className="text-amber-300">WHERE category = 'cancellation'</span>
          {` AND year = 2024 ORDER BY embedding <=> $1 LIMIT 5;`}
        </motion.div>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Which vector DB should I pick?</h2>
        <p>
          You'll see many options online   Pinecone, Qdrant, Weaviate, Milvus. For most teams starting out, ignore them. Use <strong className="text-zinc-200">pgvector</strong>   a Postgres extension. If you already have Postgres, you add one line (<code className="font-mono text-zinc-400">CREATE EXTENSION vector</code>) and you have a vector store alongside your regular tables. One database to operate, one set of skills.
        </p>
        <p className="text-[13px] text-zinc-500">
          You'll reach for the dedicated ones (Qdrant, Pinecone) only when you cross ~10 million vectors or need advanced features. For the IRCTC-scale demos in this course, pgvector is more than enough. The live demo below uses an in-browser shim so you don't need a running database to learn the algorithm.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          Click <strong>Add 8 IRCTC sample docs</strong> to embed and store them. Then search "How do I cancel my train ticket?" and watch the top-5 ranked results. Try a Hinglish query like "refund kaise milega"   note that the right doc still comes out on top despite no word match. Try "How to file GST return"   that should surface the GST doc, not the train docs.
        </p>
        <VectorStoreDemo />

        <UnderTheHood
          title="How this works: services/vectorStore.ts (in-browser, O(n) cosine rank)"
          description="The store below is a plain TypeScript class   8 chunks in memory. This IS the same algorithm a vector DB runs internally. The only difference: at scale, production DBs swap the sort loop for an ANN index (HNSW/IVFFlat) to avoid comparing against every chunk."
          language="tsx"
          code={`export class VectorStore {
  private chunks: StoredChunk[] = []

  async add(text: string, metadata = {}): Promise<StoredChunk> {
    const emb = await createEmbedding(text)
    const chunk = { id, text, metadata, vector: emb.vector }
    this.chunks.push(chunk)
    return chunk
  }

  async search(query: string, topK = 5): Promise<SearchResult[]> {
    const q = await createEmbedding(query)
    const scored = this.chunks.map((c) => ({
      ...c,
      score: cosineSimilarity(q.vector, c.vector),
    }))
    return scored.sort((a, b) => b.score - a.score).slice(0, topK)
  }
}`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'A vector store saves two things for every document chunk. What are they?',
            options: [
              'The chunk text and its embedding (vector)',
              'The chunk text and its file name',
              'The embedding and the query',
              'The chunk text and a B-tree index',
            ],
            answer: 0,
            explanation: 'The text is kept so you can show it back to the user. The embedding (the 1536-dim vector) is kept so you can cosine-rank against a query. Both together = searchable + displayable.',
          },
          {
            prompt: 'What does creating an HNSW index in pgvector actually do?',
            options: [
              'Rebuilds the index on every query to keep results fresh',
              'Changes cosine similarity into a different, faster metric',
              'Builds a search structure once, ahead of time, that queries consult instead of scanning every row',
              'Lets you store more vectors in the same table',
            ],
            answer: 2,
            explanation: 'CREATE INDEX walks all your vectors once and builds the HNSW graph. Every later query walks that pre-built graph to skip most rows   like consulting a directory instead of calling every hospital. The query does not rebuild the index; it just uses it.',
          },
          {
            prompt: 'In the "finding a doctor in Mumbai" analogy, what plays the role of the index?',
            options: [
              'The list of all hospitals (all chunks in the table)',
              'The directory grouped by specialty + locality, built once and consulted per query',
              'The phone you use to call (the SQL client)',
              'The patient\'s symptom description (the query text)',
            ],
            answer: 1,
            explanation: 'The full table of hospitals = all stored chunks. The query = the patient\'s need. The index = the pre-organized directory you consult so you don\'t have to call every hospital.',
          },
          {
            prompt: 'HNSW returns a result that ranks #6 in true cosine similarity, but the #1 true match is missing from the top-5. Why does this happen and why is it usually acceptable?',
            options: [
              'HNSW has a bug   it should always return the true top-5',
              'HNSW walks the graph and may skip some vectors; you trade a small chance of missing the true top-K for a huge speedup   acceptable because embeddings are approximate by nature anyway',
              'You need to retrain the embedding model',
              'The query was too short; HNSW only works with long queries',
            ],
            answer: 1,
            explanation: 'That\'s the "approximate" in ANN. The graph walk skips chunks that look far away without comparing directly   occasionally it misses a true neighbour. You accept ~5% recall loss because (a) the speedup is 1000× and (b) embeddings themselves are fuzzy   the true #6 is usually just as good a context as the true #1 for RAG.',
          },
        ]}
        onComplete={() => setStatus('b3', 'complete')}
        nextPath="/concept/b4"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}