"use client"

import { useState } from "react"
import { createServiceRequest } from "@/app/actions/service"

type CaravanData = { id: string; make: string; model: string; vin: string | null }
type TechnicianData = { id: string; email: string }

export default function ServiceForm({ caravans, technicians }: { caravans: CaravanData[]; technicians: TechnicianData[] }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null); setSuccess(null); setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    const result = await createServiceRequest(formData)
    if (!result.success) {
      setError(result.error as string)
    } else {
      setSuccess("Service request created!")
      ;(event.target as HTMLFormElement).reset()
    }
    setIsLoading(false)
  }

  return (
    <div className="form-card">
      <div className="form-title">New Service Request</div>
      <form onSubmit={onSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="form-group">
          <label className="form-label" htmlFor="caravanId">Select Caravan *</label>
          <select id="caravanId" name="caravanId" required className="form-select">
            <option value="">-- Choose a Caravan --</option>
            {caravans.map(c => (
              <option key={c.id} value={c.id}>{c.make} {c.model}{c.vin ? ` — ${c.vin}` : ""}</option>
            ))}
          </select>
          {caravans.length === 0 && <p style={{ fontSize: "12px", color: "#DC2626", marginTop: "4px" }}>No caravans available.</p>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="description">Issue Description *</label>
          <textarea id="description" name="description" required className="form-textarea" placeholder="Describe the problem..." />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="technicianId">Assign Technician</label>
          <select id="technicianId" name="technicianId" className="form-select">
            <option value="">-- Unassigned --</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.email}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isLoading || caravans.length === 0} className="btn-primary">
          {isLoading ? "Creating..." : "Create Request"}
        </button>
      </form>
    </div>
  )
}
