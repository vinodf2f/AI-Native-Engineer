import { VectorStore, type SearchResult } from './vectorStore'
import { createChatCompletion, type ChatMessage } from './openai'

export type RagDoc = {
  text: string
  source: string
}

export type RagAnswer = {
  answer: string
  citations: SearchResult[]
  queryEmbeddingCost: number
  answerCompletionCost: number
  totalCost: number
}

export type ChunkingStrategy = 'fixed' | 'recursive' | 'sentence'

export function chunkText(
  text: string,
  strategy: ChunkingStrategy = 'recursive',
  chunkSize = 500,
  overlap = 50,
): string[] {
  if (strategy === 'fixed') {
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize))
      if (i + chunkSize >= text.length) break
    }
    return chunks
  }
  if (strategy === 'sentence') {
    const sentences = text.match(/[^.!?]+[.!?]+\s*/g) ?? [text]
    const chunks: string[] = []
    let curr = ''
    for (const s of sentences) {
      if ((curr + s).length > chunkSize && curr) {
        chunks.push(curr.trim())
        curr = s
      } else {
        curr += s
      }
    }
    if (curr.trim()) chunks.push(curr.trim())
    return chunks
  }
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let buf = ''
  for (const para of paragraphs) {
    if ((buf + para).length > chunkSize && buf) {
      chunks.push(buf.trim())
      buf = para.slice(-overlap) + '\n\n'
    } else {
      buf += (buf ? '\n\n' : '') + para
    }
  }
  if (buf.trim()) chunks.push(buf.trim())
  return chunks
}

export class RagPipeline {
  store = new VectorStore()
  chunkCount = 0

  async ingest(docs: RagDoc[], strategy: ChunkingStrategy = 'recursive'): Promise<number> {
    for (const doc of docs) {
      const chunks = chunkText(doc.text, strategy)
      for (const c of chunks) {
        await this.store.add(c, { source: doc.source })
        this.chunkCount++
      }
    }
    return this.chunkCount
  }

  async answer(query: string, topK = 3): Promise<RagAnswer> {
    const citations = await this.store.search(query, topK)

    const context = citations
      .map((c, i) => `[${i + 1}] ${c.text}`)
      .join('\n\n')

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You answer questions using only the provided context. ' +
          'Cite sources with [1], [2], [3] markers. ' +
          'If the context does not contain the answer, say "I don\'t have enough information to answer this." ' +
          'Keep answers under 3 sentences.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${query}`,
      },
    ]

    const completion = await createChatCompletion(messages)
    return {
      answer: completion.content,
      citations,
      queryEmbeddingCost: 0,
      answerCompletionCost: completion.cost,
      totalCost: completion.cost,
    }
  }
}