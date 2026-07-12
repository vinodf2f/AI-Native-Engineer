import { cosineSimilarity, createEmbedding } from './embeddings'

export type EvalCase = {
  id: string
  query: string
  expectedAnswer: string
  expectedKeywords: string[]
}

export type EvalResult = {
  caseId: string
  query: string
  actualAnswer: string
  expectedAnswer: string
  semanticScore: number
  keywordScore: number
  keywordHits: string[]
  keywordMisses: string[]
  passed: boolean
}

export const DEFAULT_EVAL_SET: EvalCase[] = [
  {
    id: 'cancel',
    query: 'How do I cancel my train ticket?',
    expectedAnswer: 'Go to IRCTC My Transactions, select Booked History, and click Cancel next to the booking.',
    expectedKeywords: ['IRCTC', 'Booked History', 'Cancel'],
  },
  {
    id: 'refund',
    query: 'When will my refund come?',
    expectedAnswer: 'Refund is automatically credited to the original payment method within 5-7 working days.',
    expectedKeywords: ['refund', '5', '7', 'working days'],
  },
  {
    id: 'tatkal',
    query: 'Can I cancel a Tatkal ticket?',
    expectedAnswer: 'Tatkal tickets can be cancelled only up to 24 hours before departure. No refund after that window.',
    expectedKeywords: ['Tatkal', '24', 'departure', 'refund'],
  },
  {
    id: 'miss',
    query: 'I missed my train. What should I do?',
    expectedAnswer: 'File a TDR through the IRCTC TDR portal within 72 hours of departure.',
    expectedKeywords: ['TDR', '72', 'departure'],
  },
]

export async function scoreAnswer(
  actual: string,
  expected: string,
  expectedKeywords: string[],
): Promise<{ semanticScore: number; keywordScore: number; hits: string[]; misses: string[] }> {
  const [a, e] = await Promise.all([createEmbedding(actual), createEmbedding(expected)])
  const semanticScore = cosineSimilarity(a.vector, e.vector)

  const lower = actual.toLowerCase()
  const hits = expectedKeywords.filter((k) => lower.includes(k.toLowerCase()))
  const misses = expectedKeywords.filter((k) => !lower.includes(k.toLowerCase()))
  const keywordScore = hits.length / expectedKeywords.length

  return { semanticScore, keywordScore, hits, misses }
}