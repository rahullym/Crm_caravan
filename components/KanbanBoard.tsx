"use client"

import { useState, useTransition } from "react"
import { Lead, LeadStatus } from "@prisma/client"
import Link from "next/link"
import { updateLeadStatus } from "@/app/actions/lead"
import { LEAD_STATUSES, getStatusMeta } from "@/lib/lead-statuses"

const COLUMNS = LEAD_STATUSES.map(s => ({
  id: s.value as LeadStatus,
  label: s.label,
  color: s.color,
  bg: s.bg,
}))

export default function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [isPending, startTransition] = useTransition()

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData("leadId")
    const draggedLead = leads.find((l) => l.id === leadId)
    if (!draggedLead || draggedLead.status === targetStatus) return
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: targetStatus } : l)))
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, targetStatus)
      if (!result.success) { setLeads(initialLeads); alert(result.error) }
    })
  }

  return (
    <div style={{ position: "relative" }}>
      {isPending && (
        <div style={{
          position: "absolute", top: -8, right: 0,
          background: "var(--primary-light)", color: "var(--primary)",
          fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "100px"
        }}>
          Syncing...
        </div>
      )}
      <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "16px" }}>
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.id)
          return (
            <div
              key={col.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{ minWidth: 190 }}
            >
              <div className="kanban-column-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                  <span className="kanban-column-title" style={{ fontSize: 12 }}>{col.label}</span>
                </div>
                <span className="kanban-count">{colLeads.length}</span>
              </div>
              <div className="kanban-cards">
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="kanban-card"
                  >
                    <Link
                      href={`/leads/${lead.id}`}
                      style={{ textDecoration: "none", display: "block" }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="kanban-card-name">{lead.name}</div>
                    </Link>
                    <div className="kanban-card-phone">{lead.phone}</div>
                    <span className={`badge badge-${lead.source.toLowerCase()}`} style={{ fontSize: "11px" }}>
                      {lead.source.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <div style={{ color: "#D1D5DB", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
