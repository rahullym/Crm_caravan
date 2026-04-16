import { prisma } from "@/lib/prisma"
import ServiceForm from "@/components/ServiceForm"
import ServiceStatusSelect from "@/components/ServiceStatusSelect"
import TechnicianSelect from "@/components/TechnicianSelect"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

const SERVICE_PAGE_ROLES = ["ADMIN", "SERVICE_MANAGER", "TECHNICIAN"]

export default async function ServicesPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!role || !SERVICE_PAGE_ROLES.includes(role)) redirect("/dashboard")

  const technicianId = session!.user!.id

  const caravans = await prisma.caravan.findMany({ select: { id: true, make: true, model: true, vin: true } })
  const technicians = await prisma.user.findMany({ where: { role: "TECHNICIAN" }, select: { id: true, email: true } })
  const services = await prisma.serviceRequest.findMany({
    where: role === "TECHNICIAN" ? { technicianId } : {},
    include: { caravan: true, technician: { select: { email: true } } },
    orderBy: { createdAt: "desc" }
  })

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Services</div>
        <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{services.length} requests</span>
      </div>
      <div className="page-container" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", alignItems: "start" }}>
        <ServiceForm caravans={caravans} technicians={technicians} />
        <div className="card">
          <div className="card-header">
            <div className="card-title">Service Requests</div>
          </div>
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Caravan</th>
                <th>Issue</th>
                <th>Technician</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#9CA3AF", padding: "40px" }}>No service requests.</td>
                </tr>
              ) : services.map(req => (
                <tr key={req.id}>
                  <td style={{ color: "#9CA3AF", fontSize: "12px", fontFamily: "monospace" }}>{req.id.slice(0, 8)}</td>
                  <td style={{ fontWeight: 600, color: "#1a1a2e" }}>{req.caravan.make} {req.caravan.model}</td>
                  <td style={{ maxWidth: "200px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#6B7280", fontSize: "13px" }} title={req.description}>
                      {req.description}
                    </div>
                  </td>
                  <td>
                    <TechnicianSelect serviceId={req.id} currentTechnicianId={req.technicianId} technicians={technicians} />
                  </td>
                  <td>
                    <ServiceStatusSelect serviceId={req.id} currentStatus={req.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  )
}
