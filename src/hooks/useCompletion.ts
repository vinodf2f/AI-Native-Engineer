import { useQuery } from '@tanstack/react-query'
import { createChatCompletion, type ChatMessage } from '../services/openai'

export function useCompletion(messages: ChatMessage[], enabled = false) {
  return useQuery({
    queryKey: ['completion', messages],
    queryFn: () => createChatCompletion(messages),
    enabled,
  })
}