import { useQuery } from '@tanstack/react-query'
import { createEmbedding } from '../services/embeddings'

export function useEmbedding(input: string, enabled = true) {
  return useQuery({
    queryKey: ['embedding', input],
    queryFn: () => createEmbedding(input),
    enabled: Boolean(input) && enabled,
  })
}