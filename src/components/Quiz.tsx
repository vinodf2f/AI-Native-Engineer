import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'

export type QuizQuestion = {
  prompt: string
  options: string[]
  answer: number
  explanation?: ReactNode
}

export function Quiz({
  questions,
  onComplete,
  nextPath,
}: {
  questions: QuizQuestion[]
  onComplete?: () => void
  nextPath?: string
}) {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null))
  const [revealed, setRevealed] = useState<number | null>(null)

  const allAnswered = answers.every((a) => a !== null)
  const allCorrect = allAnswered && answers.every((a, i) => a === questions[i].answer)

  function select(qi: number, oi: number) {
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
    setRevealed(qi)
  }

  return (
    <div className="my-8">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Checkpoint</h3>
      {questions.map((q, qi) => (
        <div key={qi} className="mb-6">
          <p className="text-[13px] text-zinc-300 mb-3">{qi + 1}. {q.prompt}</p>
          <div className="space-y-1.5">
            {q.options.map((opt, oi) => {
              const isSelected = answers[qi] === oi
              const isCorrect = q.answer === oi
              const isRevealed = revealed === qi
              const showCorrect = isRevealed && isCorrect
              const showWrong = isRevealed && isSelected && !isCorrect

              return (
                <button
                  key={oi}
                  onClick={() => select(qi, oi)}
                  className={`block w-full text-left rounded px-3 py-2 text-[13px] transition-colors border ${
                    showCorrect
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200 light:border-emerald-600 light:bg-emerald-50 light:text-emerald-900'
                      : showWrong
                        ? 'border-red-500 bg-red-500/10 text-red-200 light:border-red-600 light:bg-red-50 light:text-red-900'
                        : isSelected
                          ? 'border-zinc-500 bg-zinc-700 text-zinc-100 light:border-zinc-900 light:bg-zinc-800 light:text-zinc-950'
                          : 'border-zinc-700 hover:border-zinc-500 text-zinc-400 light:border-zinc-300 light:hover:border-zinc-500 light:text-zinc-700'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          <AnimatePresence>
            {revealed === qi && q.explanation && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[12px] text-zinc-500 mt-2 pl-3 border-l-2 border-zinc-700"
              >
                {q.explanation}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ))}

      <AnimatePresence>
        {allCorrect && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-5 py-3"
          >
            <p className="text-[13px] text-emerald-200">All correct. Concept unlocked ✓</p>
            <button
              onClick={() => {
                onComplete?.()
                if (nextPath) navigate({ to: nextPath })
              }}
              className="mt-2 rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[12px] text-white"
            >
              Mark complete & continue →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}