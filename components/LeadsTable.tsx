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

type SortKey = "name" | "model" | "source" | "status" | "nextActionDate" | "createdAt" | "assignedTo"
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
        case "name":       av = a.name; bv = b.name; break
        case "model":      av = a.modelInterest ?? ""; bv = b.modelInterest ?? ""; break
        case "source":     av = a.source; bv = b.source; break
        case "status":     av = a.status; bv = b.status; break
        case "assignedTo": av = a.assignedTo?.email ?? ""; bv = b.assignedTo?.email ?? ""; break
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

  const colSpan = isAdmin ? 9 : 7

  function formatDate(d: Date | null) {
    if (!d) return null
    return new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })
  }
  function isOverdue(d: Date | null) {
    if (!d) return false
    return new Date(d).getTime() < Date.now() - 24 * 60 * 60 * 1000
  }

  // Stable colour from name → avatar background
  const AVATAR_COLORS = ["#5B5FED", "#0891B2", "#059669", "#D97706", "#DC2626", "#7C3AED", "#DB2777", "#475569"]
  function avatarColor(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
  }
  function initials(name: string) {
    const parts = name.trim().split(/\s+/)
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
  }

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
      <table className="data-table data-table--compact">
        <thead>
          <tr>
            {isAdmin && (
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer" }} />
              </th>
            )}
            {thProps("name", "Lead")}
            {thProps("model", "Model")}
            {thProps("source", "Source")}
            {thProps("status", "Status")}
            {thProps("nextActionDate", "Next Action")}
            {thProps("createdAt", "Added")}
            {isAdmin && thProps("assignedTo", "Owner")}
            <th style={{ width: 90 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedLeads.length === 0 ? (
            <tr>
              <td colSpan={colSpan}>
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">
                    {isAdmin ? "No leads yet" : "No leads assigned to you yet"}
                  </div>
                  <div className="empty-state-hint">
                    {isAdmin ? "Click + Add Lead in the top-right to get started." : "Ask an admin to assign you some leads."}
                  </div>
                </div>
              </td>
            </tr>
          ) : sortedLeads.map(lead => {
            const ownerInitial = lead.assignedTo?.email?.[0]?.toUpperCase() ?? ""
            const ownerName = lead.assignedTo?.email?.split("@")[0] ?? "Unassigned"
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
                <td>
                  <div className="lead-cell">
                    <div className="lead-avatar" style={{ background: avatarColor(lead.name) }}>
                      {initials(lead.name)}
                    </div>
                    <div className="lead-cell-text">
                      <Link href={`/leads/${lead.id}`} className="lead-cell-name">{lead.name}</Link>
                      <div className="lead-cell-phone">{lead.phone}</div>
                      {(lead.state || lead.email) && (
                        <div className="lead-meta-row">
                          {lead.state && <span className="meta-chip">{lead.state}</span>}
                          {lead.email && <span className="meta-chip" title={lead.email}>✉</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  {lead.modelInterest ? (
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                      {lead.modelInterest}
                      {lead.size && <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>{lead.size}</div>}
                    </div>
                  ) : (
                    <span style={{ color: "#CBD5E1", fontSize: 13 }}>—</span>
                  )}
                </td>
                <td><span className={`badge badge-${lead.source.toLowerCase()}`}>{lead.source.replace(/_/g, " ")}</span></td>
                <td>
                  <StatusSelect leadId={lead.id} currentStatus={lead.status as import("@prisma/client").LeadStatus} />
                </td>
                <td>
                  {lead.nextAction || lead.nextActionDate ? (
                    <div>
                      {lead.nextAction && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)" }}>
                          {lead.nextAction.replace(/_/g, " ")}
                        </div>
                      )}
                      {lead.nextActionDate && (
                        <div style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isOverdue(lead.nextActionDate) ? "#DC2626" : "var(--primary)",
                          marginTop: 2,
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {isOverdue(lead.nextActionDate) ? "⚠ " : ""}{formatDate(lead.nextActionDate)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "#CBD5E1", fontSize: 13 }}>—</span>
                  )}
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {formatDate(lead.createdAt)}
                </td>
                {isAdmin && (
                  <td>
                    <div className="owner-cell">
                      <div className={`owner-avatar${lead.assignedTo ? "" : " owner-avatar--empty"}`}>
                        {ownerInitial || "—"}
                      </div>
                      <AssignLeadSelect
                        leadId={lead.id}
                        currentAssignedId={lead.assignedToId}
                        users={salesUsers}
                      />
                    </div>
                  </td>
                )}
                <td>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <EditLeadModal lead={lead} iconOnly />
                    {(isAdmin || (currentUserId && lead.assignedToId === currentUserId)) && (
                      <DeleteLeadButton leadId={lead.id} leadName={lead.name} iconOnly />
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
