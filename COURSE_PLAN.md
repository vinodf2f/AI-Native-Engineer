# AI Native Engineer — Plan

**Brand:** AI Native Engineer  
**Tagline:** AI for product builders  
**Promise (UI):** Interactive course for engineers who ship apps. You build the pieces yourself with live API calls, see real cost, and get a clear picture of how AI features work.

Basics first. No mastery claims. No long em dashes in learner copy. Simple English. Indian context. QuickBite as one world. Real API demos.

---

## Who this is for

- Frontend / full-stack / product engineers
- People who ship apps and want to know when/how AI helps
- People who may never own an “AI project” at work, but still hear these words every week

Not for: training models, research papers, becoming an LLM engineer.

---

## Demo setup (decision)

**Browser-only for the whole course (for now).**

Why this is better for our audience:

1. One OpenAI key in Settings — no Node, Docker, or deploy to learn
2. Tool calling and structured output work fine from the browser
3. “Agent” ideas can be taught with small TypeScript loops + clear diagrams
4. Matches how most engineers first try OpenAI

When we *might* add a tiny backend later:

- Real LangGraph package demos that need server process
- Showing the production pattern: browser → your API → OpenAI (keys never in the client)

Until then: teach the production pattern with diagrams + code samples; run learning demos in the browser.

---

## Running example (same world, every section)

**QuickBite** — a food delivery support product (Zomato / Swiggy style).

| Piece | Example |
|-------|---------|
| User problem | “Order late”, “wrong item”, “refund kab aayega”, “cancel order” |
| Docs | Refund policy, delivery SLA, restaurant closed rules |
| Tools | `getOrderStatus`, `startRefund`, `searchPolicy`, `escalateToHuman` |
| Agent | Support bot that retrieves policy → calls tools → hands off when unsure |
| Eval | Fixed questions with golden answers (refund window, 30 min late rule, refuse cooking questions) |

Why one world: when they learn embeddings on “refund”, then RAG on the same policy, then tools on the same order — concepts stick.

**Note:** Foundations lessons (B1–B8) still use IRCTC in some demos. Build step 2 switches those to QuickBite so the whole course is one story.

---

## Voice rules

- No “Phase A/B/C”
- No hype words without a plain meaning next to them
- Prefer: “tool call”, “retrieve docs”, “check the answer” over “agentic orchestration”
- Developer language: functions, APIs, state, tests, cost, latency
- Show: how real products use this + where *you* might add it to an existing app

---

## Course sections (not phases)

### 0. AI words (short, separate)

Industry lines decoded in plain English. Read anytime. Not a quiz track.

Examples: RAG, agents, embeddings, vector DB, hallucination, fine-tuning vs RAG, context window, tokens, LangChain, LangGraph, MCP, multimodal, evals, grounded answer, tool calling, system prompt.

### 1. Foundations (ready today)

How the pieces work. Hand-built, real OpenAI calls.

| ID | Lesson | Status |
|----|--------|--------|
| b1 | How models work | ready |
| b2 | Embeddings | ready |
| b3 | Vector stores | ready |
| b4 | RAG (answer from your docs) | ready |
| b5 | Prompts that behave | ready |
| b6 | Streaming in the UI | ready |
| b7 | Testing AI output | ready |
| b8 | Put it together | ready |

### 2. Building blocks of AI products

What most product engineers actually ship.

| ID | Lesson | Status |
|----|--------|--------|
| bb1 | Tool calling (model picks a function) | soon |
| bb2 | Structured JSON you can trust | soon |
| bb3 | Chat memory (multi-turn) | soon |
| bb4 | Keys, proxy, cost (how real apps wire AI) | soon |
| bb5 | LangChain without the magic | soon |

### 3. Agents (when one call is not enough)

| ID | Lesson | Status |
|----|--------|--------|
| a1 | What an agent actually is | soon |
| a2 | Build a small agent by hand | soon |
| a3 | LangGraph ideas (state, steps, loops) | soon |
| a4 | QuickBite support agent | soon |

### 4. Ship it (make it safe enough for users)

| ID | Lesson | Status |
|----|--------|--------|
| s1 | Catch breaks before users do | soon |
| s2 | Cost, speed, logs | soon |
| s3 | Where AI fits in *your* app | soon |

---

## Build steps (how we ship the course)

### Step 1 — Structure (this PR / session)

- [x] This plan file
- [x] Clear home page (what / who / how / sections)
- [x] Full syllabus in nav + home
- [x] AI words section (real content)
- [x] Placeholder pages for upcoming lessons
- [x] Remove Phase / GenAI / Agentic marketing language
- [x] Sidebar shows ready vs soon

### Step 2 — One story + polish Foundations

- Switch demos/examples from IRCTC → QuickBite where it helps
- Align lesson titles/headers with section names
- Home “where this shows up in real apps” boxes
- Small visual upgrades (flow diagrams) on Foundations

### Step 3 — Building blocks (bb1–bb5)

Order of implementation:

1. **bb1 Tool calling** — highest value next
2. **bb2 Structured JSON** — Zod / schema / retry
3. **bb4 Keys & proxy** — so “production” is honest
4. **bb3 Memory**
5. **bb5 LangChain map** — side-by-side with hand-rolled RAG

### Step 4 — Agents (a1–a4)

1. Mental model (loop + tools + stop)
2. Hand-rolled agent in TS
3. LangGraph concepts (diagrams + small state machine)
4. Full QuickBite support flow

### Step 5 — Ship it (s1–s3)

Evals in CI mindset, cost/latency, “add AI to an existing app” playbook.

---

## Homepage goals (short)

In a few screens, answer:

1. What is this?
2. Who is it for?
3. How do lessons work? (read → try live → code → check)
4. What sections exist?
5. What running example do we use?
6. Start button + API key note

No long carousels of unbuilt “interview projects.”

---

## Success bar

After the full course, a mid-level engineer should be able to:

- Explain tokens, RAG, tools, agents without buzzword fog
- Add a grounded FAQ or extraction feature to an existing app
- Know when *not* to use an agent
- Read a LangChain/LangGraph snippet and map it to plain code
- Talk about cost, evals, and key safety in a design review
