import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function DashboardPage() {
  const [totalLeads, convertedLeads, activeDeals, pendingServices] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.lead.count({ where: { status: { in: ["DEMO", "NEGOTIATION"] } } }),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
  ])

  const recentLeads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const recentFollowUps = await prisma.leadFollowUp.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      lead: { select: { id: true, name: true } },
      author: { select: { email: true } }
    }
  })

  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(0) : 0

  const formatDateTime = (d: Date) =>
    new Date(d).toLocaleString("en-AU", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit"
    })

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-title">Dashboard</div>
        <div className="topbar-right">
          <div className="topbar-avatar">
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>Welcome back</div>
              <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Here&apos;s what&apos;s happening</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        {/* Stats Grid */}
        <div className="dashboard-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Leads</div>
            <div className="stat-value">{totalLeads}</div>
            <div className="stat-badge purple">{conversionRate}% conversion</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Converted</div>
            <div className="stat-value">{convertedLeads}</div>
            <div className="stat-badge green">↑ Won deals</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Deals</div>
            <div className="stat-value">{activeDeals}</div>
            <div className="stat-badge blue">In pipeline</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Services</div>
            <div className="stat-value">{pendingServices}</div>
            <div className="stat-badge orange">Requires action</div>
          </div>
        </div>

        <div className="dashboard-main-grid">
          {/* Main Feed Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Recent Leads */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Recent Leads</div>
                <Link href="/leads" style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                  View all →
                </Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Source</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#9CA3AF", padding: "32px" }}>No leads yet</td>
                    </tr>
                  ) : recentLeads.map(lead => (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 600 }}>
                        <Link href={`/leads/${lead.id}`} style={{ color: "#1a1a2e", textDecoration: "none" }} className="hover:underline">
                          {lead.name}
                        </Link>
                      </td>
                      <td style={{ color: "#6B7280" }}>{lead.phone}</td>
                      <td>
                        <span className={`badge badge-${lead.source.toLowerCase()}`}>{lead.source}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${lead.status.toLowerCase()}`}>{lead.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent Follow-Ups */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Recent Follow-Ups</div>
              </div>
              <div>
                {recentFollowUps.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "#9CA3AF" }}>No follow-up activity yet.</div>
                ) : (
                  recentFollowUps.map((fu, idx) => (
                    <div key={fu.id} style={{
                      padding: "16px 20px",
                      borderBottom: idx < recentFollowUps.length - 1 ? "1px solid var(--border-color)" : "none"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Link href={`/leads/${fu.leadId}`} style={{ fontWeight: 600, color: "var(--primary)", textDecoration: "none" }} className="hover:underline">
                            {fu.lead.name}
                          </Link>
                          {fu.channel && (
                            <span style={{ fontSize: 11, background: "#F1F5F9", color: "#475569", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                              {fu.channel.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>{formatDateTime(fu.createdAt)}</div>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-main)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {fu.notes}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Nav Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a2e", marginBottom: "4px" }}>Quick Access</div>
            <Link href="/leads" className="quick-link">
              <div className="quick-link-icon" style={{ background: "#EFF6FF" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth={2}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <div className="quick-link-title">Leads</div>
                <div className="quick-link-sub">{totalLeads} total leads</div>
              </div>
            </Link>
            <Link href="/pipeline" className="quick-link">
              <div className="quick-link-icon" style={{ background: "var(--primary-light)" }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth={2}>
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
              </div>
              <div>
                <div className="quick-link-title">Pipeline</div>
                <div className="quick-link-sub">{activeDeals} active deals</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
