"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteLead } from "@/app/actions/lead"

export default function DeleteLeadButton({ leadId, leadName, redirectAfter = false, iconOnly = false }: {
  leadId: string
  leadName: string
  redirectAfter?: boolean
  iconOnly?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm(`Delete "${leadName}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteLead(leadId)
      if (!result.success) {
        alert(result.error ?? "Failed to delete lead.")
        return
      }
      if (redirectAfter) router.push("/leads")
    })
  }

  if (iconOnly) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        title={`Delete ${leadName}`}
        aria-label="Delete lead"
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

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={`Delete ${leadName}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 6,
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        fontSize: 12,
        fontWeight: 600,
        color: "#B91C1C",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
      Delete
    </button>
  )
}
