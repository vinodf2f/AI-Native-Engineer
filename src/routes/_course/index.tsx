import { createFileRoute, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { RagFlowDiagram } from '@/components/RagFlowDiagram'
import { StickyCta } from '@/components/StickyCta'
import { loadSettings } from '@/lib/storage'

export const Route = createFileRoute('/_course/')({
  component: HomePage,
})

const AI_BRANCHES = [
  {
    name: 'Generative AI',
    desc: 'LLMs that generate text: chat, RAG, summarisation, code.',
    yourJob: 'Your lane',
    color: 'emerald' as const,
    readMore: null,
    link: '/concept/b1',
  },
  {
    name: 'Agentic AI',
    desc: 'LLMs that call tools and plan multi-step tasks. The frontier.',
    yourJob: 'Next step',
    color: 'emerald' as const,
    readMore: null,
    link: null,
  },
  {
    name: 'Fine-tuning',
    desc: 'Retraining a model on your data. Expensive, rarely needed.',
    yourJob: 'Rarely',
    color: 'amber' as const,
    readMore: 'Fine-tuning means taking a pre-trained model and running extra training on your company\'s data so it permanently changes its behavior. It costs thousands of dollars, takes weeks, and the model can forget what it already knew. When non-technical people hear "can we train it on our data?" they imagine fine-tuning. Your job is to steer them to RAG first (much cheaper, no training, data stays in Postgres). Fine-tuning is only worth it after you\'ve hit the ceiling of what RAG + prompt design can do.',
    link: null,
  },
  {
    name: 'GenAI · Multimodal',
    desc: 'Image, audio, video models — DALL-E, Whisper, Sora.',
    yourJob: 'Sometimes',
    color: 'sky' as const,
    readMore: 'If your product captures voice or images, you\'ll call the same kind of API as you do for text — fetch + JSON in/out. Whisper converts speech to text (great for WhatsApp voice notes). DALL-E generates images. Vision models can extract text from a scanned document. The skill you\'ve learned (calling an API, handling the response in TypeScript) transfers directly. The only difference is the endpoint URL and the size of the payload.',
    link: null,
  },
  {
    name: 'Deep Learning',
    desc: 'Neural networks that power everything modern in AI.',
    yourJob: 'Not your job',
    color: 'zinc' as const,
    readMore: 'Deep learning is what powers every modern AI product you use — autocomplete in Gmail, voice search on Google, object detection in Google Photos. The "transformer" you hear about is a specific neural network design from 2017 that made ChatGPT possible. You don\'t train these (they need clusters of expensive GPUs). But knowing that they consume huge amounts of text and compute explains why teams use pre-trained APIs rather than training their own — even at a company with deep pockets.',
    link: null,
  },
  {
    name: 'Classical ML',
    desc: 'Predictions from structured data — spam, fraud, prices.',
    yourJob: 'Not your job',
    color: 'zinc' as const,
    readMore: 'Classical ML models learn patterns from labeled data. If you have a table of past loans and outcomes, a model can predict whether a new applicant will default. You already interact with these when your Node API calls a prediction endpoint — the model returns a score, you return a decision. You don\'t build the model, but knowing the difference between a classification model (spam / not spam) and a regression model (house price = $X) helps you ask the data team the right questions when designing the API.',
    link: null,
  },
  {
    name: 'MLOps',
    desc: 'Serving models at scale — GPUs, servers, optimisation.',
    yourJob: 'Not your job',
    color: 'zinc' as const,
    readMore: 'MLOps is the operational side — keeping a model server running, handling traffic spikes, quantizing models to make them smaller and faster. If your company serves its own LLM (not through OpenAI), someone is doing MLOps. You don\'t need to do it yourself because your path is calling APIs over the network, not hosting a GPU server. But knowing MLOps exists saves you from accidentally volunteering to "own the model deployment" in a meeting. That\'s a different team.',
    link: null,
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
  { item: 'Live completion call', learn: 'You understand tokens & cost', concept: 'b1' },
  { item: 'Embedding comparison', learn: 'You can explain cosine similarity', concept: 'b2' },
  { item: 'Vector store + search', learn: 'You know how pgvector + ANN work', concept: 'b3' },
  { item: 'RAG with citations', learn: 'You can build grounded Q&A', concept: 'b4' },
  { item: 'Prompt lab', learn: 'You can design prompts that work', concept: 'b5' },
  { item: 'Streaming UI', learn: 'You can stream responses like ChatGPT does', concept: 'b6' },
  { item: 'Eval suite', learn: 'You can test prompts for regressions', concept: 'b7' },
]

const REAL_PROJECTS = [
  {
    title: 'AI FAQ Bot',
    subtitle: 'RAG done right',
    desc: 'Upload product docs → ingest → embed → store in pgvector → retrieve → answer with citations. Eval suite catches regressions when prompts change.',
    pattern: 'Retrieval + grounding + eval',
    stack: 'Node.js + pgvector + OpenAI + React',
    interview: 'I built a production RAG bot over real product docs with an eval suite that catches regressions when I change prompts.',
  },
  {
    title: 'Document Parser',
    subtitle: 'Structured extraction',
    desc: 'Extract structured JSON from unstructured invoices, resumes, contracts. Schema-validated output. Falls back to human review on low confidence.',
    pattern: 'Prompt engineering + JSON output + eval',
    stack: 'Node.js + OpenAI + Zod + React',
    interview: 'I extract structured data from unstructured documents — 95% accuracy, falls back to human review on low confidence.',
  },
  {
    title: 'AI Code Reviewer',
    subtitle: 'Multi-step reasoning + tools',
    desc: 'Bot reads PR diffs, runs tests, checks patterns, suggests refactors with citations. The agent frontier — tool calling in practice.',
    pattern: 'Agent tool calling + multi-step',
    stack: 'Node.js + OpenAI + GitHub API + React',
    interview: 'I built a bot that reviews PRs — it runs tests, checks for patterns, suggests refactors with citations.',
  },
  {
    title: 'Real-time Classifier',
    subtitle: 'Streaming classification',
    desc: 'Classify 1000 reviews/min with cost per item under $0.001. Temperature=0, structured labels, streaming UI.',
    pattern: 'Classification + streaming + cost control',
    stack: 'Node.js + OpenAI + WebSocket + React',
    interview: 'I built a real-time classifier that tags 1000 items/min with cost per item under $0.001.',
  },
]

function HomePage() {
  const hasKey = Boolean(loadSettings().apiKey)
  const [diagramOpen, setDiagramOpen] = useState(false)
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 py-10">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 leading-tight tracking-tight">
          AI, explained for engineers
        </h1>
        <p className="mt-3 text-[15px] text-zinc-400 max-w-2xl leading-relaxed">
          Stop nodding in AI meetings. Start pushing back with real architecture reasoning.
          Built for engineers who ship products — not for people who want to become ML researchers.
        </p>
        <p className="mt-2 text-[13px] text-emerald-400/80">
          Every lesson is a live demo — real OpenAI API call, real cost, real behavior. No mocks.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <StickyCta to="/concept/b1" label="Start with Basics" />
          {!hasKey && (
            <div className="flex items-center gap-2">
              <Link
                to="/settings"
                className="rounded border border-amber-500/40 bg-amber-500/5 px-4 py-2 text-[13px] text-amber-200 hover:bg-amber-500/10"
              >
                Add OpenAI API key first
              </Link>
              <div className="relative group">
                <span className="text-zinc-500 text-sm cursor-help">ⓘ</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-[11px] text-zinc-400 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  Your key is stored only in your browser's localStorage. It's never sent to any server except OpenAI's API. Safe for learning   not production-grade.
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* AI engineering map */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">The AI engineering map</h2>
        <p className="text-[12px] text-zinc-500 mb-5">You don't need to learn all of AI. Two slices are your lane   the rest, you just need to know exists.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AI_BRANCHES.map((branch, i) => {
            const isLane = branch.color === 'emerald'
            return (
              <motion.div
                key={branch.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`rounded-lg border px-4 py-3 ${
                  isLane ? 'border-emerald-600/40 bg-emerald-600/5' : 'border-zinc-800 bg-zinc-900/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-[14px] font-semibold ${isLane ? 'text-emerald-300' : 'text-zinc-300'}`}>
                    {branch.name}
                  </h3>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      branch.color === 'emerald'
                        ? 'bg-emerald-600/20 text-emerald-300'
                        : branch.color === 'sky'
                          ? 'bg-sky-600/20 text-sky-300'
                          : branch.color === 'amber'
                            ? 'bg-amber-600/20 text-amber-300'
                            : 'bg-zinc-700/40 text-zinc-500'
                    }`}
                  >
                    {branch.yourJob}
                  </span>
                </div>
                {branch.desc && (
                  <p className="text-[12px] text-zinc-400 leading-relaxed mb-2">{branch.desc}</p>
                )}
                {branch.link && (
                  <Link to={branch.link as any} className="inline-block text-[12px] text-emerald-400 hover:text-emerald-300">
                    → Start here
                  </Link>
                )}
                {branch.readMore && (
                  <div className="mt-1">
                    <button
                      onClick={() => setExpandedBranch(expandedBranch === branch.name ? null : branch.name)}
                      className="inline-block text-[12px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
                    >
                      {expandedBranch === branch.name ? 'Read less' : 'Read more'}
                    </button>
                    <AnimatePresence>
                      {expandedBranch === branch.name && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden text-[11.5px] text-zinc-500 leading-relaxed mt-2"
                        >
                          {branch.readMore}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* The pipeline phases */}
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

      {/* What you'll build */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">What you'll build (and what you'll understand)</h2>
        <p className="text-[12px] text-zinc-500 mb-5">Each Basics lesson ends with a working demo — and a real understanding you can use in any conversation.</p>
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
              <span className="text-[11px] text-zinc-500 text-right">{w.learn}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Real projects */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-14"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">Real projects to build next</h2>
        <p className="text-[12px] text-zinc-500 mb-5">Not "chat with your PDF." Four distinct AI patterns — each portfolio-worthy, each domain-neutral.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REAL_PROJECTS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-semibold text-zinc-200">{p.title}</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-700/40 text-zinc-500">
                  {p.pattern}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-relaxed mb-2">{p.desc}</p>
              <p className="text-[11px] text-zinc-600 mb-2">{p.stack}</p>
              <div className="rounded border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 mt-2">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">In an interview</p>
                <p className="text-[11.5px] text-zinc-400 leading-relaxed">{p.interview}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Watch it move (collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-14"
      >
        <button
          onClick={() => setDiagramOpen((o) => !o)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h2 className="text-sm font-semibold text-zinc-300">Watch it move</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">The full RAG retrieval flow animated with 3 example queries</p>
          </div>
          <motion.span animate={{ rotate: diagramOpen ? 180 : 0 }} className="text-zinc-500 text-lg pr-2">
            ▾
          </motion.span>
        </button>
        {diagramOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              <RagFlowDiagram />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}