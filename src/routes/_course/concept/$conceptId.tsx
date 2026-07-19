import { createFileRoute, redirect } from '@tanstack/react-router'
import { ComingSoon } from '../../../components/ComingSoon'
import { getLesson } from '../../../lib/concepts'

/** Static b1–b8 routes win for ready lessons. This catches soon lessons (bb*, a*, s*). */
export const Route = createFileRoute('/_course/concept/$conceptId')({
  beforeLoad: ({ params }) => {
    const lesson = getLesson(params.conceptId)
    if (!lesson) {
      throw redirect({ to: '/' })
    }
  },
  component: DynamicConceptPage,
})

function DynamicConceptPage() {
  const { conceptId } = Route.useParams()
  return <ComingSoon id={conceptId} />
}
