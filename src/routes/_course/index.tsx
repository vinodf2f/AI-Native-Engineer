import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { RagFlowDiagram } from '@/components/RagFlowDiagram'
import { CONCEPTS } from '@/lib/concepts'
import { loadSettings } from '@/lib/storage'

export const Route = createFileRoute('/_course/')({
  component: HomePage,
})

const PHASES = [
  {
    title: 'Ingest',
    plain: 'Read documents & split them into chunks.',
    detail: 'Why chunks: the LLM context window is finite, and smaller chunks give more focused embeddings.',
    concept: 'b4',
    label: 'RAG Pipeline',
  },
  {
    title: 'Embed',
    plain: 'Turn each chunk into a list of numbers (a vector).',
    detail: 'Same idea → vectors close in 1536-dim space. Different idea → far apart.',
    concept: 'b2',
    label: 'Embeddings',
  },
  {
    title: 'Store',
    plain: 'Save text + vector together in a vector database.',
    detail: 'pgvector, Qdrant, Pinecone. Retrieve by nearest neighbour, not exact match.',
    concept: 'b3',
    label: 'Vector Databases',
  },
  {
    title: 'Retrieve',
    plain: 'User query → embed → cosine rank → top-k chunks.',
    detail: 'This is the "R" in RAG. Done right, you get the most relevant context.',
    concept: 'b4',
    label: 'RAG Pipeline',
  },
  {
    title: 'Generate',
    plain: 'Stuff top-k chunks + user question into a chat prompt.',
    detail: 'LLM answers grounded in retrieved docs. This is the "G" in RAG.',
    concept: 'b6',
    label: 'Streaming + UI',
  },
  {
    title: 'Agentify',
    plain: 'Wrap retrieval as a tool the LLM calls autonomously.',
    detail: 'Plan → call tool → observe → repeat. Multi-step research, automatically.',
    concept: null,
    label: 'Phase C · Agents (later)',
  },
]

function HomePage() {
  const hasKey = Boolean(loadSettings().apiKey)

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <p className="text-[11px] uppercase tracking-wider text-emerald-500/80 font-medium">AI Course · Basics</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-100 leading-tight">
          Build production AI features,<br /><span className="text-zinc-500">one concept at a time.</span>
        </h1>
        <p className="mt-4 text-[14px] text-zinc-400 max-w-2xl leading-relaxed">
          Every lesson: <span className="text-zinc-200">learn (animated)</span> → <span className="text-zinc-200">try live</span> with a real OpenAI API call → <span className="text-zinc-200">checkpoint quiz</span>. No mocks. You see real tokens, real cost, real behavior.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/concept/b1"
            className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[13px] font-medium text-white transition-colors"
          >
            Start at B1 →
          </Link>
          {!hasKey && (
            <Link
              to="/settings"
              className="rounded border border-amber-500/40 bg-amber-500/5 px-4 py-2 text-[13px] text-amber-200 hover:bg-amber-500/10"
            >
              Add OpenAI API key first
            </Link>
          )}
        </div>
      </motion.div>

      {/* Concept map */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">The whole pipeline, in 6 phases</h2>
        <p className="text-[12px] text-zinc-500 mb-5">Every AI feature you'll ever build maps to stages 1-5. Stage 6 is the jump to agents.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PHASES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xl font-light text-zinc-700 mt-0.5">{i + 1}</span>
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-zinc-200">{p.title}</h3>
                  <p className="text-[13px] text-zinc-400 mt-0.5">{p.plain}</p>
                  <p className="text-[11px] text-zinc-600 mt-1.5">{p.detail}</p>
                  {p.concept ? (
                    <Link
                      to={`/concept/${p.concept}`}
                      className="inline-block mt-2 text-[11px] text-emerald-400 hover:text-emerald-300"
                    >
                      → {p.label}
                    </Link>
                  ) : (
                    <span className="inline-block mt-2 text-[11px] text-zinc-600">{p.label}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Animated flow diagram */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">Watch it move</h2>
        <p className="text-[12px] text-zinc-500 mb-4">Auto-playing the full retrieval flow with 3 example queries — including a Hinglish one and an unrelated-topic one. See how cosine scores decide which chunks surface.</p>
        <RagFlowDiagram />
      </motion.div>

      {/* Flat course index */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border-t border-zinc-800 pt-8"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">All Basics lessons</h2>
        <div className="space-y-2">
          {CONCEPTS.map((c, i) => (
            <Link
              key={c.id}
              to={`/concept/${c.id}`}
              className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-900 transition-colors"
            >
              <span className="font-mono text-lg font-light text-zinc-700 w-6">{i + 1}</span>
              <span className="text-[13px] font-medium text-zinc-200">{c.title}</span>
              <span className="ml-auto text-[11px] text-zinc-600">→</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  )
}