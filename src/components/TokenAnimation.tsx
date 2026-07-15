import { motion } from 'framer-motion'

export function TokenAnimation({ text, chunkSize = 4 }: { text: string; chunkSize?: number }) {
  const tokens: string[] = []
  for (let i = 0; i < text.length; i += chunkSize) {
    tokens.push(text.slice(i, i + chunkSize))
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-4 rounded-lg border border-zinc-700 bg-zinc-900/50 light:bg-white light:border-zinc-300">
      {tokens.map((tok, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.25 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08, duration: 0.25 }}
          className="px-2 py-1 rounded font-mono text-sm border border-zinc-700 bg-emerald-500/10 text-emerald-200 light:bg-emerald-100 light:border-emerald-300 light:text-emerald-800"
        >
          {tok}
        </motion.span>
      ))}
      <span className="text-[10px] text-zinc-600 self-end ml-2">
        ~{tokens.length} tokens (illustrative   real tokenizers use BPE)
      </span>
    </div>
  )
}