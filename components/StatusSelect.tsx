"use client"

import { LeadStatus } from "@prisma/client"
import { updateLeadStatus } from "@/app/actions/lead"
import { useTransition } from "react"
import { LEAD_STATUSES, getStatusMeta } from "@/lib/lead-statuses"

export default function StatusSelect({ leadId, currentStatus }: { leadId: string; currentStatus: LeadStatus }) {
  const [isPending, startTransition] = useTransition()
  const meta = getStatusMeta(currentStatus)

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
      style={{
        borderColor: meta.color + "66",
        background: meta.bg,
        color: meta.color,
        fontWeight: 700,
        fontSize: 12,
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  )
}
