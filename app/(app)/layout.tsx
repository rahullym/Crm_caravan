import Sidebar from "@/components/Sidebar"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Caravan CRM",
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
