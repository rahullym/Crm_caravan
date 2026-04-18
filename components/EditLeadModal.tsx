"use client"

import { useState } from "react"
import LeadForm from "./LeadForm"

type Lead = {
  id: string
  name: string
  phone: string
  email: string | null
  state: string | null
  source: string
  status: string
  modelInterest: string | null
  size: string | null
  actionChannel: string | null
  nextAction: string | null
  firstContactDate: Date | null
  nextActionDate: Date | null
  customerNotes: string | null
  internalNotes: string | null
}

export default function EditLeadModal({ lead, iconOnly = false }: { lead: Lead; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <>
      {iconOnly ? (
        <button
          onClick={() => setOpen(true)}
          title={`Edit ${lead.name}`}
          className="icon-btn"
          aria-label="Edit lead"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          title={`Edit ${lead.name}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 6,
            background: "#F1F5F9",
            border: "1px solid #E2E8F0",
            fontSize: 12,
            fontWeight: 600,
            color: "#475569",
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Edit
        </button>
      )}

      {open && (
        <div className="lead-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="lead-modal">
            <div className="lead-modal-header">
              <div className="lead-modal-title">Edit Lead — {lead.name}</div>
              <button className="lead-modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="lead-modal-body">
              <LeadForm
                formId="edit-lead-form"
                initialValues={lead}
                onSuccess={() => setOpen(false)}
                onLoadingChange={setLoading}
              />
            </div>
            <div className="lead-modal-footer">
              <button
                type="button"
                className="lead-form-btn-cancel"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-lead-form"
                className="lead-form-btn-save"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
