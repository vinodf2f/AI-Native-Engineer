import { Link } from '@tanstack/react-router'
import { ConceptNav } from './ConceptNav'
import { CONCEPTS } from '../lib/concepts'

export function ComingSoon({ id }: { id: string }) {
  const idx = CONCEPTS.findIndex((c) => c.id === id)
  const prev = idx > 0 ? CONCEPTS[idx - 1] : null
  const next = idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : null
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-6">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Basics</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">{CONCEPTS[idx]?.title}</h1>
      </header>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center">
        <p className="text-zinc-400 text-sm">Coming soon.</p>
        <p className="text-zinc-600 text-[13px] mt-1">Finish {prev?.title ?? 'prior concept'} and confirm; I'll build this next.</p>
        <Link
          to="/concept/b2"
          className="inline-block mt-4 rounded border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-[13px] text-zinc-300"
        >
          ← Back
        </Link>
      </div>
      <ConceptNav prev={prev} next={next} />
    </div>
  )
}