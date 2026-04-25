import { useEffect, useState } from 'react'

const STORAGE_KEY = 'blu-pipeline-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch (e) {}
  return 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch (e) {}
  }, [theme])

  const toggleTheme = () => setThemeState(t => (t === 'dark' ? 'light' : 'dark'))
  const setTheme    = (t) => setThemeState(t === 'dark' ? 'dark' : 'light')

  return { theme, toggleTheme, setTheme }
}
