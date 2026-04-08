"use client"

import { LeadStatus } from "@prisma/client"
import { updateLeadStatus } from "@/app/actions/lead"
import { useTransition } from "react"

export default function StatusSelect({ leadId, currentStatus }: { leadId: string; currentStatus: LeadStatus }) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      disabled={isPending}
      value={currentStatus}
      onChange={(e) => {
        startTransition(async () => {
          await updateLeadStatus(leadId, e.target.value)
        })
      }}
      className="inline-select"
    >
      {Object.values(LeadStatus).map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}
