import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import StatusSelect from "@/components/StatusSelect"
import AddFollowUpForm from "@/components/AddFollowUpForm"
import AssignLeadSelect from "@/components/AssignLeadSelect"

export default async function LeadDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const userId = session?.user?.id

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, email: true } },
      followUps: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { email: true } } }
      }
    }
  })

  if (!lead) notFound()

  // SALES users can only view their assigned leads
  if (role === "SALES" && lead.assignedToId !== userId) {
    redirect("/leads")
  }

  const salesUsers = role === "ADMIN"
    ? await prisma.user.findMany({
        where: { role: "SALES" },
        select: { id: true, email: true },
        orderBy: { email: "asc" },
      })
    : []

  const formatEnum = (val: string | null | undefined) =>
    val ? val.replace(/_/g, " ") : "—"

  const formatDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—"

  const formatDateTime = (d: Date) =>
    new Date(d).toLocaleString("en-AU", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    })

  const CHANNEL_COLORS: Record<string, { bg: string; color: string }> = {
    PHONE_CALL:   { bg: "#DBEAFE", color: "#1E40AF" },
    EMAIL:        { bg: "#EFF6FF", color: "#2563EB" },
    SMS:          { bg: "#F0FDF4", color: "#15803D" },
    WALK_IN:      { bg: "#FDF4FF", color: "#7E22CE" },
    SOCIAL_MEDIA: { bg: "#FFEDD5", color: "#C2410C" },
    OTHER:        { bg: "#F1F5F9", color: "#475569" },
  }

  return (
    <>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/leads" style={{ color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>
            {role === "SALES" ? "My Leads" : "Leads"}
          </Link>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span>{lead.name}</span>
        </div>
        <div className="topbar-right">
          <StatusSelect leadId={lead.id} currentStatus={lead.status} />
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="page-container">

        {/* ── Quick Stat Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Phone</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", marginTop: 4 }}>{lead.phone}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Email</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", marginTop: 4, wordBreak: "break-all" }}>
              {lead.email ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">State</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>
              {lead.state ?? <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>—</span>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Follow-Ups</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "var(--primary)", marginTop: 4, letterSpacing: -1 }}>
              {lead.followUps.length}
            </div>
          </div>
        </div>

        {/* ── Main 3-col grid: details | follow-up form | history ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* ── COL 1: Lead Details ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Assignment (Admin only) */}
            {role === "ADMIN" && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Assigned Agent</div>
                  {lead.assignedTo ? (
                    <span className="stat-badge blue">{lead.assignedTo.email.split("@")[0]}</span>
                  ) : (
                    <span className="stat-badge orange">Unassigned</span>
                  )}
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <div className="stat-label" style={{ marginBottom: 8 }}>Assign to</div>
                  <AssignLeadSelect
                    leadId={lead.id}
                    currentAssignedId={lead.assignedToId}
                    users={salesUsers}
                  />
                </div>
              </div>
            )}

            {/* Assigned to label (SALES view) */}
            {role === "SALES" && lead.assignedTo && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Assigned To</div>
                  <span className="stat-badge blue">You</span>
                </div>
              </div>
            )}

            {/* Caravan Interest */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Caravan Interest</div>
                <span className={`badge badge-${lead.source.toLowerCase()}`}>{lead.source}</span>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div className="stat-label">Model</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", marginTop: 3 }}>
                    {lead.modelInterest ?? <span style={{ color: "var(--text-muted)" }}>Not specified</span>}
                  </div>
                </div>
                <div style={{ height: 1, background: "var(--border-color)" }} />
                <div>
                  <div className="stat-label">Size</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", marginTop: 3 }}>
                    {lead.size ?? <span style={{ color: "var(--text-muted)" }}>Not specified</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Action Plan */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Current Action Plan</div>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div className="stat-label">Channel</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", marginTop: 3 }}>
                    {formatEnum(lead.actionChannel)}
                  </div>
                </div>
                <div style={{ height: 1, background: "var(--border-color)" }} />
                <div>
                  <div className="stat-label">Next Action</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", marginTop: 3 }}>
                    {formatEnum(lead.nextAction)}
                  </div>
                </div>
                <div style={{ height: 1, background: "var(--border-color)" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div className="stat-label">First Contact</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", marginTop: 3 }}>
                      {formatDate(lead.firstContactDate)}
                    </div>
                  </div>
                  <div>
                    <div className="stat-label">Next Action Due</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: lead.nextActionDate ? "var(--primary)" : "var(--text-muted)", marginTop: 3 }}>
                      {formatDate(lead.nextActionDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer + Internal Notes */}
            {lead.customerNotes && (
              <div className="card">
                <div className="card-header"><div className="card-title">Customer Notes</div></div>
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ fontSize: 13, color: "var(--text-main)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{lead.customerNotes}</p>
                </div>
              </div>
            )}

            {lead.internalNotes && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Internal Notes</div>
                  <span className="stat-badge orange">Team Only</span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ fontSize: 13, color: "var(--text-main)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{lead.internalNotes}</p>
                </div>
              </div>
            )}

          </div>

          {/* ── COL 2: Log Follow-Up form ── */}
          <div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Log Follow-Up</div>
                <span className="stat-badge blue">New Entry</span>
              </div>
              <div style={{ padding: "20px" }}>
                <AddFollowUpForm leadId={lead.id} />
              </div>
            </div>
          </div>

          {/* ── COL 3: Follow-Up History timeline ── */}
          <div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Follow-Up History</div>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{lead.followUps.length} entries</span>
              </div>

              {lead.followUps.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No follow-ups yet.<br />Log the first one!</div>
                </div>
              ) : (
                <div style={{ padding: "8px 0" }}>
                  {lead.followUps.map((fu, idx) => {
                    const chStyle = fu.channel ? CHANNEL_COLORS[fu.channel] ?? CHANNEL_COLORS.OTHER : CHANNEL_COLORS.OTHER
                    return (
                      <div
                        key={fu.id}
                        style={{
                          padding: "16px 20px",
                          borderBottom: idx < lead.followUps.length - 1 ? "1px solid var(--border-color)" : "none",
                          position: "relative"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {fu.channel && (
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: "2px 8px",
                                borderRadius: 100, background: chStyle.bg, color: chStyle.color
                              }}>
                                {fu.channel.replace(/_/g, " ")}
                              </span>
                            )}
                            {fu.nextAction && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
                                → {fu.nextAction.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {formatDateTime(fu.createdAt)}
                          </span>
                        </div>

                        <p style={{ fontSize: 13, color: "var(--text-main)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                          {fu.notes}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            by {fu.author?.email ?? "Unknown"}
                          </span>
                          {fu.nextActionDate && (
                            <span style={{
                              fontSize: 11, fontWeight: 700, color: "var(--primary)",
                              background: "var(--primary-light)", padding: "2px 8px", borderRadius: 100
                            }}>
                              Due {formatDate(fu.nextActionDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
