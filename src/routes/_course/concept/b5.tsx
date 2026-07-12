import { createFileRoute } from '@tanstack/react-router'
import { Callout } from '../../../components/Callout'
import { PromptLab } from '../../../components/PromptLab'
import { UnderTheHood } from '../../../components/UnderTheHood'
import { Quiz } from '../../../components/Quiz'
import { ConceptNav } from '../../../components/ConceptNav'
import { CONCEPTS } from '../../../lib/concepts'
import { setStatus } from '../../../lib/storage'

export const Route = createFileRoute('/_course/concept/b5')({
  component: B5Page,
})

const idx = CONCEPTS.findIndex((c) => c.id === 'b5')
const prev = idx > 0 ? CONCEPTS[idx - 1] : null
const next = idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : null

function B5Page() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-24">
      <header className="mb-8">
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Basics</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Prompt Engineering</h1>
      </header>

      <section className="space-y-4 text-[14px] leading-relaxed text-zinc-300">
        <p>
          The prompt is the input you give the LLM. "Prompt engineering" sounds buzzwordy; what it really means is <em>structuring that input so the model reliably does what you want.</em> Same model, same API — wildly different outputs depending on how you ask.
        </p>

        <Callout title="Relatable analogy: managing a junior">
          Imagine your most capable but literal-minded junior engineer. "Build a feature" → vague output. "Build a Slack bot in TypeScript that posts daily standup summaries, using our existing SDK, returns JSON, and is 50 lines max" → useful output. LLMs are the same. Specificity, examples, and format constraints are how you "manage" them.
        </Callout>

        <h2 className="text-lg font-semibold text-zinc-100 mt-8">Three techniques this lab covers</h2>

        <h3 className="text-[15px] font-semibold text-zinc-200 mt-4">1. Strong system prompt</h3>
        <p>
          The <code className="font-mono text-zinc-400">system</code> role is the highest-priority instruction — it shapes how the model reads every later message. Vague systems ("You are a helpful assistant") → vague answers. Specific systems ("You are a concise assistant for the IRCTC helpdesk. Reply in 2 sentences.") → on-brand, on-format replies.
        </p>
        <p className="text-[13px] text-zinc-500">A good system answers: who is the model? what does it do? what does it explicitly <em>not</em> do? what format?</p>

        <h3 className="text-[15px] font-semibold text-zinc-200 mt-6">2. Few-shot examples</h3>
        <p>
          Show, don't tell. Instead of describing a classification task, give the model 1-3 <code className="font-mono text-zinc-400">user → assistant</code> examples that demonstrate the pattern. The model copies the demonstrated behaviour way more reliably than it follows an abstract description.
        </p>

        <Callout title="When to use few-shot vs zero-shot">
          Zero-shot (just instructions) works for tasks the model already understands well. Few-shot shines for outputs the model can't infer from instructions alone — custom categories, weird formats, edge cases. In production RAG you only few-shot when you've measured a failure mode and zero-shot genuinely underperforms — every example burns tokens on every request.
        </Callout>

        <h3 className="text-[15px] font-semibold text-zinc-200 mt-6">3. Structured JSON output</h3>
        <p>
          When you need the LLM's answer to feed back into your app code (a form, a database row, a tool call), ask for JSON. Two tricks: put the schema in the system prompt, and tell the model to return <em>only</em> JSON — no markdown fence, no commentary. Then validate programmatically; if parsing fails, retry with "Your last response was not valid JSON."
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Try it live — Prompt Lab</h2>
        <p className="text-[13px] text-zinc-400 mb-4">
          Three presets to play with. <strong>System prompt:</strong> tweak it — make the model super formal or super casual, see the same IRCTC question get a totally different answer. <strong>Few-shot:</strong> add a second example and watch classification accuracy improve. <strong>JSON:</strong> parse error from extra text? Tighten "ONLY valid JSON, no markdown fences" until it parses.
        </p>
        <PromptLab />

        <UnderTheHood
          title="How messages are assembled in each mode"
          description="The buildMessages() helper shows exactly what array gets sent to OpenAI for each mode. Few-shot interleaves user/assistant pairs before the real query; JSON mode stacks a second system message with the schema."
          language="tsx"
          code={`function buildMessages(mode, fields) {
  const msgs = [{ role: 'system', content: fields.system }]
  if (mode === 'fewShot') {
    msgs.push({ role: 'user', content: fields.exampleUser })
    msgs.push({ role: 'assistant', content: fields.exampleAssistant })
  }
  if (mode === 'json' && fields.extra) {
    msgs.push({ role: 'system', content: fields.extra })
  }
  msgs.push({ role: 'user', content: fields.user })
  return msgs
}`}
        />
      </section>

      <Quiz
        questions={[
          {
            prompt: 'Why does a vague system prompt like "You are a helpful assistant" produce worse outputs than a specific one?',
            options: [
              'The model literally can\'t parse it',
              'It leaves the model to guess persona, format, length, and tone — each guess risks drifting from what you actually want',
              'OpenAI charges more for vague prompts',
              'Vague prompts force the model to use more tokens',
            ],
            answer: 1,
            explanation: 'The system prompt is the model\'s "job spec." Without one, it defaults to training-data average behaviour — chatty, generic, off-format. Specificity is free; use it.',
          },
          {
            prompt: 'You have a custom 5-category classifier for an Indian delivery app (refund, delay, food, driver, other). What\'s the most reliable way to get the model to output the right label?',
            options: [
              'Just describe the categories in the system prompt and hope zero-shot works',
              'Give 3-5 short user→assistant examples covering edge cases — few-shot teaches the pattern far more reliably than abstract description',
              'Increase temperature to 1.0 for more creativity',
              'Append "please be accurate" to the user prompt',
            ],
            answer: 1,
            explanation: 'Custom labels don\'t exist verbatim in the model\'s training. Few-shot demonstrations lock the behaviour in. Production tip: re-use the same few-shot set across every request so token cost stays predictable.',
          },
          {
            prompt: 'You ask the model to return JSON. It returns `\\`\\`\\`json\\n{...}\\n\\`\\`\\`` — text wrapped in markdown fences. Why is your code broken and how do you fix it?',
            options: [
              'The model is broken. Switch to a different provider.',
              'You didn\'t say "ONLY valid JSON, no markdown fences" in the system prompt. Add that and validate the response — if parsing still fails, retry with the error as feedback.',
              'Increase the temperature to 1.5 — random models never bother with code fences',
              'OpenAI models can\'t output JSON. Use a regex instead.',
            ],
            answer: 1,
            explanation: 'Models default to markdown when allowed. The fix is two-layer: (1) an explicit instruction forbidding fences, and (2) a programmatic strip-and-validate step, with a retry on failure. The lab\'s "✗ Not valid JSON" indicator shows this in action.',
          },
          {
            prompt: 'In production RAG, you should add a few-shot example to every request, always. True or false — and why?',
            options: [
              'True — more examples always means better answers',
              'False — every example burns tokens on every request. Add few-shot only when zero-shot fails a specific case you\'ve measured, and then measure the cost-vs-accuracy tradeoff',
              'True — fewer examples mean more hallucinations',
              'False — few-shot only works with Anthropic models',
            ],
            answer: 1,
            explanation: 'Senior engineers measure. Every extra example is a recurring token cost. Only add few-shot to fix a failure you\'ve documented. Then keep it only if the accuracy gain outweighs the cost across your traffic profile.',
          },
        ]}
        onComplete={() => setStatus('b5', 'complete')}
        nextPath="/concept/b6"
      />

      <ConceptNav prev={prev} next={next} />
    </div>
  )
}