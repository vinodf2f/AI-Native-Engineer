import { type ReactNode } from 'react'

export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 px-5 py-4 my-6 light:border-sky-600/40 light:bg-sky-50">
      {title && (
        <div className="text-[13px] font-semibold text-sky-300 mb-1 light:text-sky-700">
          {title}
        </div>
      )}
      <div className="text-[13px] text-sky-200/80 light:text-sky-900/80">
        {children}
      </div>
    </div>
  )
}