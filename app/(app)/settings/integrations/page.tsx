import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import IntegrationCopyField from "@/components/IntegrationCopyField"
import { prisma } from "@/lib/prisma"

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  // Build the public webhook URL from the request
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  const webhookUrl = `${proto}://${host}/api/meta/webhook`

  const verifyTokenSet = !!process.env.META_VERIFY_TOKEN
  const secretSet = !!process.env.META_WEBHOOK_SECRET
  const pageTokenSet = !!process.env.META_PAGE_ACCESS_TOKEN

  // Last 5 META leads for visibility
  const recentMetaLeads = await prisma.lead.findMany({
    where: { source: "META" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, phone: true, createdAt: true },
  })

  function StatusPill({ ok }: { ok: boolean }) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "3px 9px",
        background: ok ? "#D1FAE5" : "#FEE2E2",
        color: ok ? "#059669" : "#B91C1C",
        borderRadius: 100,
      }}>
        {ok ? "✓ Set" : "✗ Missing"}
      </span>
    )
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Integrations</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Admin only</div>
      </div>

      <div className="page-container">
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>
                Meta Lead Ads
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Receive leads from Facebook & Instagram lead ad campaigns directly into the CRM.
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px",
              background: verifyTokenSet && pageTokenSet ? "#D1FAE5" : "#FEF3C7",
              color: verifyTokenSet && pageTokenSet ? "#059669" : "#92400E",
              borderRadius: 100,
            }}>
              {verifyTokenSet && pageTokenSet ? "Configured" : "Setup required"}
            </span>
          </div>

          {/* ── Connection details ── */}
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <IntegrationCopyField
              label="Webhook URL (Callback)"
              value={webhookUrl}
              hint="Paste this into Meta App → Webhooks → Page → Callback URL."
            />
            <IntegrationCopyField
              label="Verify Token"
              value={process.env.META_VERIFY_TOKEN ?? ""}
              hint="Must match what you enter in Meta App → Webhooks → Verify Token."
              masked
              missingLabel="Set META_VERIFY_TOKEN in your environment"
            />
          </div>

          {/* ── Env var status ── */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Environment status
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                { key: "META_VERIFY_TOKEN", set: verifyTokenSet, note: "Used during Meta's GET subscribe handshake" },
                { key: "META_WEBHOOK_SECRET", set: secretSet, note: "App Secret — verifies HMAC signature of every webhook" },
                { key: "META_PAGE_ACCESS_TOKEN", set: pageTokenSet, note: "Required to fetch lead data via Graph API" },
              ].map(row => (
                <div key={row.key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", background: "#F8FAFC", borderRadius: 8,
                  border: "1px solid var(--border-color)",
                }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{row.key}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{row.note}</div>
                  </div>
                  <StatusPill ok={row.set} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Setup steps ── */}
          <div style={{ marginTop: 24, padding: 16, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#3730A3", marginBottom: 10 }}>How to set up</div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#3730A3", lineHeight: 1.7 }}>
              <li>Set <code>META_VERIFY_TOKEN</code>, <code>META_WEBHOOK_SECRET</code>, and <code>META_PAGE_ACCESS_TOKEN</code> in your environment, then restart the server.</li>
              <li>In <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" style={{ color: "#3730A3", textDecoration: "underline" }}>Meta for Developers</a>, open your App → <strong>Webhooks</strong> → <strong>Page</strong> → Subscribe.</li>
              <li>Set the Callback URL to the URL above and the Verify Token to the value above. Click <strong>Verify and Save</strong>.</li>
              <li>Subscribe to the <code>leadgen</code> field for your Page.</li>
              <li>In your Page&apos;s <strong>Lead Ads CRM Setup</strong>, ensure the System User has the <code>leads_retrieval</code> permission.</li>
              <li>Submit a test lead from the Lead Ads Testing Tool — it should appear in the table below within a few seconds.</li>
            </ol>
          </div>
        </div>

        {/* ── Recent META leads ── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Meta leads</div>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {recentMetaLeads.length === 0 ? "None yet" : `Showing latest ${recentMetaLeads.length}`}
            </span>
          </div>
          {recentMetaLeads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📥</div>
              <div className="empty-state-text">No Meta leads yet</div>
              <div className="empty-state-hint">Once a lead comes in from your campaign, it&apos;ll show up here.</div>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table data-table--compact">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMetaLeads.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>
                        <a href={`/leads/${l.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{l.name}</a>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{l.phone}</td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {new Date(l.createdAt).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
