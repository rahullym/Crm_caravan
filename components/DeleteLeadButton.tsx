"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteLead } from "@/app/actions/lead"

export default function DeleteLeadButton({ leadId, leadName, redirectAfter = false }: {
  leadId: string
  leadName: string
  redirectAfter?: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLead(leadId)
      if (result.success) {
        if (redirectAfter) router.push("/leads")
        setConfirming(false)
      } else {
        alert(result.error ?? "Failed to delete lead.")
      }
    })
  }

  if (confirming) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#B91C1C", fontWeight: 600 }}>Delete &ldquo;{leadName}&rdquo;?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          style={{
            padding: "4px 10px", borderRadius: 6,
            background: "#DC2626", color: "#fff",
            border: "none", fontWeight: 700, fontSize: 12,
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            padding: "4px 10px", borderRadius: 6,
            background: "transparent", color: "#6B7280",
            border: "1px solid #E2E8F0", fontSize: 12,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title="Delete lead"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 12px",
        borderRadius: 6,
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        fontSize: 12,
        fontWeight: 600,
        color: "#B91C1C",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      🗑 Delete
    </button>
  )
}
