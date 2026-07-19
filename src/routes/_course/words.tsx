import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BUZZWORD_GROUPS } from '../../lib/buzzwords'
import { getLesson } from '../../lib/concepts'

export const Route = createFileRoute('/_course/words')({
  component: WordsPage,
})

function WordsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Reference</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">AI words</h1>
        <p className="mt-3 text-[14px] text-zinc-400 leading-relaxed max-w-xl">
          Lines you hear in meetings and tweets — in plain English. Not a quiz.
          Jump here anytime. When a word has a lesson, we link it.
        </p>
      </header>

      <div className="space-y-10">
        {BUZZWORD_GROUPS.map((group, gi) => (
          <motion.section
            key={group.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.04 }}
          >
            <h2 className="text-[13px] font-semibold text-zinc-200 mb-3">{group.title}</h2>
            <ul className="space-y-3">
              {group.items.map((item) => {
                const lesson = item.lessonId ? getLesson(item.lessonId) : undefined
                const lessonReady = lesson?.availability === 'ready'
                const lessonPath = item.lessonId
                  ? (`/concept/${item.lessonId}` as const)
                  : null

                return (
                  <li
                    key={item.term}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-[14px] font-semibold text-zinc-100 font-mono">
                        {item.term}
                      </span>
                      {lessonPath && (
                        <Link
                          to={lessonPath as any}
                          className={`text-[11px] ${
                            lessonReady
                              ? 'text-emerald-400 hover:text-emerald-300'
                              : 'text-zinc-500 hover:text-zinc-400'
                          }`}
                        >
                          {lessonReady ? '→ lesson' : '→ on syllabus'}
                        </Link>
                      )}
                    </div>
                    <p className="mt-1.5 text-[13px] text-zinc-300 leading-relaxed">
                      {item.plain}
                    </p>
                    {item.example && (
                      <p className="mt-2 text-[12px] text-zinc-500 leading-relaxed">
                        <span className="text-zinc-600">e.g. </span>
                        {item.example}
                      </p>
                    )}
                    {item.not && (
                      <p className="mt-2 text-[12px] text-amber-500/80 leading-relaxed">
                        Not: {item.not}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </motion.section>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-zinc-800 flex flex-wrap gap-4 text-[13px]">
        <Link to="/" className="text-zinc-400 hover:text-zinc-200">
          ← Home
        </Link>
        <Link to="/concept/b1" className="text-emerald-400 hover:text-emerald-300 ml-auto">
          Start Foundations →
        </Link>
      </div>
    </div>
  )
}
