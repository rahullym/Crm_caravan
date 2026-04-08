"use client"

import { ServiceStatus } from "@prisma/client"
import { updateServiceStatus } from "@/app/actions/service"
import { useTransition } from "react"

export default function ServiceStatusSelect({ serviceId, currentStatus }: { serviceId: string; currentStatus: ServiceStatus }) {
  const [isPending, startTransition] = useTransition()
  return (
    <select
      disabled={isPending}
      value={currentStatus}
      onChange={(e) => {
        startTransition(async () => { await updateServiceStatus(serviceId, e.target.value) })
      }}
      className="inline-select"
    >
      {Object.values(ServiceStatus).map((s) => (
        <option key={s} value={s}>{s.replace("_", " ")}</option>
      ))}
    </select>
  )
}
