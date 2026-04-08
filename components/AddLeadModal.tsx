"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import LeadForm from "@/components/LeadForm"

export default function AddLeadModal() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()

  useEffect(() => {
    setTimeout(() => setMounted(true), 0)
  }, [])

  function handleSuccess() {
    setOpen(false)
    router.refresh()
  }

  const modalContent = open && mounted ? (
    <div
      className="lead-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="lead-modal">
        {/* Header */}
        <div className="lead-modal-header">
          <div className="lead-modal-title">Add New Lead</div>
          <button className="lead-modal-close" type="button" onClick={() => setOpen(false)}>✕</button>
        </div>

        {/* Scrollable body */}
        <div className="lead-modal-body">
          <LeadForm
            formId="add-lead-form"
            onSuccess={handleSuccess}
            onLoadingChange={setIsLoading}
          />
        </div>

        {/* Sticky footer */}
        <div className="lead-modal-footer">
          <button type="button" className="lead-form-btn-cancel" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="submit"
            form="add-lead-form"
            className="lead-form-btn-save"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        id="add-lead-btn"
        className="btn-primary"
        onClick={() => setOpen(true)}
      >
        + Add Lead
      </button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  )
}
