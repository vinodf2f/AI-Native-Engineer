import { createEmbedding, cosineSimilarity } from './embeddings'

export type StoredChunk = {
  id: string
  text: string
  metadata: Record<string, string>
  vector: number[]
  embeddingCost: number
}

export type SearchResult = StoredChunk & { score: number; rank: number }

export class VectorStore {
  private chunks: StoredChunk[] = []
  private nextId = 1

  size() {
    return this.chunks.length
  }

  all(): StoredChunk[] {
    return [...this.chunks]
  }

  async add(text: string, metadata: Record<string, string> = {}): Promise<StoredChunk> {
    const emb = await createEmbedding(text)
    const chunk: StoredChunk = {
      id: `c${this.nextId++}`,
      text,
      metadata,
      vector: emb.vector,
      embeddingCost: emb.cost,
    }
    this.chunks.push(chunk)
    return chunk
  }

  async addMany(texts: string[]): Promise<StoredChunk[]> {
    const out: StoredChunk[] = []
    for (const t of texts) {
      out.push(await this.add(t))
    }
    return out
  }

  async search(query: string, topK = 5): Promise<SearchResult[]> {
    if (this.chunks.length === 0) return []
    const q = await createEmbedding(query)

    const scored = this.chunks.map((c) => ({
      ...c,
      score: cosineSimilarity(q.vector, c.vector),
    }))

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((r, i) => ({ ...r, rank: i + 1 }))
  }

  clear() {
    this.chunks = []
    this.nextId = 1
  }

  remove(id: string) {
    this.chunks = this.chunks.filter((c) => c.id !== id)
  }
}