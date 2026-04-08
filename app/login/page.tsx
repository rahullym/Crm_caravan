"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    if (res?.error) {
      setError("Invalid email or password. Please try again.")
    } else {
      router.push("/dashboard")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div style={{
            width: 44, height: 44, background: "var(--primary)", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <path d="M16 8h4l3 4v3h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5" fill="white" stroke="white"/>
              <circle cx="18.5" cy="18.5" r="2.5" fill="white" stroke="white"/>
            </svg>
          </div>
        </div>
        <div className="login-title">CaravanCRM</div>
        <div className="login-sub">Sign in to your account to continue</div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin@example.com"
            />
          </div>
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  )
}
