import { prisma } from "@/lib/prisma"
import { LeadStatus, LeadSource } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import LeadStatusFilter from "@/components/LeadStatusFilter"
import AddLeadModal from "@/components/AddLeadModal"
import BulkUploadModal from "@/components/BulkUploadModal"
import LeadsTable from "@/components/LeadsTable"

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; state?: string; assignedTo?: string }>
}) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const userId = session?.user?.id

  const params = await searchParams
  const statusFilter = params.status && Object.values(LeadStatus).includes(params.status as LeadStatus)
    ? (params.status as LeadStatus)
    : undefined
  const sourceFilter = params.source && Object.values(LeadSource).includes(params.source as LeadSource)
    ? (params.source as LeadSource)
    : undefined
  const stateFilter = params.state || undefined
  const assignedToFilter = params.assignedTo || undefined

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(sourceFilter ? { source: sourceFilter } : {}),
    ...(stateFilter ? { state: stateFilter } : {}),
    ...(assignedToFilter === "unassigned"
      ? { assignedToId: null }
      : assignedToFilter
        ? { assignedToId: assignedToFilter }
        : {}),
    ...(role === "SALES" ? { assignedToId: userId } : {}),
  }

  const [leads, salesUsers] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { assignedTo: { select: { id: true, email: true } } },
    }),
    role === "ADMIN"
      ? prisma.user.findMany({
          where: { role: "SALES" },
          select: { id: true, email: true },
          orderBy: { email: "asc" },
        })
      : Promise.resolve([]),
  ])

  const isAdmin = role === "ADMIN"

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          {role === "SALES" ? "My Leads" : "Leads"}
        </div>
        <div className="topbar-right">
          <LeadStatusFilter salesUsers={salesUsers} isAdmin={isAdmin} />
          {isAdmin && <BulkUploadModal />}
          <AddLeadModal />
        </div>
      </div>

      <div className="page-container">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              {role === "SALES" ? "Assigned to Me" : "All Leads"}
            </div>
            <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{leads.length} records</span>
          </div>
          <LeadsTable leads={leads} salesUsers={salesUsers} isAdmin={isAdmin} currentUserId={userId} />
        </div>
      </div>
    </>
  )
}
