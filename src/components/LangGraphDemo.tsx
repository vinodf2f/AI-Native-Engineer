import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type GState = {
  messages: string[]
  orderVerified: boolean
  refundAmount: number | null
  decision: 'approved' | 'rejected' | null
  finalAnswer: string | null
}

const INITIAL: GState = {
  messages: ['user: I want a ₹2000 refund for QB-8821, right now!'],
  orderVerified: false,
  refundAmount: null,
  decision: null,
  finalAnswer: null,
}

type NodeId = 'agent' | 'tools' | 'human_approval' | 'END'

type Step = {
  node: NodeId
  note: string
  apply: (s: GState) => GState
  pauseForHuman?: boolean
}

const SCRIPT: Step[] = [
  {
    node: 'agent',
    note: 'think: no order data yet → call get_order',
    apply: (s) => ({ ...s, messages: [...s.messages, 'agent: tool_call get_order(QB-8821)'] }),
  },
  {
    node: 'tools',
    note: 'run get_order → order verified (₹420, wrong burger)',
    apply: (s) => ({
      ...s,
      orderVerified: true,
      messages: [...s.messages, 'tool: { found: true, total_inr: 420, issue: "wrong burger" }'],
    }),
  },
  {
    node: 'agent',
    note: 'think: user demands ₹2000 → try start_refund(2000)',
    apply: (s) => ({
      ...s,
      refundAmount: 2000,
      messages: [...s.messages, 'agent: tool_call start_refund(QB-8821, 2000)'],
    }),
  },
  // conditional edge fires here: amount > ₹500 → human_approval instead of tools
  {
    node: 'human_approval',
    note: '₹2000 > ₹500 cap → routed to human. The graph PAUSES; state sits in the checkpoint.',
    apply: (s) => s,
    pauseForHuman: true,
  },
]

const APPROVE_STEPS: Step[] = [
  {
    node: 'tools',
    note: 'human approved → refund executes',
    apply: (s) => ({
      ...s,
      decision: 'approved',
      messages: [...s.messages, 'tool: { ok: true, refund_id: "RF-8821-9910", amount_inr: 2000 }'],
    }),
  },
  {
    node: 'agent',
    note: 'think: done → final answer',
    apply: (s) => ({
      ...s,
      finalAnswer: 'Your ₹2000 refund for QB-8821 was approved by a human agent and is on its way.',
      messages: [...s.messages, 'agent: final answer'],
    }),
  },
]

const REJECT_STEPS: Step[] = [
  {
    node: 'agent',
    note: 'human rejected → skip refund, answer within policy',
    apply: (s) => ({
      ...s,
      decision: 'rejected',
      finalAnswer:
        'A human reviewed your request. ₹2000 is above our instant limit — I can offer a ₹500 refund or a coupon instead.',
      messages: [...s.messages, 'agent: final answer (refund declined)'],
    }),
  },
]

type Checkpoint = { id: number; node: NodeId; nextIdx: number; snapshot: GState }

const NODES: { id: NodeId; label: string; hint: string }[] = [
  { id: 'agent', label: 'agent (think)', hint: 'model call' },
  { id: 'tools', label: 'tools (act)', hint: 'your code' },
  { id: 'human_approval', label: 'human_approval', hint: 'pause for human' },
  { id: 'END', label: 'END', hint: 'stop' },
]

