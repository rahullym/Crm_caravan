import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import KanbanBoard from "@/components/KanbanBoard"

export default async function PipelinePage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const userId = session?.user?.id

  const where = role === "SALES" ? { assignedToId: userId } : {}

  const leads = await prisma.lead.findMany({ where, orderBy: { updatedAt: "desc" } })

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          {role === "SALES" ? "My Pipeline" : "Sales Pipeline"}
        </div>
        <div style={{ fontSize: "13px", color: "#9CA3AF" }}>Drag cards to update stage</div>
      </div>
      <div className="page-container">
        <KanbanBoard initialLeads={leads} />
      </div>
    </>
  )
}
