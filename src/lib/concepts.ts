import type { ConceptMeta } from './storage'

export const CONCEPTS: ConceptMeta[] = [
  { id: 'b1', title: 'LLM Mental Model', phase: 'B', status: 'not-started' },
  { id: 'b2', title: 'Embeddings', phase: 'B', status: 'not-started' },
  { id: 'b3', title: 'Vector Databases', phase: 'B', status: 'not-started' },
  { id: 'b4', title: 'RAG Pipeline', phase: 'B', status: 'not-started' },
  { id: 'b5', title: 'Prompt Engineering', phase: 'B', status: 'not-started' },
  { id: 'b6', title: 'Streaming + UI', phase: 'B', status: 'not-started' },
  { id: 'b7', title: 'Evaluation', phase: 'B', status: 'not-started' },
  { id: 'b8', title: 'Integration', phase: 'B', status: 'not-started' },
]

export type ConceptGroup = {
  id: string
  title: string
  items: ConceptMeta[]
}

export const CONCEPT_GROUPS: ConceptGroup[] = [
  {
    id: 'basics',
    title: 'Basics',
    items: CONCEPTS,
  },
  {
    id: 'genai',
    title: 'Generative AI',
    items: [],
  },
]