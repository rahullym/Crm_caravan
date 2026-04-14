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

export default function EditLeadModal({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Edit lead"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
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
        ✏️ Edit
      </button>

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
