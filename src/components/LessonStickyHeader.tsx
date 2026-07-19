import { Link } from '@tanstack/react-router'
import { getLesson, getNeighbors, sectionLabel } from '../lib/concepts'
import type { ConceptMeta } from '../lib/storage'

/** Parse /concept/b1 → b1 */
export function lessonIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/concept\/([^/]+)\/?$/)
  return m?.[1] ?? null
}

export function useLessonFromPath(pathname: string): {
  lesson: ConceptMeta | null
  prev: ConceptMeta | null
  next: ConceptMeta | null
} {
  const id = lessonIdFromPath(pathname)
  if (!id) return { lesson: null, prev: null, next: null }
  const lesson = getLesson(id) ?? null
  const { prev, next } = getNeighbors(id)
  return { lesson, prev, next }
}

/** Mobile top bar center — compact lesson label */
export function MobileLessonTitle({ lesson }: { lesson: ConceptMeta | null }) {
  if (!lesson) {
    return (
      <span className="text-[13px] font-medium text-zinc-200 truncate max-w-[12rem]">
        AI Native Engineer
      </span>
    )
  }
  return (
    <div className="min-w-0 flex-1 px-1.5 text-center">
      <p className="text-[9px] uppercase tracking-wider text-zinc-500 truncate leading-none">
        {sectionLabel(lesson.section)}
        {lesson.availability === 'soon' ? ' · soon' : ''}
      </p>
      <p className="text-[11px] sm:text-[12px] font-medium text-zinc-100 truncate leading-tight mt-0.5">
        {lesson.title}
      </p>
    </div>
  )
}

/** Sticky lesson context: prev/next on mobile; full details on desktop */
export function LessonStickyBar({
  lesson,
  prev,
  next,
}: {
  lesson: ConceptMeta
  prev: ConceptMeta | null
  next: ConceptMeta | null
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md">
      {/* Mobile: thin prev / next only (title is in the fixed app bar) */}
      <div className="md:hidden flex items-center justify-between gap-2 px-3 h-8 text-[11px]">
        {prev ? (
          <Link
            to={`/concept/${prev.id}` as any}
            className="text-zinc-500 hover:text-zinc-200 truncate max-w-[45%]"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/concept/${next.id}` as any}
            className="text-zinc-400 hover:text-emerald-300 truncate max-w-[45%] text-right"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* Desktop: section, title, blurb, neighbors */}
      <div className="hidden md:flex items-center gap-4 px-6 lg:px-8 h-12 max-w-3xl mx-auto w-full">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 leading-none">
            {sectionLabel(lesson.section)}
            {lesson.availability === 'soon' && (
              <span className="ml-1.5 normal-case tracking-normal text-zinc-600">soon</span>
            )}
          </p>
          <div className="flex items-baseline gap-2 min-w-0 mt-0.5">
            <h2 className="text-[13px] font-semibold text-zinc-100 truncate">{lesson.title}</h2>
            {lesson.blurb && (
              <span className="text-[11px] text-zinc-500 truncate hidden lg:inline">
                · {lesson.blurb}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          {prev ? (
            <Link
              to={`/concept/${prev.id}` as any}
              className="text-zinc-500 hover:text-zinc-200 max-w-[8rem] truncate"
              title={prev.title}
            >
              ← {prev.title}
            </Link>
          ) : null}
          {next ? (
            <Link
              to={`/concept/${next.id}` as any}
              className="text-zinc-400 hover:text-emerald-300 max-w-[8rem] truncate"
              title={next.title}
            >
              {next.title} →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
