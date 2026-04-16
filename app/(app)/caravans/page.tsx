import { prisma } from "@/lib/prisma"
import CaravanForm from "@/components/CaravanForm"
import DeleteCaravanButton from "@/components/DeleteCaravanButton"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CaravansPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const caravans = await prisma.caravan.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Inventory</div>
        <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{caravans.length} caravans</span>
      </div>
      <div className="page-container" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", alignItems: "start" }}>
        <CaravanForm />
        <div className="card">
          <div className="card-header">
            <div className="card-title">Caravan Inventory</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Year</th>
                <th>Price</th>
                <th>VIN</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {caravans.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#9CA3AF", padding: "40px" }}>No caravans in inventory.</td>
                </tr>
              ) : caravans.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: "#1a1a2e" }}>{c.make} {c.model}</td>
                  <td>{c.year}</td>
                  <td style={{ color: "#059669", fontWeight: 600 }}>${c.price.toLocaleString()}</td>
                  <td style={{ color: "#9CA3AF", fontSize: "12px", fontFamily: "monospace" }}>{c.vin || "—"}</td>
                  <td><DeleteCaravanButton id={c.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
