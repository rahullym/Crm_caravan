"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    )
  },
  {
    href: "/leads",
    label: "Leads",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    )
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    )
  },
  {
    href: "/reports",
    label: "Reports",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M18 20V10"/>
        <path d="M12 20V4"/>
        <path d="M6 20v-6"/>
      </svg>
    )
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
            <path d="M1 3h15v13H1z"/>
            <path d="M16 8h4l3 4v3h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5" fill="white" stroke="white"/>
            <circle cx="18.5" cy="18.5" r="2.5" fill="white" stroke="white"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">CaravanCRM</span>
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}

        {session?.user?.role === "ADMIN" && (
          <>
            <Link
              href="/settings/pipeline"
              className={`nav-item ${pathname.startsWith("/settings/pipeline") ? "active" : ""}`}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
              </svg>
              Pipeline Stages
            </Link>
            <Link
              href="/settings/users"
              className={`nav-item ${pathname.startsWith("/settings/users") ? "active" : ""}`}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              User Management
            </Link>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", marginBottom: "8px" }}>
          <div className="avatar-circle">
            {session?.user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
              {session?.user?.email?.split("@")[0] || "Admin"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "capitalize" }}>
              {session?.user?.role?.toLowerCase() || "Admin"}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item"
          style={{ width: "100%", border: "none", background: "none", cursor: "pointer", justifyContent: "flex-start", marginTop: "8px" }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
