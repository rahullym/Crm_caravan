// Canonical list of lead pipeline statuses - keep this in sync with prisma/schema.prisma
export const LEAD_STATUSES = [
  { value: "NEW_LEAD",         label: "New Lead",                color: "#6B7280", bg: "#F1F5F9" },
  { value: "CONTACTED",        label: "Contacted",               color: "#2563EB", bg: "#DBEAFE" },
  { value: "ENGAGED",          label: "Engaged",                 color: "#7C3AED", bg: "#EDE9FE" },
  { value: "QUALIFIED",        label: "Qualified",               color: "#0891B2", bg: "#CFFAFE" },
  { value: "OPTIONS_SENT",     label: "Options Sent",            color: "#D97706", bg: "#FEF3C7" },
  { value: "SHORTLISTED",      label: "Considering / Shortlisted", color: "#EA580C", bg: "#FFEDD5" },
  { value: "HOT_LEAD",         label: "Hot Lead",                color: "#DC2626", bg: "#FEE2E2" },
  { value: "QUOTE_SENT",       label: "Quote / Build Spec Sent", color: "#9333EA", bg: "#F3E8FF" },
  { value: "DECISION_PENDING", label: "Decision Pending",        color: "#B45309", bg: "#FEF9C3" },
  { value: "DEPOSIT_PAID",     label: "Deposit Paid (Won)",      color: "#059669", bg: "#D1FAE5" },
  { value: "LOST",             label: "Lost / Not Now",          color: "#9CA3AF", bg: "#F3F4F6" },
] as const

export type LeadStatusValue = (typeof LEAD_STATUSES)[number]["value"]

export function getStatusMeta(value: string) {
  return LEAD_STATUSES.find(s => s.value === value) ?? {
    value,
    label: value.replace(/_/g, " "),
    color: "#6B7280",
    bg: "#F1F5F9",
  }
}
