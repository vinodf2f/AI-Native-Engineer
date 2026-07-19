import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { StickyCta } from '@/components/StickyCta'
import { BRAND, BUILD_EXAMPLES } from '@/lib/brand'
import { hasAnyApiKey } from '@/lib/storage'

export const Route = createFileRoute('/_course/')({
  component: HomePage,
})

const STATUS_LABEL: Record<(typeof BUILD_EXAMPLES)[number]['status'], string> = {
  foundations: 'Foundations',
  'building-blocks': 'Building blocks',
  agents: 'Agents',
  ship: 'Ship it',
}

const PATH = [
  {
    name: 'Foundations',
    desc: 'Models, search, RAG, prompts, streaming, tests.',
    status: 'Open',
    open: true,
  },
  {
    name: 'Building blocks',
    desc: 'Tool calling open. More lessons next.',
    status: 'Open',
    open: true,
  },
  {
    name: 'Agents',
    desc: 'Multi step when one call is not enough.',
    status: 'Later',
    open: false,
  },
  {
    name: 'Ship it',
    desc: 'Evals, cost, fit in your app.',
    status: 'Later',
    open: false,
  },
]

function HomePage() {
  const hasKey = hasAnyApiKey()

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-8 py-10 md:py-14 pb-24">
      {/* 1. Hero */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-500/90 mb-3">
          {BRAND.tagline}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 leading-[1.15] tracking-tight">
          {BRAND.name}
        </h1>
        <p className="mt-4 text-[15px] text-zinc-400 leading-relaxed">{BRAND.promise}</p>
        <p className="mt-2 text-[13px] text-zinc-500 leading-relaxed">{BRAND.sub}</p>

        <StickyCta to="/concept/b1" label="Start Foundations" />

        <div className="mt-3 flex items-center gap-1.5">
          <Link
            to="/settings"
            className="rounded border border-amber-500/50 bg-amber-500/5 px-2.5 py-1 text-[11px] text-amber-300 hover:bg-amber-500/10 hover:border-amber-400/60 transition-colors"
          >
            {hasKey ? 'API keys' : 'Add API keys'}
          </Link>
          <div className="relative group">
            <span
              className="text-amber-300 text-[12px] cursor-help leading-none select-none"
              aria-label="About API keys"
            >
              ⓘ
            </span>
            <div className="absolute bottom-full left-0 mb-2 w-64 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-[11px] text-zinc-400 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              OpenAI and/or xAI keys for live demos. Stored only in this browser. Never sent to
              our server. Fine for learning; real apps use a backend proxy.
            </div>
          </div>
        </div>
      </motion.header>

      {/* 2. How each lesson works */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-12"
      >
        <h2 className="text-sm font-semibold text-zinc-100 mb-3">How each lesson works</h2>
        <ol className="grid grid-cols-2 gap-2 text-[12px]">
          {[
            ['1. Read', 'Simple idea, developer English'],
            ['2. Try live', 'Real API call, tokens and cost'],
            ['3. See code', 'What your app would use'],
            ['4. Check', 'Short quiz so it sticks'],
          ].map(([t, d]) => (
            <li
              key={t}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5"
            >
              <span className="block font-medium text-zinc-200">{t}</span>
              <span className="text-zinc-500">{d}</span>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* 3. The path — small cards */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-12"
      >
        <h2 className="text-sm font-semibold text-zinc-100 mb-1">The path</h2>
        <p className="text-[12px] text-zinc-500 mb-4">
          Full list is in the sidebar. Foundations is open now.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PATH.map((row, i) => (
            <motion.div
              key={row.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.03 }}
              className={`rounded-xl border px-3 py-3 min-h-[5.5rem] flex flex-col ${
                row.open
                  ? 'border-emerald-500/35 bg-emerald-500/[0.07]'
                  : 'border-zinc-800 bg-zinc-900/35'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-[13px] font-semibold text-zinc-100 leading-snug">
                  {row.name}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-wide shrink-0 mt-0.5 ${
                    row.open ? 'text-emerald-400' : 'text-zinc-600'
                  }`}
                >
                  {row.status}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug mt-auto">{row.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 4. What you will build — small cards */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="text-sm font-semibold text-zinc-100 mb-1">What you will build</h2>
        <p className="text-[12px] text-zinc-500 mb-4 leading-relaxed">
          QuickBite food delivery support (Zomato / Swiggy style). Same world, different skills.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BUILD_EXAMPLES.map((ex, i) => (
            <motion.article
              key={ex.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.03 }}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-[12.5px] font-semibold text-zinc-100 leading-snug">
                  {ex.title}
                </h3>
                <span className="text-[9px] uppercase tracking-wide text-zinc-600 shrink-0">
                  {STATUS_LABEL[ex.status]}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 italic leading-snug line-clamp-2">
                {ex.scene}
              </p>
              <p className="mt-1.5 text-[11px] text-zinc-500 leading-snug line-clamp-2">
                {ex.youBuild}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {ex.concepts.slice(0, 3).map((c) => (
                  <span
                    key={c}
                    className="text-[9px] rounded border border-zinc-800 bg-zinc-950/60 px-1.5 py-0.5 text-zinc-500"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      {/* 5. Who */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]"
      >
        <div className="rounded-lg border border-zinc-800 px-3.5 py-3">
          <p className="font-medium text-zinc-200 mb-1.5">For you if</p>
          <ul className="text-zinc-500 space-y-1 list-disc ml-4">
            <li>You ship product features</li>
            <li>You want solid AI basics, not hype</li>
            <li>You learn better by trying than watching</li>
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-800 px-3.5 py-3">
          <p className="font-medium text-zinc-200 mb-1.5">Not for</p>
          <ul className="text-zinc-500 space-y-1 list-disc ml-4">
            <li>Training your own LLM</li>
            <li>Research paper depth</li>
            <li>Prompt tips with no system picture</li>
          </ul>
        </div>
      </motion.section>

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Demos run in your browser with your keys (OpenAI and/or xAI). Fine for learning.
      </p>
    </div>
  )
}
