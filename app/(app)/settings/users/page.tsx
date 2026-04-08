import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AddUserForm from "@/components/AddUserForm"

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true }
  })

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-title">User Management</div>
        <div className="topbar-right">
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {users.length} {users.length === 1 ? "user" : "users"}
          </span>
        </div>
      </div>

      <div className="page-container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

          {/* User List Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">System Users</div>
              <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{users.length} records</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "#9CA3AF", padding: "40px" }}>
                      No users yet.
                    </td>
                  </tr>
                ) : users.map(u => {
                  const isYou = session.user.id === u.id
                  const initial = u.email.charAt(0).toUpperCase()
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="avatar-circle" style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: 14 }}>
                              {u.email.split("@")[0]}
                              {isYou && (
                                <span style={{ marginLeft: 6, fontSize: 11, color: "var(--primary)", fontWeight: 700, background: "var(--primary-light)", padding: "1px 6px", borderRadius: 4 }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === "ADMIN" ? "badge-won" : "badge-inquiry"}`}>
                          {{ ADMIN: "Admin", SALES: "Sales", SERVICE_MANAGER: "Service Manager", TECHNICIAN: "Technician" }[u.role] ?? u.role}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {new Date(u.createdAt).toLocaleDateString("en-AU", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Add User Form */}
          <div style={{ position: "sticky", top: 24 }}>
            <AddUserForm />
          </div>

        </div>
      </div>
    </>
  )
}
