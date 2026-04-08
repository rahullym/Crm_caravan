"use server"

import { prisma } from "@/lib/prisma"
import { createLeadSchema, updateLeadStatusSchema } from "@/lib/validations/lead"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Prisma } from "@prisma/client"

const LEAD_ROLES = ["ADMIN", "SALES"]

export async function createLead(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !LEAD_ROLES.includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }
  try {
    const rawData = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      state: formData.get("state") as string,
      source: formData.get("source") as string || "OTHER",
      status: formData.get("status") as string || "INQUIRY",
      modelInterest: formData.get("modelInterest") as string,
      size: formData.get("size") as string,
      actionChannel: formData.get("actionChannel") as string,
      nextAction: formData.get("nextAction") as string,
      firstContactDate: formData.get("firstContactDate") as string,
      nextActionDate: formData.get("nextActionDate") as string,
      customerNotes: formData.get("customerNotes") as string,
      internalNotes: formData.get("internalNotes") as string,
    }

    const parsedData = createLeadSchema.parse(rawData)

    const existingLead = await prisma.lead.findUnique({
      where: { phone: parsedData.phone }
    })

    if (existingLead) {
      return { success: false, error: "A lead with this phone number already exists." }
    }

    const lead = await prisma.lead.create({
      data: parsedData as Prisma.LeadCreateInput
    })

    revalidatePath("/leads")
    return { success: true, data: lead }

  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => e.message).join(", ")
      return { success: false, error: errorMessages }
    }
    return { success: false, error: "Failed to create lead." }
  }
}


export async function updateLeadStatus(leadId: string, newStatus: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !LEAD_ROLES.includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }
  try {
    const parsedData = updateLeadStatusSchema.parse({ id: leadId, status: newStatus })

    const updatedLead = await prisma.lead.update({
      where: { id: parsedData.id },
      data: { status: parsedData.status }
    })

    revalidatePath("/leads", "layout")
    return { success: true, data: updatedLead }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid status update" }
    }
    return { success: false, error: "Failed to update lead status" }
  }
}
