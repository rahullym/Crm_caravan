"use client"

import { useState } from "react"
import { createUser } from "@/app/actions/user"

export default function AddUserForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const result = await createUser(formData)

    if (!result.success) {
      setError(result.error as string)
    } else {
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
      setTimeout(() => setSuccess(false), 4000)
    }

    setIsPending(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Add New User</div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Feedback */}
        {error && (
          <div style={{
            fontSize: 13, color: "#DC2626", background: "#FEF2F2",
            border: "1px solid #FCA5A5", padding: "10px 12px", borderRadius: 8, lineHeight: 1.5
          }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{
            fontSize: 13, color: "#059669", background: "#F0FDF4",
            border: "1px solid #6EE7B7", padding: "10px 12px", borderRadius: 8, lineHeight: 1.5
          }}>
            ✓ User created successfully!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
            Email Address
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="user@example.com"
            className="input-field"
            disabled={isPending}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            placeholder="Min. 6 characters"
            className="input-field"
            disabled={isPending}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
            Role
          </label>
          <select name="role" required className="input-field" disabled={isPending}>
            <option value="SALES">Sales</option>
            <option value="SERVICE_MANAGER">Service Manager</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
          style={{
            opacity: isPending ? 0.7 : 1,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Creating…
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create User
            </span>
          )}
        </button>

        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: -4 }}>
          New users can log in immediately after creation.
        </p>

      </form>
    </div>
  )
}
