import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { getLesson } from '../lib/concepts'

/**
 * Link to another lesson. Default shows the lesson title so readers
 * never see a cryptic id like "bb3". Pass `short` for compact spots
 * (diagrams) where the id itself is the label — title appears on hover.
 */
export function LessonRef({
  id,
  short,
  children,
}: {
  id: string
  short?: boolean
  children?: ReactNode
}) {
  const lesson = getLesson(id)
  if (!lesson) return <>{children ?? id}</>
  return (
    <Link
      to={`/concept/${id}` as any}
      title={short ? lesson.title : (lesson.blurb ?? lesson.title)}
      className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-800 hover:decoration-emerald-600 underline-offset-2"
    >
      {children ?? (short ? id.toUpperCase() : lesson.title)}
    </Link>
  )
}
