import { Link } from '@tanstack/react-router'
import type { ConceptMeta } from '../lib/concepts'

export function ConceptNav({ prev, next }: { prev: ConceptMeta | null; next: ConceptMeta | null }) {
  return (
    <div className="mt-12 pt-6 border-t border-zinc-800 flex justify-between text-[13px]">
      {prev ? (
        <Link
          to={`/concept/${prev.id}`}
          className="text-zinc-400 hover:text-zinc-200"
        >
          ← {prev.title}
        </Link>
      ) : <span />}
      {next ? (
        <Link
          to={`/concept/${next.id}`}
          className="text-zinc-400 hover:text-zinc-200 ml-auto"
        >
          {next.title} →
        </Link>
      ) : <span />}
    </div>
  )
}