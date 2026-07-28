import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { LangChainMapDemo } from '../../../components/LangChainMapDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { LessonRef } from '../../../components/LessonRef'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/bb5')({
  component: Bb5Page,
})

const { prev, next } = getNeighbors('bb5')

function Bb5Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
          {sectionLabel('building-blocks')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">LangChain without the magic</h1>
        <p className="mt-2 text-[14px] text-zinc-400">
          You already built RAG by hand. Here is the same pipeline wearing library names.
        </p>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          In the <LessonRef id="b4">RAG lesson</LessonRef> you built the pipeline with plain TypeScript: chunk a document, embed the chunks, store
          vectors, retrieve the top matches, ask the model to answer from them. No framework. When
          you open LangChain's docs and see{' '}
          <code className="font-mono text-zinc-400">RecursiveCharacterTextSplitter</code> and{' '}
          <code className="font-mono text-zinc-400">asRetriever</code>, it can feel like a different
          universe. It is not. It is your code with class names.
        </p>

        <p>
          <strong className="text-zinc-100">
            The one line to remember: LangChain does not add intelligence. It adds interfaces.
          </strong>{' '}
          The model underneath does all the thinking — same API calls, same prompts, same tokens.
          The library only standardizes how the pieces are wired, and ships some pre-written
          prompts, which are know-how, not intelligence.
        </p>

        <Callout title="Why this lesson exists">
          At work you will inherit LangChain (or LlamaIndex) code, or be asked to use it. If you
          can map every class back to a step you built yourself, the library stops being magic —
          and you can debug it when (not if) an answer goes wrong.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">What the library actually gives you</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">Integrations</strong> — one interface over 20+ vector
            databases, every major model provider, dozens of document loaders. Swap Pinecone for
            PGVector without rewriting your pipeline.
          </li>
          <li>
            <strong className="text-zinc-200">Shared vocabulary</strong> — "retriever", "chain",
            "splitter" mean the same thing across teams and tutorials.
          </li>
          <li>
            <strong className="text-zinc-200">Less glue code</strong> — prompt templates, output
            parsers, retry logic already wired.
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">What it costs you</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong className="text-zinc-200">Hidden prompts.</strong> Chains assemble system
            prompts for you. When the answer is wrong, you are debugging text you never wrote.
          </li>
          <li>
            <strong className="text-zinc-200">Hidden calls.</strong> One innocent chain invocation
            can make several model calls. The cost instincts from <LessonRef id="bb3" /> apply: log what is actually sent.
          </li>
          <li>
            <strong className="text-zinc-200">Abstraction weight.</strong> A dependency and a
            vocabulary to learn, for what is sometimes a 30-line function.
          </li>
        </ul>

        <Callout title="The senior-engineer rule">
          Reach for the library when you need its integrations or your team standardizes on it.
          Hand-roll when you have one provider and a small pipeline — your <LessonRef id="b4">hand-built pipeline</LessonRef> is fully
          debuggable and has zero magic. Both are legitimate production choices. What is not
          legitimate: using the library without knowing which model calls it makes.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">And LangGraph?</h2>
        <p>
          LangChain's sibling for <em>agents</em>: state, steps, branches, loops — it wraps{' '}
          <LessonRef id="a2">the agent loop you'll build by hand</LessonRef> in the Agents section.
          It has its own lesson there: <LessonRef id="bb6" />. Learn the loop first; the graph
          library second.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Explore the mapping</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          No API key needed. Click each pipeline step to see your code, the LangChain equivalent,
          and what the library adds or hides at that step.
        </p>
        <LangChainMapDemo />

        <UnderTheHood
          title="Same RAG, two spellings"
          description="Left: the RagPipeline shape from the RAG lesson. Right: the LangChain version. Count the model calls — both make exactly one embeddings batch and one chat call. The library does not add intelligence; it adds interfaces."
          language="tsx"
          code={`// your hand-built RAG (plain TS)
const chunks = chunkText(doc.text, 'recursive')
await store.add(chunks)
const found = await store.search(query, 3)
const answer = await createChatCompletion(messages)

// LangChain (same steps, class names)
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
const docs = await splitter.splitDocuments(rawDocs)
const store = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings())
const retriever = store.asRetriever(3)
const chain = promptTemplate.pipe(chatModel).pipe(new StringOutputParser())
const answer = await chain.invoke({ context, question })`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'In the RAG lesson you wrote store.search(query, topK). The LangChain equivalent is…',
            options: [
              'model.invoke(query)',
              'vectorStore.asRetriever(topK) — a retriever interface over the same similarity search',
              'RecursiveCharacterTextSplitter',
              'StringOutputParser',
            ],
            answer: 1,
            explanation:
              'A retriever is just "the thing that fetches relevant chunks." Your search function and their asRetriever() do the same job: top-K similarity over stored vectors.',
          },
          {
            prompt: 'What is the real benefit LangChain gives over your hand-built pipeline?',
            options: [
              'The model answers become more accurate',
              'API calls become free',
              'Swappable integrations — vector DBs, embedding providers, chat models — behind one interface, with less glue code',
              'It removes the need for API keys',
            ],
            answer: 2,
            explanation:
              'The value is the ecosystem: swap PGVector for Pinecone, OpenAI for another provider, without rewriting the pipeline. The underlying calls are identical.',
          },
          {
            prompt: 'What is the main hidden cost of using the library?',
            options: [
              'Abstraction: when an answer is wrong, you debug prompts and steps the library assembled for you — harder than debugging your own 30-line function',
              'It requires a GPU server',
              'It only works with OpenAI models',
              'It cannot stream responses',
            ],
            answer: 0,
            explanation: (
              <>Chains build prompts and make calls you did not write. The fix is the same habit from <LessonRef id="bb3" /> and <LessonRef id="bb4" />: log every call and every prompt, whether you or the library made it.</>
            ),
          },
          {
            prompt: 'When is hand-rolled RAG the right choice?',
            options: [
              'Never — always use a framework in production',
              'One provider, a small pipeline, and you want to see exactly what is sent to the API. Your hand-built pipeline is short, testable, and fully debuggable',
              'Only for weekend demos, never real products',
              'Only when you have no API key',
            ],
            answer: 1,
            explanation:
              'Plenty of production systems run hand-rolled pipelines precisely because every prompt and call is visible. Frameworks earn their place when integrations multiply.',
          },
        ]}
        onComplete={() => setStatus('bb5', 'complete')}
        nextPath="/concept/a1"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}
