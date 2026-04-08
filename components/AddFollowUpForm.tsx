"use client"

import { useState } from "react"
import { addFollowUp } from "@/app/actions/followup"

const ACTION_CHANNELS = [
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "WALK_IN", label: "Walk In" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "OTHER", label: "Other" },
]

const NEXT_ACTIONS = [
  { value: "FOLLOW_UP_CALL", label: "Follow Up Call" },
  { value: "SEND_QUOTE", label: "Send Quote" },
  { value: "SCHEDULE_DEMO", label: "Schedule Demo" },
  { value: "SEND_EMAIL", label: "Send Email" },
  { value: "SITE_VISIT", label: "Site Visit" },
  { value: "CLOSE_DEAL", label: "Close Deal" },
  { value: "NO_ACTION", label: "No Action" },
]

export default function AddFollowUpForm({ leadId }: { leadId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await addFollowUp(leadId, formData)
    setIsLoading(false)
    if (!result.success) {
      setError(result.error as string)
    } else {
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
      // auto hide success
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 12 }}>Follow-up logged successfully!</div>
      )}

      {/* Channel + Next Action row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label className="form-label">Channel</label>
          <select name="channel" className="form-select">
            <option value="">— Select —</option>
            {ACTION_CHANNELS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Next Action</label>
          <select name="nextAction" className="form-select">
            <option value="">— Select —</option>
            {NEXT_ACTIONS.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Next Action Date */}
      <div style={{ marginBottom: 12 }}>
        <label className="form-label">Next Action Date</label>
        <input name="nextActionDate" type="date" className="form-input" />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Notes <span style={{ color: "#C2410C" }}>*</span></label>
        <textarea
          name="notes"
          required
          rows={4}
          className="form-input"
          style={{ resize: "vertical", fontFamily: "inherit" }}
          placeholder="What happened in this follow-up? Key points discussed, customer response..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary"
        style={{ width: "100%" }}
      >
        {isLoading ? "Saving…" : "Log Follow-Up"}
      </button>
    </form>
  )
}
