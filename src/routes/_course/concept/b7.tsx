import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { EvalDemo } from '../../../components/EvalDemo'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { getNeighbors, sectionLabel } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/b7')({
  component: B7Page,
})

const { prev, next } = getNeighbors('b7')

function B7Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">{sectionLabel('foundations')}</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Testing AI output</h1>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          You change one line of your system prompt and your RAG app silently breaks for 30% of queries. How would you know? In classic software, you have unit tests. In LLM apps, the answers are fuzzy strings   there's no <code className="font-mono text-zinc-400">expect(x).toBe(y)</code>. <strong>Evals</strong> are how you test LLM systems: a fixed set of questions with <em>golden answers</em>, scored automatically.
        </p>

        <Callout title="Relatable analogy: exam answer keys">
          In school, the exam board keeps a model answer key. Students write their own answers; a checker compares (semantically   "did they mention refund window and 5-7 days?") and grades. Eval suites are the model-answer-key for your LLM app. Change a prompt? Run the suite. If pass rate drops, your change broke something.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Two score types we use here</h2>

        <h3 className="text-[15px] font-semibold text-zinc-200 mt-4">1. Keyword score (the boring one)</h3>
        <p>
          For each eval case, list the words the answer <em>must</em> contain. Count how many appear in the actual answer. If the expected answer says "refund within 5-7 working days", you'd specify keywords: <code className="font-mono text-zinc-400">[refund, 5, 7, working days]</code>. Simple, deterministic, reliable for catching gross hallucinations.
        </p>

        <h3 className="text-[15px] font-semibold text-zinc-200 mt-4">2. Semantic score (the smart one)</h3>
        <p>
          Embed both the actual and expected answers; compute cosine similarity. If they're above 0.5, the answers are meaningfully similar even if worded differently. This catches "the model said the same thing but in different words"   keyword-only scoring would mark that as a fail. (Uses B2's cosine, B3's embedding call.)
        </p>

        <p className="text-[13px] text-zinc-500">In production you'd also add <strong>faithfulness</strong> (is every claim in the answer supported by retrieved chunks?) and <strong>context recall</strong> (did retrieval surface the right chunks?). Those need an LLM-as-judge. This course sticks to keyword + semantic   they're 80% of the value with 20% of the effort.</p>

        <Callout title="The minimum viable eval set">
          Start with 5-20 questions covering: (1) the obvious happy path, (2) edge cases ("Tatkal cancellation 24h window"), (3) <strong>refusal cases</strong>   questions the docs don't answer. The third category catches hallucinations: if your system prompt grounding breaks, refusal cases start getting creative answers and your keyword score on those (expected answer: "I don't have enough information...") crashes.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">How this proves your prompt actually works</h2>
        <p>
          Without an eval set, you're guessing. With one, you can: change your prompt and re-run; change your chunking strategy and re-run; upgrade to a different model and re-run. The pass rate tells you whether the change is improvement or regression. This is how senior RAG engineers ship prompt changes   never "I think it looks better", always "eval suite stayed at 4/4 pass, ship it."
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live   Mini eval suite</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          The pipeline ingests the same IRCTC policy doc, then runs 4 fixed questions with golden answers + required keywords. Each one: retrieve → answer → score (semantic + keyword). Watch the log unfold. All 4 should pass with the default prompt   try editing the system prompt in the RagPipeline service to break it, reload, re-run; you'll see failures appear.
        </p>
        <EvalDemo />

        <UnderTheHood
          title="How this works: services/eval.ts"
          description="The scoreAnswer function compares actual vs expected using two checks in parallel: keyword presence and embedding cosine similarity. Together they catch both 'hallucinated wrong answer' and 'same meaning, different words'."
          language="tsx"
          code={`export async function scoreAnswer(actual, expected, expectedKeywords) {
  const [a, e] = await Promise.all([
    createEmbedding(actual),
    createEmbedding(expected),
  ])
  const semanticScore = cosineSimilarity(a.vector, e.vector)
  const lower = actual.toLowerCase()
  const hits = expectedKeywords.filter((k) => lower.includes(k.toLowerCase()))
  const misses = expectedKeywords.filter((k) => !lower.includes(k.toLowerCase()))
  const keywordScore = hits.length / expectedKeywords.length
  return { semanticScore, keywordScore, hits, misses }
}`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'Why can\'t you unit-test an LLM app the way you test a regular function (expect(x).toBe(y))?',
            options: [
              'LLMs don\'t have APIs you can call repeatedly',
              'LLM outputs are fuzzy strings   there\'s no single exact correct answer; you need scoring (keyword + semantic) against golden answers',
              'OpenAI rate-limits test runs',
              'LLMs always return undefined in tests',
            ],
            answer: 1,
            explanation: 'There\'s no exact string to assert equality with. The answer can be rephrased infinitely many correct ways. So you test with golden answers + scoring   keyword (deterministic parts must appear) + semantic cosine (meaning must match within a threshold).',
          },
          {
            prompt: 'What does a semantic score between actual and expected answer of 0.78 mean?',
            options: [
              'The answer is 78% correct',
              'The cosine similarity between their embeddings is 0.78   meaningfully similar in meaning even if worded differently',
              '78% of users will like the answer',
              'The answer has 78 tokens',
            ],
            answer: 1,
            explanation: 'It\'s just a cosine number   same one you computed in B2. The interpretation "meaningfully similar" comes from your threshold (we use 0.5). Above 0.5 = pass; below = the answers differ in meaning. The number isn\'t an accuracy percentage   it\'s a vector-space proximity score.',
          },
          {
            prompt: 'Which of these belongs in a serious eval set?',
            options: [
              'Only questions where the LLM currently answers correctly',
              'Happy path questions + tricky edge cases + refusal cases (questions the docs don\'t answer)   the third catches hallucinations when grounding breaks',
              'Only the questions users asked last week',
              'Only one question per document',
            ],
            answer: 1,
            explanation: 'Refusal cases are the killer feature of an eval set. When system-prompt grounding breaks, the model starts confidently hallucinating on out-of-scope questions. If you only test happy-path, you\'ll never catch it. Always include 2-3 "the right answer is I don\'t know" cases.',
          },
          {
            prompt: 'You tweak your system prompt and re-run the eval suite. 4/4 still passes but semantic scores drop from 0.82 avg to 0.55 avg. What\'s the right call?',
            options: [
              'Ship it   pass rate is unchanged',
              'Investigate: the answers are getting worse even if they still pass the bar. Look at the individual answers   your change degraded quality even if it didn\'t break correctness',
              'Roll back immediately and never touch the prompt again',
              'Increase the temperature to compensate',
            ],
            answer: 1,
            explanation: 'Pass rate is binary; semantic score is continuous. A drop of 0.27 average is a strong signal that the change made answers vaguer or less grounded   even if keyword hits still suffice to pass. Senior engineers track the score trend, not just pass/fail. This is evaluation as regression detection.',
          },
        ]}
        onComplete={() => setStatus('b7', 'complete')}
        nextPath="/concept/b8"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}