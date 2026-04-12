"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import StatusSelect from "@/components/StatusSelect"
import AssignLeadSelect from "@/components/AssignLeadSelect"
import { bulkAssignLeads } from "@/app/actions/lead"
import { LeadStatus } from "@prisma/client"

type Lead = {
  id: string
  name: string
  phone: string
  email: string | null
  state: string | null
  modelInterest: string | null
  source: string
  status: LeadStatus
  assignedToId: string | null
  assignedTo: { id: string; email: string } | null
  nextActionDate: Date | null
  createdAt: Date
}

type User = { id: string; email: string }

export default function LeadsTable({
  leads,
  salesUsers,
  isAdmin,
}: {
  leads: Lead[]
  salesUsers: User[]
  isAdmin: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkUserId, setBulkUserId] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const allIds = leads.map(l => l.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
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

  const colSpan = isAdmin ? 10 : 8

  return (
    <>
      {/* Bulk assign toolbar — visible when admin has items selected */}
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

      <table className="data-table">
        <thead>
          <tr>
            {isAdmin && (
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  style={{ cursor: "pointer" }}
                />
              </th>
            )}
            <th>Name</th>
            <th>Contact</th>
            <th>State</th>
            <th>Model Interest</th>
            <th>Source</th>
            <th>Status</th>
            {isAdmin && <th>Assigned To</th>}
            <th>Next Action Date</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={colSpan} style={{ textAlign: "center", color: "#9CA3AF", padding: "40px" }}>
                {isAdmin ? "No leads yet. Click + Add Lead to get started." : "No leads assigned to you yet."}
              </td>
            </tr>
          ) : leads.map(lead => (
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
                <Link href={`/leads/${lead.id}`} style={{ color: "var(--primary)", textDecoration: "none" }} className="hover:underline">
                  {lead.name}
                </Link>
              </td>
              <td>
                <div style={{ fontWeight: 500 }}>{lead.phone}</div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lead.email || "—"}</div>
              </td>
              <td style={{ color: "#6B7280", fontSize: "13px" }}>{lead.state || "—"}</td>
              <td style={{ color: "#6B7280", fontSize: "13px" }}>{lead.modelInterest || "—"}</td>
              <td><span className={`badge badge-${lead.source.toLowerCase()}`}>{lead.source}</span></td>
              <td><StatusSelect leadId={lead.id} currentStatus={lead.status} /></td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
