import { useState } from 'react'
import { CodeBlock } from './UnderTheHood'

type Row = {
  concept: string
  yours: string
  graph: string
  note: string
}

const ROWS: Row[] = [
  {
    concept: 'State',
    yours: 'const messages = [...]',
    graph: 'StateGraph state schema',
    note: 'Your transcript array, typed. The graph passes one state object between steps instead of a closure variable.',
  },
  {
    concept: 'Node',
    yours: 'one iteration body (model call, tool run)',
    graph: "graph.addNode('agent', fn)",
    note: 'A function that takes state and returns updated state. Your loop body is two nodes: call the model, run tools.',
  },
  {
    concept: 'Edge',
    yours: 'the fixed order inside an iteration',
    graph: "addEdge('agent', 'tools')",
    note: 'Fixed flow: after the model step always comes the tool step. Same as your sequential lines of code.',
  },
  {
    concept: 'Conditional edge',
    yours: 'if (tool_calls.length === 0) stop else loop',
    graph: "addConditionalEdges('agent', shouldContinue)",
    note: 'The only interesting branch in any agent: did the model ask for a tool? Your if statement, named.',
  },
  {
    concept: 'Cycle',
    yours: 'the while loop itself',
    graph: "addEdge('tools', 'agent') — back edge",
    note: 'The edge that goes BACK to the model node. A graph with a back edge = your while loop. That is the whole trick.',
  },
  {
    concept: 'Stop',
    yours: 'no tool_calls, or maxSteps',
    graph: 'END node / recursion_limit',
    note: 'Every framework has the same two exits: model finished, or step budget ran out.',
  },
]

type Dialect = 'yours' | 'langgraph' | 'sdk'

const DIALECTS: { id: Dialect; label: string; code: string; hide: string }[] = [
  {
    id: 'yours',
    label: 'Your loop (hand-built)',
    hide: 'Nothing is hidden. Every call, every message, every rupee is in front of you.',
    code: `for (let i = 0; i < maxSteps; i++) {
  const res = await chat({ messages, tools })
  if (!res.tool_calls?.length) return res.content   // stop
  messages.push(assistantMsg(res))
  for (const call of res.tool_calls) {
    const result = executeTool(call)                 // your code, your rules
    messages.push(toolMsg(call.id, result))
  }
}
throw new Error('max steps')`,
  },
  {
    id: 'langgraph',
    label: 'LangGraph',
    hide: 'The loop hides in graph.compile() + invoke(). Find addConditionalEdges to see the stop rule.',
    code: `const graph = new StateGraph(AgentState)
  .addNode('agent', callModel)        // think
  .addNode('tools', runTools)         // act
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('tools', 'agent')          // the cycle = your while loop
  .compile()

await graph.invoke({ messages: [input] }, { recursionLimit: 5 })`,
  },
  {
    id: 'sdk',
    label: 'Agents SDK style',
    hide: 'The loop hides inside runner.run(). You only declare tools and a stop condition.',
    code: `const agent = new Agent({
  instructions: 'You are QuickBite support...',
  tools: [getOrder, checkPolicy, startRefund],
})

// the same think → tool → observe loop runs inside:
const result = await runner.run(agent, userMessage, { maxTurns: 5 })`,
  },
]

export function AgentMapDemo() {
  const [activeRow, setActiveRow] = useState('State')
  const [dialect, setDialect] = useState<Dialect>('yours')

  const row = ROWS.find((r) => r.concept === activeRow) ?? ROWS[0]
  const d = DIALECTS.find((x) => x.id === dialect) ?? DIALECTS[0]

  return (
    <div className="my-6 space-y-6">
      <div>
        <p className="text-[12px] text-zinc-500 mb-2">Click a concept — your hand-built loop on the left, LangGraph vocabulary on the right:</p>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1.5 text-[12px]">
          <div />
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 px-2">Your loop</p>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 px-2">LangGraph</p>
          {ROWS.map((r) => (
            <button key={r.concept} type="button" onClick={() => setActiveRow(r.concept)} className="contents group text-left">
              <span className={`px-2 py-2 text-[11px] font-medium rounded-l border-y border-l ${activeRow === r.concept ? 'border-emerald-600 text-emerald-300 bg-emerald-600/5' : 'border-zinc-800 text-zinc-500 group-hover:text-zinc-300'}`}>
                {r.concept}
              </span>
              <span className={`px-2 py-2 font-mono text-[11px] border-y ${activeRow === r.concept ? 'border-emerald-600 text-sky-300 bg-emerald-600/5' : 'border-zinc-800 text-zinc-400 group-hover:text-zinc-200'}`}>
                {r.yours}
              </span>
              <span className={`px-2 py-2 font-mono text-[11px] rounded-r border-y border-r ${activeRow === r.concept ? 'border-emerald-600 text-amber-300 bg-emerald-600/5' : 'border-zinc-800 text-zinc-400 group-hover:text-zinc-200'}`}>
                {r.graph}
              </span>
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 mt-2">
          <p className="text-[11px] font-medium text-zinc-400 mb-1">{row.concept}</p>
          <p className="text-[12px] text-zinc-300">{row.note}</p>
        </div>
      </div>

      <div>
        <p className="text-[12px] text-zinc-500 mb-2">The same agent in three dialects. Spot the loop in each:</p>
        <div className="flex gap-1.5 mb-2">
          {DIALECTS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setDialect(x.id)}
              className={`rounded border px-2 py-1 text-[11px] transition-colors ${dialect === x.id ? 'border-emerald-600 bg-emerald-600/10 text-emerald-300' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <CodeBlock code={d.code} language="tsx" />
        <p className="text-[12px] text-zinc-400 mt-2">
          <strong className="text-zinc-200">Where the loop hides:</strong> {d.hide}
        </p>
      </div>
    </div>
  )
}
