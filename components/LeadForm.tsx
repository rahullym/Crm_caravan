"use client"

import { useState } from "react"
import { createLead, updateLead } from "@/app/actions/lead"

const AUS_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]

const CARAVAN_MODELS = [
  "Rover",
  "Drifter",
  "Elite",
  "Toy Haulers",
]

const ACTION_CHANNELS = [
  { value: "PHONE_CALL",   label: "Phone Call" },
  { value: "EMAIL",        label: "Email" },
  { value: "SMS",          label: "SMS" },
  { value: "WALK_IN",      label: "Walk In" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "META_PAID",    label: "Meta Paid" },
  { value: "META_ORGANIC", label: "Meta Organic" },
  { value: "OTHER",        label: "Other" },
]

const NEXT_ACTIONS = [
  { value: "FOLLOW_UP_CALL", label: "Follow Up Call" },
  { value: "SEND_QUOTE",     label: "Send Quote" },
  { value: "SCHEDULE_DEMO",  label: "Schedule Demo" },
  { value: "SEND_EMAIL",     label: "Send Email" },
  { value: "SITE_VISIT",     label: "Site Visit" },
  { value: "CLOSE_DEAL",     label: "Close Deal" },
  { value: "NO_ACTION",      label: "No Action" },
]

const LEAD_SOURCES = [
  { value: "META",     label: "Meta / Facebook" },
  { value: "WEBSITE",  label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "SHOW",     label: "Show / Expo" },
  { value: "OTHER",    label: "Other" },
]

const LEAD_STATUSES = [
  { value: "NEW_LEAD",         label: "New Lead" },
  { value: "CONTACTED",        label: "Contacted" },
  { value: "ENGAGED",          label: "Engaged" },
  { value: "QUALIFIED",        label: "Qualified" },
  { value: "OPTIONS_SENT",     label: "Options Sent" },
  { value: "SHORTLISTED",      label: "Considering / Shortlisted" },
  { value: "HOT_LEAD",         label: "Hot Lead" },
  { value: "QUOTE_SENT",       label: "Quote / Build Spec Sent" },
  { value: "DECISION_PENDING", label: "Decision Pending" },
  { value: "DEPOSIT_PAID",     label: "Deposit Paid (Won)" },
  { value: "LOST",             label: "Lost / Not Now" },
]

const todayISO = new Date().toISOString().split("T")[0]

type InitialValues = {
  id?: string
  name?: string
  phone?: string
  email?: string | null
  state?: string | null
  source?: string
  status?: string
  modelInterest?: string | null
  size?: string | null
  actionChannel?: string | null
  nextAction?: string | null
  firstContactDate?: Date | null
  nextActionDate?: Date | null
  customerNotes?: string | null
  internalNotes?: string | null
}

interface LeadFormProps {
  /** HTML id to allow external submit buttons via form="id" */
  formId?: string
  initialValues?: InitialValues
  onSuccess?: () => void
  onCancel?: () => void
  onLoadingChange?: (loading: boolean) => void
}

