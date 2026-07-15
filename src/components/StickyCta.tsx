import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'

export function StickyCta({ to, label }: { to: string; label: string }) {
  const heroRef = useRef<HTMLDivElement>(null)
  const [floating, setFloating] = useState(false)

  useEffect(() => {
    if (!heroRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setFloating(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' },
    )
    observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* In-flow button (hero) */}
      <div ref={heroRef} className="mt-5 flex flex-wrap gap-3">
        <Link
          to={to as any}
          className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-[13px] font-medium text-white transition-colors"
        >
          {label}
        </Link>
      </div>

      {/* Floating pill (appears after hero scrolls out) */}
      <AnimatePresence>
        {floating && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-5 right-5 z-50"
          >
            <Link
              to={to as any}
              className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-[13px] font-medium text-white shadow-lg shadow-emerald-600/20 transition-colors"
            >
              {label}
              <span className="text-emerald-300">↗</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}