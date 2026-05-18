import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import IntegrationCopyField from "@/components/IntegrationCopyField"
import { prisma } from "@/lib/prisma"

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

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  const baseUrl = `${proto}://${host}`

  // ── Meta status ──
  const metaWebhookUrl = `${baseUrl}/api/meta/webhook`
  const metaVerifySet = !!process.env.META_VERIFY_TOKEN
  const metaSecretSet = !!process.env.META_WEBHOOK_SECRET
  const metaTokenSet = !!process.env.META_PAGE_ACCESS_TOKEN
  const metaConfigured = metaVerifySet && metaTokenSet

  // ── Google Ads status ──
  const googleWebhookUrl = `${baseUrl}/api/google-ads/webhook`
  const googleKeySet = !!process.env.GOOGLE_ADS_WEBHOOK_KEY
  const googleConfigured = googleKeySet

  // ── Recent leads from external integrations ──
  // Wrapped because the DB enum may not yet include GOOGLE_ADS until the migration is applied.
  let recentLeads: { id: string; name: string; phone: string; source: string; createdAt: Date }[] = []
  let migrationPending = false
  try {
    recentLeads = await prisma.lead.findMany({
      where: { source: { in: ["META", "GOOGLE_ADS"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, phone: true, source: true, createdAt: true },
    })
  } catch {
    migrationPending = true
    recentLeads = await prisma.lead.findMany({
      where: { source: "META" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, phone: true, source: true, createdAt: true },
    })
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Integrations</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Admin only</div>
      </div>

      <div className="page-container">

        {migrationPending && (
          <div style={{
            padding: "12px 16px", marginBottom: 20,
            background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10,
            color: "#92400E", fontSize: 13,
          }}>
            <strong>DB migration pending.</strong> The <code>GOOGLE_ADS</code> value isn&apos;t in the <code>LeadSource</code> enum yet.
            Run <code>psql &quot;$DATABASE_URL&quot; -f prisma/migrate_lead_source_google_ads.sql</code> (or paste it into the Neon SQL editor),
            then restart the dev server.
          </div>
        )}

        {/* ───── META LEAD ADS ───── */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>Meta Lead Ads</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Receive leads from Facebook & Instagram lead ad campaigns directly into the CRM.
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px",
              background: metaConfigured ? "#D1FAE5" : "#FEF3C7",
              color: metaConfigured ? "#059669" : "#92400E",
              borderRadius: 100,
            }}>
              {metaConfigured ? "Configured" : "Setup required"}
            </span>
          </div>

          <div className="responsive-form-row" style={{ marginTop: 20 }}>
            <IntegrationCopyField
              label="Webhook URL (Callback)"
              value={metaWebhookUrl}
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

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Environment status
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                { key: "META_VERIFY_TOKEN", set: metaVerifySet, note: "Used during Meta's GET subscribe handshake" },
                { key: "META_WEBHOOK_SECRET", set: metaSecretSet, note: "App Secret — verifies HMAC signature of every webhook" },
                { key: "META_PAGE_ACCESS_TOKEN", set: metaTokenSet, note: "Required to fetch lead data via Graph API" },
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

        {/* ───── GOOGLE ADS LEAD FORMS ───── */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>Google Ads Lead Forms</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Receive leads from Google Ads lead form extensions directly into the CRM.
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px",
              background: googleConfigured ? "#D1FAE5" : "#FEF3C7",
              color: googleConfigured ? "#059669" : "#92400E",
              borderRadius: 100,
            }}>
              {googleConfigured ? "Configured" : "Setup required"}
            </span>
          </div>

          <div className="responsive-form-row" style={{ marginTop: 20 }}>
            <IntegrationCopyField
              label="Webhook URL"
              value={googleWebhookUrl}
              hint="Paste this into Google Ads → Lead form data → Webhook URL."
            />
            <IntegrationCopyField
              label="Webhook Key"
              value={process.env.GOOGLE_ADS_WEBHOOK_KEY ?? ""}
              hint="Must match what you enter in Google Ads → Lead form data → Key."
              masked
              missingLabel="Set GOOGLE_ADS_WEBHOOK_KEY in your environment"
            />
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Environment status
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "#F8FAFC", borderRadius: 8,
                border: "1px solid var(--border-color)",
              }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>GOOGLE_ADS_WEBHOOK_KEY</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Static shared secret sent by Google in every payload</div>
                </div>
                <StatusPill ok={googleKeySet} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 10 }}>How to set up</div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#991B1B", lineHeight: 1.7 }}>
              <li>Set <code>GOOGLE_ADS_WEBHOOK_KEY</code> to a long random string in your environment, then restart the server.</li>
              <li>In <a href="https://ads.google.com/" target="_blank" rel="noreferrer" style={{ color: "#991B1B", textDecoration: "underline" }}>Google Ads</a>, open <strong>Tools & Settings → Measurement → Lead form data</strong>.</li>
              <li>Click your campaign / form, then <strong>Webhook integration</strong>.</li>
              <li>Paste the Webhook URL above into the Webhook URL field, paste the Webhook Key above into the Key field.</li>
              <li>Click <strong>Send test data</strong> — you should get a 200 response. Test pings are accepted but not stored.</li>
              <li>Once a real lead is submitted from a campaign, it appears in the table below.</li>
            </ol>
          </div>
        </div>

        {/* ───── RECENT LEADS FROM INTEGRATIONS ───── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent integration leads</div>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {recentLeads.length === 0 ? "None yet" : `Showing latest ${recentLeads.length}`}
            </span>
          </div>
          {recentLeads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📥</div>
              <div className="empty-state-text">No leads from integrations yet</div>
              <div className="empty-state-hint">Once a lead comes in from Meta or Google Ads, it&apos;ll show up here.</div>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table data-table--compact">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map(l => (
                    <tr key={l.id}>
                      <td>
                        <span className={`badge badge-${l.source.toLowerCase()}`}>{l.source.replace(/_/g, " ")}</span>
                      </td>
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
