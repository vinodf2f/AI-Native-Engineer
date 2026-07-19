import { Link } from '@tanstack/react-router'
import { ConceptNav } from './ConceptNav'
import { getLesson, getNeighbors, sectionLabel } from '../lib/concepts'

export function ComingSoon({ id }: { id: string }) {
  const lesson = getLesson(id)
  const { prev, next } = getNeighbors(id)

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
        <p className="text-[13px] text-zinc-400">Lesson not found.</p>
        <Link to="/" className="mt-4 inline-block text-[13px] text-emerald-400">
          ← Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-6">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel(lesson.section)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">{lesson.title}</h1>
        {lesson.blurb && (
          <p className="mt-2 text-[14px] text-zinc-400">{lesson.blurb}</p>
        )}
      </header>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center">
        <p className="text-[11px] font-medium uppercase tracking-wider text-amber-500/90">
          Coming next
        </p>
        <p className="mt-3 text-zinc-300 text-sm max-w-md mx-auto leading-relaxed">
          This lesson is on the syllabus. Foundations is ready now — finish those first.
          We build this section with the same style: plain English, live demos, QuickBite examples.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/concept/b1"
            className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[13px] font-medium text-white"
          >
            Start Foundations
          </Link>
          <Link
            to="/"
            className="rounded border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-[13px] text-zinc-300"
          >
            Course home
          </Link>
        </div>
      </div>

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
