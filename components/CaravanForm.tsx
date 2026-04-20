"use client"

import { useState } from "react"
import { createCaravan } from "@/app/actions/caravan"

export default function CaravanForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null); setSuccess(null); setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    const result = await createCaravan(formData)
    if (!result.success) {
      setError(result.error as string)
    } else {
      setSuccess("Caravan added!")
      ;(event.target as HTMLFormElement).reset()
    }
    setIsLoading(false)
  }

  return (
    <div className="form-card">
      <div className="form-title">Add Caravan</div>
      <form onSubmit={onSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="form-group">
          <label className="form-label" htmlFor="make">Make *</label>
          <input id="make" name="make" type="text" required className="form-input" placeholder="Make" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="model">Model *</label>
          <input id="model" name="model" type="text" required className="form-input" placeholder="Rover / Drifter / Elite / Toy Haulers" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="year">Year *</label>
            <input id="year" name="year" type="number" min="1900" max="2100" required className="form-input" placeholder="2024" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="price">Price *</label>
            <input id="price" name="price" type="number" min="0" step="0.01" required className="form-input" placeholder="45000" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="vin">VIN (Optional)</label>
          <input id="vin" name="vin" type="text" className="form-input" placeholder="1HGBH41JXMN109186" />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? "Saving..." : "Add to Inventory"}
        </button>
      </form>
    </div>
  )
}
