import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPipelineStages } from "@/app/actions/pipeline"
import PipelineStagesEditor from "@/components/PipelineStagesEditor"

export default async function PipelineSettingsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") redirect("/leads")

  const stages = await getPipelineStages()

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Pipeline Stages</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Admin only — changes apply to all users
        </div>
      </div>

      <div className="page-container">
        {/* Info card */}
        <div style={{
          background: "#EEF2FF",
          border: "1px solid #C7D2FE",
          borderRadius: 10,
          padding: "14px 18px",
          marginBottom: 20,
          fontSize: 13,
          color: "#3730A3",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <div>
            <strong>Note:</strong> Stage labels, colors and order are customisable. Visibility hides a stage from the pipeline board and status filter — existing leads keep their status.
            The underlying DB key (shown in grey) never changes.
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <PipelineStagesEditor initialStages={stages} />
        </div>
      </div>
    </>
  )
}
