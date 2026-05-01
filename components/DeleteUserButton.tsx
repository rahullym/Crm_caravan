"use client"

import { useTransition } from "react"
import { deleteUser } from "@/app/actions/user"

export default function DeleteUserButton({ userId, userEmail, disabled }: {
  userId: string
  userEmail: string
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (disabled) return
    if (!confirm(`Delete user "${userEmail}"?\n\nTheir leads, follow-ups, and service requests will become unassigned (history is kept).`)) return
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (!result.success) {
        alert(result.error ?? "Failed to delete user.")
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending || disabled}
      title={disabled ? "You cannot delete yourself" : `Delete ${userEmail}`}
      aria-label="Delete user"
      className="icon-btn icon-btn--danger"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  )
}
