import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Highlight, themes } from 'prism-react-renderer'

export function UnderTheHood({
  title,
  description,
  code,
  language = 'tsx',
}: {
  title: string
  description?: string
  code: string
  language?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="my-8 rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-zinc-600 uppercase">{language}</span>
          <span className="text-[13px] font-medium text-zinc-300">{title}</span>
        </div>
        <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-zinc-500 text-sm">
          ▸
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-800 px-4 py-3">
              {description && <p className="text-[12px] text-zinc-500 mb-3 leading-relaxed">{description}</p>}
              <CodeBlock code={code} language={language} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function CodeBlock({ code, language = 'tsx' }: { code: string; language?: string }) {
  return (
    <Highlight theme={themes.vsDark} code={code.trim()} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} rounded-md border border-zinc-800 p-3 overflow-x-auto scrollbar-thin text-[11.5px] leading-relaxed font-mono`}
          style={{ ...style, background: '#09090b', margin: 0 }}
        >
          {tokens.map((line, i) => {
            const lineProps = getLineProps({ line })
            return (
              <div key={i} {...lineProps} style={{ ...lineProps.style, display: 'table-row' }}>
                <span
                  style={{
                    display: 'table-cell',
                    paddingRight: '12px',
                    textAlign: 'right',
                    userSelect: 'none',
                    opacity: 0.35,
                    minWidth: '2em',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ display: 'table-cell' }}>
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token })
                    return <span key={key} {...tokenProps} />
                  })}
                </span>
              </div>
            )
          })}
        </pre>
      )}
    </Highlight>
  )
}