function dateToISO(date: Date | null | undefined): string {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

export default function LeadForm({ formId, initialValues, onSuccess, onCancel, onLoadingChange }: LeadFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!initialValues?.id

  function setLoading(v: boolean) {
    setIsLoading(v)
    onLoadingChange?.(v)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(event.currentTarget)

    const result = isEditing
      ? await updateLead(initialValues!.id!, formData)
      : await createLead(formData)

    if (!result.success) {
      setError(result.error as string)
      setLoading(false)
    } else {
      setLoading(false)
      onSuccess?.()
    }
  }

  return (
    <form id={formId} onSubmit={onSubmit}>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Row 1: Name + Email */}
      <div className="lead-form-row">
        <div className="lead-form-field">
          <label className="lead-form-label">NAME <span style={{ color: "#C2410C" }}>*</span></label>
          <input name="name" type="text" required className="lead-form-input" placeholder="Full name" defaultValue={initialValues?.name} />
        </div>
        <div className="lead-form-field">
          <label className="lead-form-label">EMAIL</label>
          <input name="email" type="email" className="lead-form-input" placeholder="email@example.com" defaultValue={initialValues?.email ?? ""} />
        </div>
      </div>

      {/* Row 2: Phone + State */}
      <div className="lead-form-row">
        <div className="lead-form-field">
          <label className="lead-form-label">PHONE <span style={{ color: "#C2410C" }}>*</span></label>
          <input name="phone" type="tel" required className="lead-form-input" placeholder="04xx xxx xxx" defaultValue={initialValues?.phone} />
        </div>
        <div className="lead-form-field">
          <label className="lead-form-label">STATE</label>
          <select name="state" className="lead-form-select" defaultValue={initialValues?.state ?? ""}>
            <option value="">— Select —</option>
            {AUS_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 3: Model Interest + Size */}
      <div className="lead-form-row">
        <div className="lead-form-field">
          <label className="lead-form-label">MODEL INTEREST</label>
          <select name="modelInterest" className="lead-form-select" defaultValue={initialValues?.modelInterest ?? ""}>
            <option value="">— Select —</option>
            {CARAVAN_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="lead-form-field">
          <label className="lead-form-label">SIZE</label>
          <input name="size" type="text" className="lead-form-input" placeholder="e.g. 21ft, 19'6ft" defaultValue={initialValues?.size ?? ""} />
        </div>
      </div>

      {/* Row 4: Lead Source + Status */}
      <div className="lead-form-row">
        <div className="lead-form-field">
          <label className="lead-form-label">LEAD SOURCE</label>
          <select name="source" className="lead-form-select" defaultValue={initialValues?.source ?? ""}>
            <option value="">— Select —</option>
            {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="lead-form-field">
          <label className="lead-form-label">STATUS</label>
          <select name="status" className="lead-form-select" defaultValue={initialValues?.status ?? "NEW_LEAD"}>
            {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Row 5: Action/Channel + Next Action */}
      <div className="lead-form-row">
        <div className="lead-form-field">
          <label className="lead-form-label">ACTION / CHANNEL</label>
          <select name="actionChannel" className="lead-form-select" defaultValue={initialValues?.actionChannel ?? ""}>
            <option value="">— Select —</option>
            {ACTION_CHANNELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div className="lead-form-field">
          <label className="lead-form-label">NEXT ACTION</label>
          <select name="nextAction" className="lead-form-select" defaultValue={initialValues?.nextAction ?? ""}>
            <option value="">— Select —</option>
            {NEXT_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
      </div>

      {/* Row 6: First Contact Date + Next Action Date */}
      <div className="lead-form-row">
        <div className="lead-form-field">
          <label className="lead-form-label">FIRST CONTACT DATE</label>
          <input name="firstContactDate" type="date" className="lead-form-input" defaultValue={initialValues?.firstContactDate ? dateToISO(initialValues.firstContactDate) : todayISO} />
        </div>
        <div className="lead-form-field">
          <label className="lead-form-label">NEXT ACTION DATE</label>
          <input name="nextActionDate" type="date" className="lead-form-input" defaultValue={initialValues?.nextActionDate ? dateToISO(initialValues.nextActionDate) : ""} />
        </div>
      </div>

      {/* Customer Notes — full width */}
      <div className="lead-form-field" style={{ paddingBottom: 14 }}>
        <label className="lead-form-label">CUSTOMER MESSAGE / NOTES</label>
        <textarea
          name="customerNotes"
          className="lead-form-textarea"
          rows={4}
          placeholder="Customer inquiry, requirements..."
          defaultValue={initialValues?.customerNotes ?? ""}
        />
      </div>

      {/* Internal Notes — full width */}
      <div className="lead-form-field" style={{ paddingBottom: 8 }}>
        <label className="lead-form-label">INTERNAL NOTES</label>
        <textarea
          name="internalNotes"
          className="lead-form-textarea"
          rows={3}
          placeholder="Internal follow-up notes..."
          defaultValue={initialValues?.internalNotes ?? ""}
        />
      </div>

      {/* Inline footer only when used standalone (no formId) */}
      {!formId && (
        <div className="lead-form-footer" style={{ marginTop: 12 }}>
          {onCancel && (
            <button type="button" className="lead-form-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={isLoading} className="lead-form-btn-save">
            {isLoading ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Save Lead")}
          </button>
        </div>
      )}
    </form>
  )
}
