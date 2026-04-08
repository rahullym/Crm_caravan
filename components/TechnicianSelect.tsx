"use client"

import { useTransition } from "react"
import { assignTechnician } from "@/app/actions/service"

type TechnicianData = { id: string; email: string }

export default function TechnicianSelect({ serviceId, currentTechnicianId, technicians }: {
  serviceId: string; currentTechnicianId: string | null; technicians: TechnicianData[]
}) {
  const [isPending, startTransition] = useTransition()
  return (
    <select
      disabled={isPending}
      value={currentTechnicianId || ""}
      onChange={(e) => {
        startTransition(async () => { await assignTechnician(serviceId, e.target.value || null) })
      }}
      className="inline-select"
      style={{ minWidth: "130px" }}
    >
      <option value="">Unassigned</option>
      {technicians.map((t) => (
        <option key={t.id} value={t.id}>{t.email.split("@")[0]}</option>
      ))}
    </select>
  )
}
