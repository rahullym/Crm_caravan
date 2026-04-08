import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function ReportsPage() {
  const [
    totalLeads,
    wonLeads,
    lostLeads,
    leadsByStatus,
    leadsBySource,
    followUpCount,
    followUpsByChannel,
    recentWins,
    leadsThisMonth,
    leadsLastMonth,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.lead.count({ where: { status: "LOST" } }),
    prisma.lead.groupBy({ by: ["status"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.lead.groupBy({ by: ["source"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.leadFollowUp.count(),
    prisma.leadFollowUp.groupBy({ by: ["channel"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.lead.findMany({ where: { status: "WON" }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, name: true, modelInterest: true, updatedAt: true } }),
    prisma.lead.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.lead.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
  ])

  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0"
  const activeLeads = totalLeads - wonLeads - lostLeads
  const leadGrowth = leadsLastMonth > 0
    ? (((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100).toFixed(0)
    : leadsThisMonth > 0 ? "+100" : "0"

  const statusColors: Record<string, string> = {
    INQUIRY: "#6366F1", CONTACTED: "#3B82F6", DEMO: "#8B5CF6",
    NEGOTIATION: "#F59E0B", WON: "#10B981", LOST: "#EF4444", COLD: "#94A3B8"
  }

  const sourceColors: Record<string, string> = {
    FACEBOOK: "#1877F2", INSTAGRAM: "#E1306C", WEBSITE: "#10B981",
    REFERRAL: "#F59E0B", WALK_IN: "#8B5CF6", EMAIL: "#3B82F6", OTHER: "#94A3B8"
  }

  const channelColors: Record<string, string> = {
    PHONE_CALL: "#3B82F6", SMS: "#10B981", EMAIL: "#6366F1",
    IN_PERSON: "#F59E0B", VIDEO_CALL: "#8B5CF6", OTHER: "#94A3B8"
  }

  const maxStatusCount = Math.max(...leadsByStatus.map(s => s._count.id), 1)
  const maxSourceCount = Math.max(...leadsBySource.map(s => s._count.id), 1)

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Reports</div>
        <div className="topbar-right">
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      <div className="page-container">

        {/* KPI Stats */}
        <div className="dashboard-stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Leads</div>
            <div className="stat-value">{totalLeads}</div>
            <div className="stat-badge blue">All time</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Conversion Rate</div>
            <div className="stat-value">{conversionRate}%</div>
            <div className="stat-badge green">{wonLeads} won</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Pipeline</div>
            <div className="stat-value">{activeLeads}</div>
            <div className="stat-badge purple">In progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">This Month</div>
            <div className="stat-value">{leadsThisMonth}</div>
            <div className={`stat-badge ${Number(leadGrowth) >= 0 ? "green" : "orange"}`}>
              {Number(leadGrowth) >= 0 ? "↑" : "↓"} {Math.abs(Number(leadGrowth))}% vs last month
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

          {/* Leads by Status */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Leads by Status</div>
            </div>
            <div style={{ padding: "4px 20px 20px" }}>
              {leadsByStatus.map(row => (
                <div key={row.status} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                      {row.status}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {row._count.id} ({totalLeads > 0 ? ((row._count.id / totalLeads) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(row._count.id / maxStatusCount) * 100}%`,
                      background: statusColors[row.status] ?? "#CBD5E1",
                      borderRadius: 99,
                      transition: "width 0.6s ease"
                    }} />
                  </div>
                </div>
              ))}
              {leadsByStatus.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No data yet</p>
              )}
            </div>
          </div>

          {/* Leads by Source */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Leads by Source</div>
            </div>
            <div style={{ padding: "4px 20px 20px" }}>
              {leadsBySource.map(row => (
                <div key={row.source} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                      {row.source.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {row._count.id} ({totalLeads > 0 ? ((row._count.id / totalLeads) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(row._count.id / maxSourceCount) * 100}%`,
                      background: sourceColors[row.source] ?? "#CBD5E1",
                      borderRadius: 99,
                      transition: "width 0.6s ease"
                    }} />
                  </div>
                </div>
              ))}
              {leadsBySource.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No data yet</p>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Follow-up Activity */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Follow-Up Activity</div>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{followUpCount} total</span>
            </div>
            <div style={{ padding: "4px 20px 20px" }}>
              {followUpsByChannel.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No follow-ups logged yet</p>
              ) : (
                followUpsByChannel.map(row => (
                  <div key={row.channel ?? "unknown"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: channelColors[row.channel ?? "OTHER"] ?? "#94A3B8", flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>
                        {(row.channel ?? "UNKNOWN").replace(/_/g, " ")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{row._count.id}</span>
                      <span style={{ fontSize: 11, background: "var(--primary-light)", color: "var(--primary)", padding: "2px 7px", borderRadius: 99, fontWeight: 700 }}>
                        {followUpCount > 0 ? ((row._count.id / followUpCount) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Wins */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Wins</div>
              <Link href="/leads?status=WON" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                View all →
              </Link>
            </div>
            <div>
              {recentWins.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>No won deals yet</p>
              ) : recentWins.map((lead, idx) => (
                <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: idx < recentWins.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2.5}>
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                    <div>
                      <Link href={`/leads/${lead.id}`} style={{ fontWeight: 600, color: "var(--text-main)", textDecoration: "none", fontSize: 14 }}>
                        {lead.name}
                      </Link>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{lead.modelInterest || "—"}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(lead.updatedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
