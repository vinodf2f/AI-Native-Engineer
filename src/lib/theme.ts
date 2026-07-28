import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'light'

const THEME_KEY = 'ai-course:theme'

export function getStoredTheme(): Theme {
  const t = localStorage.getItem(THEME_KEY)
  if (t === 'light' || t === 'dark') return t
  return 'dark' // default theme; user's explicit toggle still wins via storage
}

export function storeTheme(t: Theme) {
  localStorage.setItem(THEME_KEY, t)
}

export function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
}

export function initTheme() {
  applyTheme(getStoredTheme())
}

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const next = document.documentElement.getAttribute('data-theme') as Theme | null
      if (next === 'dark' || next === 'light') setTheme(next)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return theme
}