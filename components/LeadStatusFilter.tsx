"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { LEAD_STATUSES } from "@/lib/lead-statuses"

const LEAD_SOURCES = [
  { value: "META", label: "Meta" },
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "SHOW", label: "Show / Expo" },
  { value: "OTHER", label: "Other" },
]

const AUS_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]

type User = { id: string; email: string }

export default function LeadStatusFilter({
  salesUsers = [],
  isAdmin = false,
}: {
  salesUsers?: User[]
  isAdmin?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/leads${params.size ? `?${params}` : ""}`)
  }

  const status = searchParams.get("status") || ""
  const source = searchParams.get("source") || ""
  const state = searchParams.get("state") || ""
  const assignedTo = searchParams.get("assignedTo") || ""
  const hasFilters = !!(status || source || state || assignedTo)

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="inline-select"
        style={{ minWidth: 160 }}
      >
        <option value="">All Statuses</option>
        {LEAD_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Source filter */}
      <select
        value={source}
        onChange={(e) => updateFilter("source", e.target.value)}
        className="inline-select"
        style={{ minWidth: 130 }}
      >
        <option value="">All Sources</option>
        {LEAD_SOURCES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* State filter */}
      <select
        value={state}
        onChange={(e) => updateFilter("state", e.target.value)}
        className="inline-select"
        style={{ minWidth: 100 }}
      >
        <option value="">All States</option>
        {AUS_STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Assigned To filter (admin only) */}
      {isAdmin && salesUsers.length > 0 && (
        <select
          value={assignedTo}
          onChange={(e) => updateFilter("assignedTo", e.target.value)}
          className="inline-select"
          style={{ minWidth: 140 }}
        >
          <option value="">All Agents</option>
          <option value="unassigned">Unassigned</option>
          {salesUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.email.split("@")[0]}</option>
          ))}
        </select>
      )}

      {/* Clear all filters */}
      {hasFilters && (
        <button
          onClick={() => router.push("/leads")}
          style={{
            padding: "5px 12px",
            borderRadius: 6,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  )
}
