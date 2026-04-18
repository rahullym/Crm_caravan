"use client"

import { assignLead } from "@/app/actions/lead"
import { useTransition } from "react"

type User = { id: string; email: string }

export default function AssignLeadSelect({
  leadId,
  currentAssignedId,
  users,
}: {
  leadId: string
  currentAssignedId: string | null
  users: User[]
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      disabled={isPending}
      value={currentAssignedId ?? ""}
      onChange={(e) => {
        const value = e.target.value || null
        startTransition(async () => {
          await assignLead(leadId, value)
        })
      }}
      className="inline-select"
      style={{ minWidth: 110, maxWidth: 140 }}
    >
      <option value="">Unassigned</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.email.split("@")[0]}
        </option>
      ))}
    </select>
  )
}
