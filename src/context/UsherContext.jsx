import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'tableserve_usher'

const UsherContext = createContext(null)

export function UsherProvider({ children }) {
  // Lazy init reads from sessionStorage so refresh doesn't logout usher
  const [usher, setUsher] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  function loginUsher(usherData) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usherData))
    setUsher(usherData)
  }

  function logoutUsher() {
    sessionStorage.removeItem(STORAGE_KEY)
    setUsher(null)
  }

  return (
    <UsherContext.Provider value={{ usher, loginUsher, logoutUsher }}>
      {children}
    </UsherContext.Provider>
  )
}

export function useUsher() {
  const ctx = useContext(UsherContext)
  if (!ctx) throw new Error('useUsher must be used within UsherProvider')
  return ctx
}
