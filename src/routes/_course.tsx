import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CONCEPT_GROUPS, READY_CONCEPTS } from '../lib/concepts'
import { loadProgress, hasAnyApiKey, subscribe, type ConceptStatus } from '../lib/storage'
import { getStoredTheme, storeTheme, applyTheme, type Theme } from '../lib/theme'
import {
  LessonStickyBar,
  MobileLessonTitle,
  useLessonFromPath,
} from '../components/LessonStickyHeader'

export const Route = createFileRoute('/_course')({
  component: CourseLayout,
})

function CourseLayout() {
  const [progress, setProgress] = useState<Record<string, ConceptStatus>>(loadProgress)
  const [hasKey, setHasKey] = useState(hasAnyApiKey())
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const routerState = useRouterState()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const unsub = subscribe(() => {
      setProgress(loadProgress())
      setHasKey(hasAnyApiKey())
    })
    return unsub
  }, [])

  useEffect(() => setHasKey(hasAnyApiKey()), [routerState.location.pathname])

  useEffect(() => {
    setSidebarOpen(false)
  }, [routerState.location.pathname])

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [routerState.location.pathname])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    storeTheme(next)
  }

  const total = READY_CONCEPTS.length
  const done = READY_CONCEPTS.filter((c) => progress[c.id] === 'complete').length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  const { lesson, prev, next } = useLessonFromPath(routerState.location.pathname)
  const onLesson = Boolean(lesson)

  return (
    <div className="flex h-full">
      {/* Mobile app bar — brand or compact lesson */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-3 h-12 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-zinc-300 text-xl shrink-0 w-9 text-left"
          aria-label="Open menu"
        >
          ☰
        </button>
        <MobileLessonTitle lesson={lesson} />
        <button
          onClick={toggleTheme}
          className="text-zinc-300 text-base shrink-0 w-9 text-right"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <aside className="hidden md:flex w-64 shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex-col">
        <SidebarContent
          done={done}
          total={total}
          pct={pct}
          progress={progress}
          hasKey={hasKey}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 border-r border-zinc-800 bg-zinc-900 flex flex-col"
            >
              <SidebarContent
                done={done}
                total={total}
                pct={pct}
                progress={progress}
                hasKey={hasKey}
                theme={theme}
                onToggleTheme={toggleTheme}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main ref={mainRef} className="flex-1 overflow-y-auto scrollbar-thin pt-12 md:pt-0">
        {onLesson && lesson && <LessonStickyBar lesson={lesson} prev={prev} next={next} />}
        <Outlet />
      </main>
    </div>
  )
}

function SidebarContent({
  done,
  total,
  pct,
  progress,
  hasKey,
  theme,
  onToggleTheme,
  onClose,
}: {
  done: number
  total: number
  pct: number
  progress: Record<string, ConceptStatus>
  hasKey: boolean
  theme: Theme
  onToggleTheme: () => void
  onClose?: () => void
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    words: true,
    foundations: true,
    'building-blocks': true,
    agents: false,
    ship: false,
  })

  function toggleGroup(id: string) {
    setOpenGroups((g) => ({ ...g, [id]: !g[id] }))
  }

  return (
    <>
      <div className="p-4 border-b border-zinc-800 flex items-start justify-between">
        <div>
          <Link to="/" className="text-base font-bold text-zinc-100 tracking-tight hover:text-white">
            AI Native Engineer
          </Link>
          <p className="text-[11px] text-zinc-500 mt-0.5">AI for product builders</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTheme}
            className="rounded border border-zinc-700 hover:border-zinc-500 px-2 py-1 text-[11px] text-zinc-400"
            aria-label="Toggle theme"
            title="Toggle dark / light"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden rounded border border-zinc-700 hover:border-zinc-500 px-2 py-1 text-[11px] text-zinc-400"
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-zinc-500">Foundations progress</span>
          <span className="text-[11px] text-zinc-400">
            {done}/{total}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <SectionItem id="home" title="Home" to="/" />
        <SectionItem
          id="settings"
          title="Settings"
          to="/settings"
          indicator={hasKey ? undefined : 'no-key'}
        />

        {CONCEPT_GROUPS.map((group) => (
          <div key={group.id} className="pt-3 mt-1 border-t border-zinc-800/60">
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-2 py-1 text-[12px] font-semibold uppercase tracking-wider text-zinc-300 hover:text-zinc-100"
            >
              <span>{group.title}</span>
              <motion.span
                animate={{ rotate: openGroups[group.id] ? 90 : 0 }}
                className="text-zinc-500"
              >
                ▸
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {openGroups[group.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="pl-3 mt-1 border-l border-zinc-800/60 ml-2 space-y-0.5">
                    {group.specialPath && (
                      <SectionItem id={`${group.id}-page`} title="Open glossary" to={group.specialPath} />
                    )}
                    {group.items.map((c) => (
                      <SectionItem
                        key={c.id}
                        id={c.id}
                        title={c.title}
                        to={`/concept/${c.id}`}
                        indicator={
                          c.availability === 'soon'
                            ? 'soon'
                            : (progress[c.id] ?? 'not-started')
                        }
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>
    </>
  )
}

function SectionItem({
  title,
  to,
  indicator,
}: {
  id: string
  title: string
  to: string
  indicator?: string
}) {
  return (
    <Link
      to={to as any}
      className="flex items-center justify-between gap-1 rounded px-2 py-1.5 text-[12px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
      activeProps={{ className: 'bg-zinc-800 text-zinc-100' }}
      activeOptions={{ exact: to === '/' }}
    >
      <span className="leading-snug">{title}</span>
      {indicator === 'complete' && <span className="text-emerald-500 text-xs shrink-0">●</span>}
      {indicator === 'in-progress' && <span className="text-amber-500 text-xs shrink-0">●</span>}
      {indicator === 'no-key' && <span className="text-red-500 text-xs shrink-0">⚠</span>}
      {indicator === 'soon' && (
        <span className="text-[9px] text-zinc-600 shrink-0 uppercase">soon</span>
      )}
    </Link>
  )
}
