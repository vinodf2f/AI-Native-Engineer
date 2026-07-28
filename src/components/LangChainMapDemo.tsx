import { useState } from 'react'

type Step = {
  id: string
  label: string
  yours: string
  langchain: string
  note: string
}

const STEPS: Step[] = [
  {
    id: 'chunk',
    label: '1. Chunk',
    yours: 'chunkText(doc, "recursive")',
    langchain: 'RecursiveCharacterTextSplitter',
    note: 'Same idea: split on paragraphs, fall back to sentences. The library adds many splitter variants (markdown, code, token-based).',
  },
  {
    id: 'embed',
    label: '2. Embed',
    yours: 'embedChunks(chunks) → OpenAI API',
    langchain: 'new OpenAIEmbeddings()',
    note: 'A thin wrapper over the same embeddings endpoint you already call. Same model, same vectors, same price.',
  },
  {
    id: 'store',
    label: '3. Store',
    yours: 'new VectorStore() (your in-memory store)',
    langchain: 'MemoryVectorStore / PGVector / Pinecone',
    note: 'The library gives you 20+ vector DB backends behind one interface. Swap the backend, keep the code.',
  },
  {
    id: 'retrieve',
    label: '4. Retrieve',
    yours: 'store.search(query, topK)',
    langchain: 'store.asRetriever(topK)',
    note: 'Similarity search either way. The retriever interface also plugs into chains without custom glue.',
  },
  {
    id: 'generate',
    label: '5. Generate',
    yours: 'createChatCompletion(messages)',
    langchain: 'prompt.pipe(model).pipe(parser)',
    note: 'LCEL pipes are your function calls dressed up. Prompt template → chat model → output parser. Same HTTP call underneath.',
  },
]

export function LangChainMapDemo() {
  const [active, setActive] = useState<string>('chunk')
  const step = STEPS.find((s) => s.id === active) ?? STEPS[0]

  return (
    <div className="my-6 space-y-4">
      <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1.5 items-stretch text-[12px]">
        <div />
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 px-2">Your code (Foundations)</p>
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 px-2">LangChain name</p>

        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className="contents group text-left"
          >
            <span
              className={`px-2 py-2 text-[11px] font-medium rounded-l border-y border-l ${
                active === s.id
                  ? 'border-emerald-600 text-emerald-300 bg-emerald-600/5'
                  : 'border-zinc-800 text-zinc-500 group-hover:text-zinc-300'
              }`}
            >
              {s.label}
            </span>
            <span
              className={`px-2 py-2 font-mono text-[11px] border-y ${
                active === s.id
                  ? 'border-emerald-600 text-sky-300 bg-emerald-600/5'
                  : 'border-zinc-800 text-zinc-400 group-hover:text-zinc-200'
              }`}
            >
              {s.yours}
            </span>
            <span
              className={`px-2 py-2 font-mono text-[11px] rounded-r border-y border-r ${
                active === s.id
                  ? 'border-emerald-600 text-amber-300 bg-emerald-600/5'
                  : 'border-zinc-800 text-zinc-400 group-hover:text-zinc-200'
              }`}
            >
              {s.langchain}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <p className="text-[11px] font-medium text-zinc-400 mb-1">{step.label} — what the library adds</p>
        <p className="text-[12px] text-zinc-300">{step.note}</p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-[12px] text-zinc-400 space-y-1">
        <p>
          <strong className="text-zinc-200">Use the library when:</strong> many integrations, a team
          standard, or you swap providers often.
        </p>
        <p>
          <strong className="text-zinc-200">Hand-roll when:</strong> one provider, a small pipeline,
          and you want to see exactly what is sent to the API. Your hand-built RAG is ~30 lines and fully
          debuggable.
        </p>
      </div>
    </div>
  )
}
