# ai-course

Interactive AI-engineering course site. Built with **Vite + React + TypeScript + TanStack Router + TanStack Query + Tailwind + Framer Motion**.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

## First-time setup

1. Go to **Settings** → paste your OpenAI API key (pay-as-you-go from platform.openai.com).
2. Open **B1 · LLM Mental Model** → try the live completion demo (real OpenAI call, costs pennies).

## Structure

```
src/
  routes/
    __root.tsx              # Router root
    _course.tsx             # Layout: sidebar + progress tracker
    _course/
      index.tsx             # Home (concept list)
      settings.tsx          # API key + default model
      concept/
        b1.tsx              # LLM Mental Model (real completion demo)
        b2-b7.tsx           # Placeholder pages
  components/
    Callout, TokenAnimation, Quiz, CompletionDemo, ConceptNav
  lib/
    concepts.ts             # Phase B concept list
    storage.ts              # localStorage helpers (settings + progress)
```

## What you learn by building/using this

- ⚡ TanStack Router file-based routing with type-safe routes
- ⚡ TanStack Query for live API calls (loading/error/cache states)
- ⚡ Real OpenAI chat completion API usage + token/cost literacy
- ⚡ localStorage for offline settings & progress

Each concept page: **Learn (animated)** → **Try live (real API)** → **Checkpoint quiz** → **Mark complete**.
```