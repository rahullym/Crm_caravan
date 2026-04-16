"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import StatusSelect from "@/components/StatusSelect"
import AssignLeadSelect from "@/components/AssignLeadSelect"
import EditLeadModal from "@/components/EditLeadModal"
import DeleteLeadButton from "@/components/DeleteLeadButton"
import { bulkAssignLeads } from "@/app/actions/lead"
import { getStatusMeta } from "@/lib/lead-statuses"

type Lead = {
  id: string
  name: string
  phone: string
  email: string | null
  state: string | null
  modelInterest: string | null
  size: string | null
  source: string
  status: string
  assignedToId: string | null
  assignedTo: { id: string; email: string } | null
  nextActionDate: Date | null
  firstContactDate: Date | null
  actionChannel: string | null
  nextAction: string | null
  customerNotes: string | null
  internalNotes: string | null
  createdAt: Date
}

type User = { id: string; email: string }

type SortKey = "name" | "state" | "source" | "status" | "assignedTo" | "nextActionDate" | "createdAt"
type SortDir = "asc" | "desc"

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>
  return <span style={{ marginLeft: 4, color: "var(--primary)" }}>{dir === "asc" ? "↑" : "↓"}</span>
}

export default function LeadsTable({
  leads,
  salesUsers,
  isAdmin,
  currentUserId,
}: {
  leads: Lead[]
  salesUsers: User[]
  isAdmin: boolean
  currentUserId?: string
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkUserId, setBulkUserId] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      let av: string | number | null = null
      let bv: string | number | null = null

      switch (sortKey) {
        case "name":          av = a.name; bv = b.name; break
        case "state":         av = a.state ?? ""; bv = b.state ?? ""; break
        case "source":        av = a.source; bv = b.source; break
        case "status":        av = a.status; bv = b.status; break
        case "assignedTo":    av = a.assignedTo?.email ?? ""; bv = b.assignedTo?.email ?? ""; break
        case "nextActionDate":
          av = a.nextActionDate ? new Date(a.nextActionDate).getTime() : 0
          bv = b.nextActionDate ? new Date(b.nextActionDate).getTime() : 0
          break
        case "createdAt":
          av = new Date(a.createdAt).getTime()
          bv = new Date(b.createdAt).getTime()
          break
      }

      if (av === null || av === "") av = sortDir === "asc" ? "\uFFFF" : ""
      if (bv === null || bv === "") bv = sortDir === "asc" ? "\uFFFF" : ""

      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv))

      return sortDir === "asc" ? cmp : -cmp
    })
  }, [leads, sortKey, sortDir])

  const allIds = leads.map(l => l.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleBulkAssign() {
    const ids = Array.from(selected)
    const userId = bulkUserId || null
    startTransition(async () => {
      const result = await bulkAssignLeads(ids, userId)
      if (result.success) {
        setMessage(`${result.count} lead${result.count === 1 ? "" : "s"} assigned.`)
        setSelected(new Set())
        setBulkUserId("")
      } else {
        setMessage(result.error ?? "Failed.")
      }
      setTimeout(() => setMessage(null), 3000)
    })
  }

  function thProps(key: SortKey, label: string) {
    return (
      <th
        onClick={() => handleSort(key)}
        style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
      >
        {label}<SortIcon active={sortKey === key} dir={sortDir} />
      </th>
    )
  }

  const colSpan = isAdmin ? 11 : 9

  return (
    <>
      {/* Bulk assign toolbar */}
      {isAdmin && selected.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 20px", background: "var(--primary-light)",
          borderBottom: "1px solid var(--border-color)",
          borderRadius: "8px 8px 0 0",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
            {selected.size} lead{selected.size > 1 ? "s" : ""} selected
          </span>
          <select
            value={bulkUserId}
            onChange={e => setBulkUserId(e.target.value)}
            className="inline-select"
            style={{ minWidth: 160 }}
          >
            <option value="">Unassigned</option>
            {salesUsers.map(u => (
              <option key={u.id} value={u.id}>{u.email.split("@")[0]}</option>
            ))}
          </select>
          <button
            onClick={handleBulkAssign}
            disabled={isPending}
            style={{
              padding: "6px 16px", borderRadius: 6,
              background: "var(--primary)", color: "#fff",
              border: "none", fontWeight: 600, fontSize: 13,
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? "Assigning…" : "Assign"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{
              padding: "6px 12px", borderRadius: 6,
              background: "transparent", color: "var(--text-muted)",
              border: "1px solid var(--border-color)", fontSize: 13,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
          {message && (
            <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>{message}</span>
          )}
        </div>
      )}

      <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {isAdmin && (
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer" }} />
              </th>
            )}
            {thProps("name", "Name")}
            <th>Contact</th>
            {thProps("state", "State")}
            <th>Model Interest</th>
            {thProps("source", "Source")}
            {thProps("status", "Status")}
            {isAdmin && thProps("assignedTo", "Assigned To")}
            {thProps("nextActionDate", "Next Action")}
            {thProps("createdAt", "Added")}
            <th style={{ width: 120 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedLeads.length === 0 ? (
            <tr>
              <td colSpan={colSpan} style={{ textAlign: "center", color: "#9CA3AF", padding: "40px" }}>
                {isAdmin ? "No leads yet. Click + Add Lead to get started." : "No leads assigned to you yet."}
              </td>
            </tr>
          ) : sortedLeads.map(lead => {
            const status = getStatusMeta(lead.status)
            return (
              <tr key={lead.id} style={{ background: selected.has(lead.id) ? "var(--primary-light)" : undefined }}>
                {isAdmin && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleOne(lead.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                )}
                <td style={{ fontWeight: 600 }}>
                  <Link href={`/leads/${lead.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                    {lead.name}
                  </Link>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{lead.phone}</div>
                  <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lead.email || "—"}</div>
                </td>
                <td style={{ color: "#6B7280", fontSize: "13px" }}>{lead.state || "—"}</td>
                <td style={{ color: "#6B7280", fontSize: "13px" }}>{lead.modelInterest || "—"}</td>
                <td><span className={`badge badge-${lead.source.toLowerCase()}`}>{lead.source.replace(/_/g, " ")}</span></td>
                <td>
                  <StatusSelect leadId={lead.id} currentStatus={lead.status as import("@prisma/client").LeadStatus} />
                </td>
                {isAdmin && (
                  <td>
                    <AssignLeadSelect
                      leadId={lead.id}
                      currentAssignedId={lead.assignedToId}
                      users={salesUsers}
                    />
                  </td>
                )}
                <td style={{ color: "#9CA3AF", fontSize: "13px" }}>
                  {lead.nextActionDate
                    ? new Date(lead.nextActionDate).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </td>
                <td style={{ color: "#9CA3AF", fontSize: "13px" }}>
                  {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <EditLeadModal lead={lead} />
                    {(isAdmin || (currentUserId && lead.assignedToId === currentUserId)) && (
                      <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </>
  )
}
