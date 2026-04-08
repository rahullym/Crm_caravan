import { prisma } from "@/lib/prisma"
import KanbanBoard from "@/components/KanbanBoard"

export default async function PipelinePage() {
  const leads = await prisma.lead.findMany({ orderBy: { updatedAt: "desc" } })

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Sales Pipeline</div>
        <div style={{ fontSize: "13px", color: "#9CA3AF" }}>Drag cards to update stage</div>
      </div>
      <div className="page-container">
        <KanbanBoard initialLeads={leads} />
      </div>
    </>
  )
}
