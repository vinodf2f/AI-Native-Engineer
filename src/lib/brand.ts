/** Course brand. Keep home, sidebar, and README aligned. */

export const BRAND = {
  name: 'AI Native Engineer',
  tagline: 'AI for product builders',
  /** Hero body. Short. Human. No em dashes. */
  promise:
    'Interactive course for engineers who ship apps. You build the pieces yourself with live API calls, see real cost, and get a clear picture of how AI features work.',
  sub:
    'For product people, not model trainers. Useful even if AI is only a small part of your job.',
} as const

/**
 * Builds we walk through in the course.
 * Each ties a real situation to the ideas you will learn.
 */
export const BUILD_EXAMPLES = [
  {
    title: 'Help bot that knows the policy',
    scene: 'User: "Wrong item aaya, refund milega kya?"',
    product: 'QuickBite support',
    youBuild: 'Answer from your docs, with sources, not guesses.',
    concepts: ['Embeddings', 'RAG', 'Prompts', 'Streaming'],
    status: 'foundations' as const,
  },
  {
    title: 'Pull fields out of messy text',
    scene: 'Support ticket or invoice paste in. Clean JSON out.',
    product: 'Ops / back office',
    youBuild: 'Structured output your code can trust and store.',
    concepts: ['Prompts', 'JSON schema', 'Validation'],
    status: 'building-blocks' as const,
  },
  {
    title: 'Bot that can check an order',
    scene: 'Chat is not enough. It must call getOrder and maybe startRefund.',
    product: 'QuickBite tools',
    youBuild: 'Tool calling: model picks a function, your app runs it.',
    concepts: ['Tool calling', 'Auth boundaries'],
    status: 'building-blocks' as const,
  },
  {
    title: 'Multi step support flow',
    scene: 'Find policy, check order, decide, hand off to human if unsure.',
    product: 'QuickBite agent',
    youBuild: 'A small loop (agent style). Stop when done. No magic autonomy.',
    concepts: ['Agents', 'LangGraph ideas'],
    status: 'agents' as const,
  },
  {
    title: 'Ship without silent breaks',
    scene: 'You change a prompt on Friday. Monday users get wrong refunds.',
    product: 'Any AI feature',
    youBuild: 'A tiny eval set so you catch regressions before users do.',
    concepts: ['Evals', 'Cost basics'],
    status: 'ship' as const,
  },
] as const
