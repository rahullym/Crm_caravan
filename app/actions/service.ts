"use server"

import { prisma } from "@/lib/prisma"
import { createServiceRequestSchema, updateServiceStatusSchema, assignTechnicianSchema } from "@/lib/validations/service"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const SERVICE_MANAGE_ROLES = ["ADMIN", "SERVICE_MANAGER"]

export async function createServiceRequest(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !SERVICE_MANAGE_ROLES.includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }
  try {
    const rawData = {
      caravanId: formData.get("caravanId"),
      description: formData.get("description"),
      technicianId: formData.get("technicianId"),
    }

    const data = createServiceRequestSchema.parse(rawData)

    const service = await prisma.serviceRequest.create({
      data: {
        caravanId: data.caravanId,
        description: data.description,
        technicianId: data.technicianId || null
      }
    })

    revalidatePath("/services")
    return { success: true, data: service }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to create service request" }
  }
}

export async function updateServiceStatus(id: string, newStatus: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !["ADMIN", "SERVICE_MANAGER", "TECHNICIAN"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }
  try {
    const data = updateServiceStatusSchema.parse({ id, status: newStatus })

    const updated = await prisma.serviceRequest.update({
      where: { id: data.id },
      data: { status: data.status }
    })

    revalidatePath("/services")
    return { success: true, data: updated }
  } catch {
    return { success: false, error: "Failed to update status." }
  }
}

export async function assignTechnician(id: string, technicianId: string | null) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !SERVICE_MANAGE_ROLES.includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }
  try {
    const data = assignTechnicianSchema.parse({ id, technicianId })

    const updated = await prisma.serviceRequest.update({
      where: { id: data.id },
      data: { technicianId: data.technicianId }
    })

    revalidatePath("/services")
    return { success: true, data: updated }
  } catch {
    return { success: false, error: "Failed to assign technician." }
  }
}
