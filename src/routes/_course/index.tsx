import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { RagFlowDiagram } from '@/components/RagFlowDiagram'
import { CONCEPTS } from '@/lib/concepts'
import { loadSettings } from '@/lib/storage'

export const Route = createFileRoute('/_course/')({
  component: HomePage,
})

const AUDIENCES = [
  {
    title: 'You ship products, not papers',
    body: 'You build React/Node/Postgres apps. You want to add AI features without going back to school for an ML degree.',
  },
  {
    title: 'You know the buzzwords, not the trade-offs',
    body: 'RAG, embeddings, agents, fine-tuning. You nod in meetings. You want to push back with real architecture reasoning.',
  },
  {
    title: 'Your skills should compound',
    body: 'TypeScript, Postgres, React — these don\'t get replaced by AI. They get priced in. We show you exactly where they plug in.',
  },
]

const FAMILY_TREE = [
  {
    name: 'Classical ML',
    desc: 'Regression, classification (spam, fraud). Data scientists do this. Skip.',
    lane: false,
    items: ['Regression', 'Classification (spam, fraud)'],
  },
  {
    name: 'GenAI',
    desc: 'Models that generate new content — text, images, audio, code. Your lane.',
    lane: true,
    items: ['Text (LLMs, RAG, streaming)', 'Image (DALL-E)', 'Audio (Whisper, TTS)', 'Code (Copilot)'],
  },
  {
    name: 'Agents',
    desc: 'Built on GenAI. Autonomous loops that call tools, plan, retry. Your next step.',
    lane: true,
    items: ['Tool calling', 'Plan → call → observe loops'],
  },
]

const PHASES = [
  { title: 'Ingest', plain: 'Read documents & split them into chunks.', detail: 'Why chunks: the LLM context window is finite, and smaller chunks give more focused embeddings.', concept: 'b4', label: 'RAG Pipeline' },
  { title: 'Embed', plain: 'Turn each chunk into a list of numbers (a vector).', detail: 'Same idea → vectors close in 1536-dim space. Different idea → far apart.', concept: 'b2', label: 'Embeddings' },
  { title: 'Store', plain: 'Save text + vector together in a vector database.', detail: 'pgvector, Qdrant, Pinecone. Retrieve by nearest neighbour, not exact match.', concept: 'b3', label: 'Vector Databases' },
  { title: 'Retrieve', plain: 'User query → embed → cosine rank → top-k chunks.', detail: 'This is the "R" in RAG. Done right, you get the most relevant context.', concept: 'b4', label: 'RAG Pipeline' },
  { title: 'Generate', plain: 'Stuff top-k chunks + user question into a chat prompt.', detail: 'LLM answers grounded in retrieved docs. This is the "G" in RAG.', concept: 'b6', label: 'Streaming + UI' },
  { title: 'Agentify', plain: 'Wrap retrieval as a tool the LLM calls autonomously.', detail: 'Plan → call tool → observe → repeat. Multi-step research, automatically.', concept: null, label: 'Phase C · Agents (later)' },
]

const WHAT_YOU_BUILD = [
  { item: 'Live completion call', proves: 'Token & cost literacy', concept: 'b1' },
  { item: 'Embedding comparison', proves: 'Cosine similarity from scratch', concept: 'b2' },
  { item: 'Vector store + search', proves: 'pgvector + ANN concepts', concept: 'b3' },
  { item: 'RAG with citations', proves: 'Grounded answers, hallucination control', concept: 'b4' },
  { item: 'Prompt lab', proves: 'System prompts, few-shot, JSON output', concept: 'b5' },
  { item: 'Streaming UI', proves: 'SSE, AbortController, perceived latency', concept: 'b6' },
  { item: 'Eval suite', proves: 'Regression testing for prompts', concept: 'b7' },
]

function HomePage() {
  const hasKey = Boolean(loadSettings().apiKey)

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-10">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 leading-tight tracking-tight">
          AI, explained for engineers
        </h1>
        <p className="mt-3 text-[15px] text-zinc-400 max-w-2xl leading-relaxed">
          Modern AI, in plain TypeScript. Buzzwords, patterns, real API calls. No Python, no PhD.
          Built for engineers who want to ship AI features into products they already build.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/concept/b1"
            className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[13px] font-medium text-white transition-colors"
          >
            Start with Basics →
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

      {/* Who this is for */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Who this is for</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AUDIENCES.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <h3 className="text-[13px] font-semibold text-zinc-200">{a.title}</h3>
              <p className="text-[12px] text-zinc-400 mt-1.5 leading-relaxed">{a.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI family tree */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">The AI family tree</h2>
        <p className="text-[12px] text-zinc-500 mb-5">Where you sit. Three branches — two are your lane.</p>

        <div className="space-y-3">
          {FAMILY_TREE.map((branch) => (
            <div
              key={branch.name}
              className={`rounded-lg border px-4 py-3 ${
                branch.lane
                  ? 'border-emerald-600/40 bg-emerald-600/5'
                  : 'border-zinc-800 bg-zinc-900/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-[14px] font-semibold ${branch.lane ? 'text-emerald-300' : 'text-zinc-300'}`}>
                  {branch.name}
                </h3>
                {branch.lane && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-300">
                    your lane
                  </span>
                )}
              </div>
              <p className="text-[12px] text-zinc-500 mb-2">{branch.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {branch.items.map((item) => (
                  <span
                    key={item}
                    className={`text-[11px] px-2 py-0.5 rounded border ${
                      branch.lane
                        ? 'border-emerald-600/30 text-emerald-300/80'
                        : 'border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* What you'll build */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">What you'll build (and what it proves)</h2>
        <p className="text-[12px] text-zinc-500 mb-5">Each Basics lesson ends with a working demo you can show a hiring manager.</p>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          {WHAT_YOU_BUILD.map((w, i) => (
            <Link
              key={w.concept}
              to={`/concept/${w.concept}` as any}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-800/50 transition-colors ${
                i < WHAT_YOU_BUILD.length - 1 ? 'border-b border-zinc-800' : ''
              }`}
            >
              <span className="text-[13px] text-zinc-200">{w.item}</span>
              <span className="text-[11px] text-zinc-500 text-right">{w.proves}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Concept map */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">The pipeline, in 6 phases</h2>
        <p className="text-[12px] text-zinc-500 mb-5">Every AI feature you'll ever build maps to stages 1-5. Stage 6 is the jump to agents.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PHASES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xl font-light text-zinc-700 mt-0.5">{i + 1}</span>
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-zinc-200">{p.title}</h3>
                  <p className="text-[13px] text-zinc-400 mt-0.5">{p.plain}</p>
                  <p className="text-[11px] text-zinc-600 mt-1.5">{p.detail}</p>
                  {p.concept ? (
                    <Link to={`/concept/${p.concept}` as any} className="inline-block mt-2 text-[11px] text-emerald-400 hover:text-emerald-300">
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

      {/* Watch it move */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">Watch it move</h2>
        <p className="text-[12px] text-zinc-500 mb-4">Auto-playing the full retrieval flow with 3 example queries. Use ⏸/▶ and speed control to follow along.</p>
        <RagFlowDiagram />
      </motion.div>

      {/* Flat course index */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="border-t border-zinc-800 pt-8"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">All Basics lessons</h2>
        <div className="space-y-2">
          {CONCEPTS.map((c: typeof CONCEPTS[number], i: number) => (
            <Link
              key={c.id}
              to={`/concept/${c.id}` as any}
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