"use client"

import { useState } from "react"
import { updateUser } from "@/app/actions/user"

type User = { id: string; email: string; role: string }

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "SALES", label: "Sales" },
  { value: "SERVICE_MANAGER", label: "Service Manager" },
  { value: "TECHNICIAN", label: "Technician" },
]

export default function EditUserModal({ user, isYou }: { user: User; isYou: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const result = await updateUser(user.id, new FormData(event.currentTarget))
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? "Failed to update user.")
      return
    }
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Edit user"
        aria-label="Edit user"
        className="icon-btn"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>

      {open && (
        <div className="lead-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="lead-modal" style={{ maxWidth: 460 }}>
            <div className="lead-modal-header">
              <div className="lead-modal-title">Edit User</div>
              <button className="lead-modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <form id="edit-user-form" onSubmit={onSubmit}>
              <div className="lead-modal-body">
                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                <div className="lead-form-field" style={{ paddingBottom: 14 }}>
                  <label className="lead-form-label">EMAIL <span style={{ color: "#C2410C" }}>*</span></label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="lead-form-input"
                    defaultValue={user.email}
                  />
                </div>

                <div className="lead-form-field" style={{ paddingBottom: 14 }}>
                  <label className="lead-form-label">ROLE <span style={{ color: "#C2410C" }}>*</span></label>
                  <select
                    name="role"
                    required
                    className="lead-form-select"
                    defaultValue={user.role}
                    disabled={isYou}
                    title={isYou ? "You cannot change your own role" : undefined}
                  >
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  {isYou && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      Role locked — you can&apos;t change your own role.
                    </div>
                  )}
                </div>

                <div className="lead-form-field" style={{ paddingBottom: 8 }}>
                  <label className="lead-form-label">NEW PASSWORD</label>
                  <input
                    name="password"
                    type="password"
                    minLength={6}
                    className="lead-form-input"
                    placeholder="Leave blank to keep current"
                    autoComplete="new-password"
                  />
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Min 6 characters. Leave blank to keep the current password.
                  </div>
                </div>
              </div>
              <div className="lead-modal-footer">
                <button type="button" className="lead-form-btn-cancel" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="lead-form-btn-save" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
