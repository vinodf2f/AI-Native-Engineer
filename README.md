# AI Concept Map

Interactive AI-engineering course — learn by running real OpenAI API calls, not watching videos.

**Live:** [ai-concept-map-ten.vercel.app](https://ai-concept-map-ten.vercel.app)
**Repo:** [github.com/vinodf2f/ai-concept-map](https://github.com/vinodf2f/ai-concept-map)

## What this is

A self-paced, interactive course that teaches you how to build production AI features — one concept at a time. Every lesson follows the same pattern: **learn (animated)** → **try live (real OpenAI call)** → **under the hood (real code)** → **checkpoint quiz**.

No mocks. Every demo makes a real API call. You see real tokens, real cost, real model behavior.

## Stack

Vite · React · TypeScript · TanStack Router · TanStack Query · Tailwind CSS · Framer Motion · OpenAI API

## Run locally

```bash
git clone https://github.com/vinodf2f/ai-concept-map.git
cd ai-concept-map
npm install
npm run dev          # http://localhost:5173
```

## First-time setup

1. Get a pay-as-you-go OpenAI API key at [platform.openai.com](https://platform.openai.com) (~$5 credit lasts weeks for this course).
2. Open the site → **Settings** → paste your key.
3. Your key is stored **only in your browser's localStorage**. It never goes to any server except OpenAI's API. No backend, no database, no telemetry.

## Concepts covered

### Basics
1. **LLM Mental Model** — tokens, context window, system/user/assistant roles, real completion call
2. **Embeddings** — meaning as coordinates, cosine similarity from scratch, live vector comparison
3. **Vector Databases** — pgvector, ANN indexes, in-browser vector store demo
4. **RAG Pipeline** — chunking strategies, grounded answers with citations, live IRCTC demo
5. **Prompt Engineering** — system prompts, few-shot, structured JSON output, live prompt lab
6. **Streaming + UI** — SSE token streaming, AbortController cancel, live streaming demo
7. **Evaluation** — keyword + semantic scoring, eval suites, regression detection

### Generative AI (in progress)
8. Sentiment Analysis · 9. Summarisation · 10. Translation · 11. Image Generation · 12. Function Calling

## Project structure

```
src/
  routes/
    __root.tsx                  # Router root
    _course.tsx                 # Layout: sidebar, theme toggle, mobile drawer
    _course/
      index.tsx                 # Home (concept map + animated RAG flow)
      settings.tsx              # API key + model settings
      concept/
        b1-b7.tsx               # Basics concept pages
  components/                   # Reusable UI (Quiz, Callout, demos, CodeBlock)
  services/                     # API layer (openai, embeddings, vectorStore, rag, streaming, eval)
  hooks/                        # TanStack Query wrappers
  lib/                          # storage, theme, concepts
```

## What you learn by building this

- TanStack Router file-based routing with type-safe routes
- TanStack Query for live API calls (loading / error / cache states)
- Real OpenAI API usage: chat completions, embeddings, streaming, cost literacy
- localStorage for offline settings & progress tracking
- Dark/light theme with CSS variables + Tailwind
- Mobile-first responsive design with slide-in drawer

## License

MIT — fork it, teach with it, build your own course.