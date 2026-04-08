"use client"

import { LeadStatus } from "@prisma/client"
import { useRouter, useSearchParams } from "next/navigation"

export default function LeadStatusFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("status") || ""

  return (
    <form style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label style={{ fontSize: "13px", color: "#6B7280", fontWeight: 500 }}>Filter:</label>
      <select
        name="status"
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams()
          if (e.target.value) params.set("status", e.target.value)
          router.push(`/leads${params.size ? `?${params}` : ""}`)
        }}
        className="inline-select"
        style={{ paddingRight: "28px" }}
      >
        <option value="">All Statuses</option>
        {Object.values(LeadStatus).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </form>
  )
}
