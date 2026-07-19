import type { ConceptMeta, SectionId } from './storage'

/** Flat lesson list in learning order. */
export const CONCEPTS: ConceptMeta[] = [
  // Foundations (ready)
  {
    id: 'b1',
    title: 'How models work',
    section: 'foundations',
    status: 'not-started',
    availability: 'ready',
    blurb: 'Tokens, context window, roles, cost',
  },
  {
    id: 'b2',
    title: 'Embeddings',
    section: 'foundations',
    status: 'not-started',
    availability: 'ready',
    blurb: 'Meaning as numbers, cosine similarity',
  },
  {
    id: 'b3',
    title: 'Vector stores',
    section: 'foundations',
    status: 'not-started',
    availability: 'ready',
    blurb: 'Search by meaning, not exact words',
  },
  {
    id: 'b4',
    title: 'RAG — answer from your docs',
    section: 'foundations',
    status: 'not-started',
    availability: 'ready',
    blurb: 'Chunk, retrieve, ground the answer',
  },
  {
    id: 'b5',
    title: 'Prompts that behave',
    section: 'foundations',
    status: 'not-started',
    availability: 'ready',
    blurb: 'System prompts, few-shot, JSON shape',
  },
  {
    id: 'b6',
    title: 'Streaming in the UI',
    section: 'foundations',
    status: 'not-started',
    availability: 'ready',
    blurb: 'Token stream, cancel, feel of speed',
  },
  {
    id: 'b7',
    title: 'Testing AI output',
    section: 'foundations',
    status: 'not-started',
    availability: 'ready',
    blurb: 'Golden answers, keyword + meaning scores',
  },
  {
    id: 'b8',
    title: 'Put it together',
    section: 'foundations',
    status: 'not-started',
    availability: 'ready',
    blurb: 'One flow: docs → answer → stream',
  },

  // Building blocks
  {
    id: 'bb1',
    title: 'Tool calling',
    section: 'building-blocks',
    status: 'not-started',
    availability: 'soon',
    blurb: 'Model picks a function your app runs',
  },
  {
    id: 'bb2',
    title: 'Structured JSON you can trust',
    section: 'building-blocks',
    status: 'not-started',
    availability: 'soon',
    blurb: 'Schema, validate, retry on bad output',
  },
  {
    id: 'bb3',
    title: 'Chat memory',
    section: 'building-blocks',
    status: 'not-started',
    availability: 'soon',
    blurb: 'Multi-turn history without blowing context',
  },
  {
    id: 'bb4',
    title: 'Keys, proxy, cost',
    section: 'building-blocks',
    status: 'not-started',
    availability: 'soon',
    blurb: 'How real apps wire AI safely',
  },
  {
    id: 'bb5',
    title: 'LangChain without the magic',
    section: 'building-blocks',
    status: 'not-started',
    availability: 'soon',
    blurb: 'Map your hand-built RAG to the library',
  },

  // Agents
  {
    id: 'a1',
    title: 'What an agent actually is',
    section: 'agents',
    status: 'not-started',
    availability: 'soon',
    blurb: 'Loop + tools + stop condition',
  },
  {
    id: 'a2',
    title: 'Build a small agent by hand',
    section: 'agents',
    status: 'not-started',
    availability: 'soon',
    blurb: 'Think → call tool → observe, in plain TS',
  },
  {
    id: 'a3',
    title: 'LangGraph ideas',
    section: 'agents',
    status: 'not-started',
    availability: 'soon',
    blurb: 'State, steps, branches, loops',
  },
  {
    id: 'a4',
    title: 'QuickBite support agent',
    section: 'agents',
    status: 'not-started',
    availability: 'soon',
    blurb: 'Policy + tools + handoff to human',
  },

  // Ship it
  {
    id: 's1',
    title: 'Catch breaks before users do',
    section: 'ship',
    status: 'not-started',
    availability: 'soon',
    blurb: 'Eval mindset when you change a prompt',
  },
  {
    id: 's2',
    title: 'Cost, speed, logs',
    section: 'ship',
    status: 'not-started',
    availability: 'soon',
    blurb: 'What to measure in a real product',
  },
  {
    id: 's3',
    title: 'Where AI fits in your app',
    section: 'ship',
    status: 'not-started',
    availability: 'soon',
    blurb: 'Add AI only where it earns its place',
  },
]

export type ConceptGroup = {
  id: SectionId | 'words'
  title: string
  /** Short line under the section title in the sidebar / home */
  desc: string
  items: ConceptMeta[]
  /** Special page (not a concept id), e.g. /words */
  specialPath?: string
}

export const SECTION_META: Record<
  SectionId,
  { title: string; desc: string }
> = {
  words: {
    title: 'AI words',
    desc: 'Industry lines, plain English',
  },
  foundations: {
    title: 'Foundations',
    desc: 'How the pieces work — real API calls',
  },
  'building-blocks': {
    title: 'Building blocks',
    desc: 'What product apps actually ship',
  },
  agents: {
    title: 'Agents',
    desc: 'When one model call is not enough',
  },
  ship: {
    title: 'Ship it',
    desc: 'Safe enough for real users',
  },
}

export const CONCEPT_GROUPS: ConceptGroup[] = [
  {
    id: 'words',
    title: SECTION_META.words.title,
    desc: SECTION_META.words.desc,
    items: [],
    specialPath: '/words',
  },
  {
    id: 'foundations',
    title: SECTION_META.foundations.title,
    desc: SECTION_META.foundations.desc,
    items: CONCEPTS.filter((c) => c.section === 'foundations'),
  },
  {
    id: 'building-blocks',
    title: SECTION_META['building-blocks'].title,
    desc: SECTION_META['building-blocks'].desc,
    items: CONCEPTS.filter((c) => c.section === 'building-blocks'),
  },
  {
    id: 'agents',
    title: SECTION_META.agents.title,
    desc: SECTION_META.agents.desc,
    items: CONCEPTS.filter((c) => c.section === 'agents'),
  },
  {
    id: 'ship',
    title: SECTION_META.ship.title,
    desc: SECTION_META.ship.desc,
    items: CONCEPTS.filter((c) => c.section === 'ship'),
  },
]

/** Lessons that count toward progress (have real content). */
export const READY_CONCEPTS = CONCEPTS.filter((c) => c.availability === 'ready')

export function getLesson(id: string): ConceptMeta | undefined {
  return CONCEPTS.find((c) => c.id === id)
}

export function getNeighbors(id: string): {
  prev: ConceptMeta | null
  next: ConceptMeta | null
} {
  const idx = CONCEPTS.findIndex((c) => c.id === id)
  if (idx < 0) return { prev: null, next: null }
  return {
    prev: idx > 0 ? CONCEPTS[idx - 1] : null,
    next: idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : null,
  }
}

export function sectionLabel(section: SectionId): string {
  return SECTION_META[section]?.title ?? section
}

/** Running product world used across the course. */
export const RUNNING_EXAMPLE = {
  name: 'QuickBite',
  tagline: 'Food delivery support (Zomato / Swiggy style)',
  problems: [
    'Order is late',
    'Wrong item delivered',
    'Refund kab aayega?',
    'Cancel order',
  ],
  note: 'Same world across sections so concepts connect.',
}
