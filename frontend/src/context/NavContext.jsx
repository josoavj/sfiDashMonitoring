import React, { createContext, useContext, useState } from 'react'

const NavContext = createContext(null)

export function NavProvider({ children }) {
  const [subItemActive, setSubItemActive] = useState({ title: 'Monitoring des services actifs', page: 'service' })
  return <NavContext.Provider value={{ subItemActive, setSubItemActive }}>{children}</NavContext.Provider>
}

export function useNav() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used within NavProvider')
  return ctx
}

export default NavContext
