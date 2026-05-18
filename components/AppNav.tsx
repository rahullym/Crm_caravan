"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"
import MobileTabBar from "./MobileTabBar"

export default function AppNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the menu drawer on every navigation
  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <MobileTabBar onMenuOpen={() => setMenuOpen(true)} />
    </>
  )
}
