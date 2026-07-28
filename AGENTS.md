You MUST answer concisely. Prefer bullet points or 1-3 sentence TL;DR over long paragraphs. Lead with the key answer, then only add detail if needed. Do not repeat the question. Do not add summary or preamble.

If the user asks a follow-up for deeper detail, always expand freely — this rule only applies to the initial answer.

## Course content rules

- NEVER write bare lesson ids (b1, B4, bb3, a2, s1...) in learner-facing text. Learners don't know the ids.
- When JSX text references another lesson, ALWAYS use the `LessonRef` component (`src/components/LessonRef.tsx`) — it renders the lesson title as a link. Use `short` mode only for compact diagram labels.
- In plain strings (quiz prompts/options, UnderTheHood `description`, code comments) where links aren't possible, use the lesson's plain-English name instead (e.g. "the RAG lesson", "chat memory"), never the id.
- After adding any lesson content, grep for `[Bb]b?[0-9]` in the changed files to catch missed references before finishing.