export function LangGraphDemo() {
  const [branch, setBranch] = useState<'none' | 'approved' | 'rejected'>('none')
  const steps = [...SCRIPT, ...(branch === 'approved' ? APPROVE_STEPS : branch === 'rejected' ? REJECT_STEPS : [])]

  const [stepIdx, setStepIdx] = useState(0)
  const [gstate, setGstate] = useState<GState>(INITIAL)
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [playing, setPlaying] = useState(true)
  const [awaitingHuman, setAwaitingHuman] = useState(false)
  const [cpCounter, setCpCounter] = useState(0)

  const done = stepIdx >= steps.length
  const activeNode: NodeId | null = done ? 'END' : awaitingHuman ? 'human_approval' : (steps[stepIdx]?.node ?? null)

  useEffect(() => {
    if (!playing || done || awaitingHuman) return
    const t = setTimeout(() => advance(), 2200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, stepIdx, awaitingHuman, branch])

  function advance() {
    const step = steps[stepIdx]
    if (!step) return
    const next = step.apply(gstate)
    setGstate(next)
    const id = cpCounter + 1
    setCpCounter(id)
    setCheckpoints((cps) => [...cps, { id, node: step.node, nextIdx: stepIdx + 1, snapshot: next }])
    setStepIdx(stepIdx + 1)
    if (step.pauseForHuman) {
      setAwaitingHuman(true)
      setPlaying(false)
    }
  }

  function decide(d: 'approved' | 'rejected') {
    setBranch(d)
    setAwaitingHuman(false)
    setPlaying(true)
  }

  function rewind(cp: Checkpoint) {
    // time travel: restore this checkpoint's state, drop everything after it
    setGstate(cp.snapshot)
    setStepIdx(cp.nextIdx)
    setCheckpoints((cps) => cps.filter((c) => c.id <= cp.id))
    if (cp.node !== 'human_approval' && branch !== 'none') {
      // rewound before the decision — clear it
      const approvalCp = checkpoints.find((c) => c.node === 'human_approval')
      if (approvalCp && cp.id < approvalCp.id) {
        setBranch('none')
        setAwaitingHuman(false)
      }
    }
    setPlaying(true)
  }

  function restart() {
    setBranch('none')
    setStepIdx(0)
    setGstate(INITIAL)
    setCheckpoints([])
    setCpCounter(0)
    setAwaitingHuman(false)
    setPlaying(true)
  }

  return (
    <div className="my-6 space-y-4">
      {/* graph */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        {NODES.map((n, i) => (
          <span key={n.id} className="flex items-center gap-2">
            <span
              className={`rounded border px-2 py-1 ${
                activeNode === n.id
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                  : 'border-zinc-700 text-zinc-400'
              }`}
              title={n.hint}
            >
              {n.label}
            </span>
            {i < NODES.length - 1 && <span className="text-zinc-600">→</span>}
          </span>
        ))}
        <span className="text-[10px] text-zinc-600 ml-2">cycle: tools → agent until no tool_calls</span>
      </div>

      {/* step log + state */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3 min-h-[180px]">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Run log</p>
          <div className="space-y-1.5">
            {checkpoints.map((cp) => (
              <p key={cp.id} className="text-[11px] text-zinc-400">
                <span className="text-emerald-400 font-mono">[{cp.node}]</span>{' '}
                {steps[cp.nextIdx - 1]?.note}
              </p>
            ))}
            {awaitingHuman && (
              <div className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 mt-2">
                <p className="text-[12px] text-amber-200 mb-2">
                  ⏸ Graph paused. Human review needed: refund ₹{gstate.refundAmount} for QB-8821?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => decide('approved')}
                    className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-[11px] text-white"
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decide('rejected')}
                    className="rounded bg-red-600 hover:bg-red-500 px-3 py-1 text-[11px] text-white"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            )}
            {done && (
              <p className="text-[12px] text-emerald-300 mt-2">
                END — final answer: “{gstate.finalAnswer}”
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">State (checkpointed between nodes)</p>
          <pre className="text-[11px] font-mono text-zinc-400 whitespace-pre-wrap overflow-x-auto max-h-48">
            {JSON.stringify(gstate, null, 2)}
          </pre>
        </div>
      </div>

      {/* checkpoints */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-3">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
          Checkpoints — click one to time-travel back
        </p>
        <div className="flex flex-wrap gap-1.5">
          {checkpoints.length === 0 && <span className="text-[11px] text-zinc-600">none yet</span>}
          {checkpoints.map((cp) => (
            <button
              key={cp.id}
              type="button"
              onClick={() => rewind(cp)}
              title="Restore this state and re-run from here"
              className="rounded border border-zinc-700 hover:border-emerald-600 px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-emerald-300"
            >
              cp-{cp.id} · {cp.node}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={awaitingHuman || done}
          className="rounded border border-zinc-700 px-3 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
        >
          {playing ? '⏸ pause' : '▶ play'}
        </button>
        <button
          type="button"
          onClick={restart}
          className="rounded border border-zinc-700 px-3 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
        >
          ↺ restart
        </button>
      </div>

      <AnimatePresence>
        {done && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[12px] text-zinc-500"
          >
            What you just used: <strong className="text-zinc-300">checkpointing</strong> (a snapshot after
            every node), <strong className="text-zinc-300">human-in-the-loop</strong> (the run paused for
            your decision), and <strong className="text-zinc-300">time travel</strong> (click any checkpoint
            above and re-run from it — try approving instead of rejecting).
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
