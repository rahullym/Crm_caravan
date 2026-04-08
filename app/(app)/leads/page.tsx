import { prisma } from "@/lib/prisma"
import { LeadStatus } from "@prisma/client"
import Link from "next/link"
import StatusSelect from "@/components/StatusSelect"
import LeadStatusFilter from "@/components/LeadStatusFilter"
import AddLeadModal from "@/components/AddLeadModal"
import BulkUploadModal from "@/components/BulkUploadModal"
export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusFilter = status && Object.values(LeadStatus).includes(status as LeadStatus)
    ? (status as LeadStatus)
    : undefined

  const leads = await prisma.lead.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    orderBy: { createdAt: "desc" }
  })

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Leads</div>
        <div className="topbar-right">
          <LeadStatusFilter />
          <BulkUploadModal />
          <AddLeadModal />
        </div>
      </div>

      <div className="page-container">
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Leads</div>
            <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{leads.length} records</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>State</th>
                <th>Model Interest</th>
                <th>Source</th>
                <th>Status</th>
                <th>Next Action Date</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "#9CA3AF", padding: "40px" }}>
                    No leads yet. Click <strong>+ Add Lead</strong> to get started.
                  </td>
                </tr>
              ) : leads.map(lead => (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/leads/${lead.id}`} style={{ color: "var(--primary)", textDecoration: "none" }} className="hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{lead.phone}</div>
                    <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{lead.email || "—"}</div>
                  </td>
                  <td style={{ color: "#6B7280", fontSize: "13px" }}>{lead.state || "—"}</td>
                  <td style={{ color: "#6B7280", fontSize: "13px" }}>{lead.modelInterest || "—"}</td>
                  <td><span className={`badge badge-${lead.source.toLowerCase()}`}>{lead.source}</span></td>
                  <td><StatusSelect leadId={lead.id} currentStatus={lead.status} /></td>
                  <td style={{ color: "#9CA3AF", fontSize: "13px" }}>
                    {lead.nextActionDate
                      ? new Date(lead.nextActionDate).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td style={{ color: "#9CA3AF", fontSize: "13px" }}>
                    {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
