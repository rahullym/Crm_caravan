import { prisma } from "@/lib/prisma"
import { LeadStatus } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import LeadStatusFilter from "@/components/LeadStatusFilter"
import AddLeadModal from "@/components/AddLeadModal"
import BulkUploadModal from "@/components/BulkUploadModal"
import LeadsTable from "@/components/LeadsTable"

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const userId = session?.user?.id

  const { status } = await searchParams
  const statusFilter = status && Object.values(LeadStatus).includes(status as LeadStatus)
    ? (status as LeadStatus)
    : undefined

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
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
          <LeadStatusFilter />
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
          <LeadsTable leads={leads} salesUsers={salesUsers} isAdmin={isAdmin} />
        </div>
      </div>
    </>
  )
}
