"use server"

import { prisma } from "@/lib/prisma"
import { createLeadSchema, updateLeadSchema, updateLeadStatusSchema } from "@/lib/validations/lead"
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
      status: formData.get("status") as string || "NEW_LEAD",
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

    // SALES users: auto-assign the lead to themselves
    const assignedToId =
      session.user.role === "ADMIN"
        ? (formData.get("assignedToId") as string | null) || null
        : session.user.id

    const lead = await prisma.lead.create({
      data: {
        ...(parsedData as Prisma.LeadCreateInput),
        ...(assignedToId ? { assignedTo: { connect: { id: assignedToId } } } : {}),
      }
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


export async function updateLead(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !LEAD_ROLES.includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }

  // SALES can only edit their own assigned leads
  if (session.user.role === "SALES") {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { assignedToId: true } })
    if (!lead || lead.assignedToId !== session.user.id) {
      return { success: false, error: "Unauthorized" }
    }
  }

  try {
    const rawData = {
      id: leadId,
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      state: formData.get("state") as string,
      source: formData.get("source") as string,
      status: formData.get("status") as string,
      modelInterest: formData.get("modelInterest") as string,
      size: formData.get("size") as string,
      actionChannel: formData.get("actionChannel") as string,
      nextAction: formData.get("nextAction") as string,
      firstContactDate: formData.get("firstContactDate") as string,
      nextActionDate: formData.get("nextActionDate") as string,
      customerNotes: formData.get("customerNotes") as string,
      internalNotes: formData.get("internalNotes") as string,
    }

    const parsedData = updateLeadSchema.parse(rawData)
    const { id, ...data } = parsedData

    // Check phone uniqueness only if phone changed
    const existing = await prisma.lead.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Lead not found." }

    if (data.phone && data.phone !== existing.phone) {
      const phoneConflict = await prisma.lead.findUnique({ where: { phone: data.phone } })
      if (phoneConflict) return { success: false, error: "A lead with this phone number already exists." }
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: data as Prisma.LeadUpdateInput,
    })

    revalidatePath("/leads")
    revalidatePath(`/leads/${id}`)
    return { success: true, data: updatedLead }

  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => e.message).join(", ")
      return { success: false, error: errorMessages }
    }
    return { success: false, error: "Failed to update lead." }
  }
}


export async function deleteLead(leadId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !LEAD_ROLES.includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }

  // SALES: can only delete leads assigned to them
  if (session.user.role === "SALES") {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { assignedToId: true } })
    if (!lead || lead.assignedToId !== session.user.id) {
      return { success: false, error: "You can only delete leads assigned to you." }
    }
  }

  try {
    await prisma.lead.delete({ where: { id: leadId } })
    revalidatePath("/leads")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete lead." }
  }
}


export async function updateLeadStatus(leadId: string, newStatus: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !LEAD_ROLES.includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }

  // SALES users can only update their assigned leads
  if (session.user.role === "SALES") {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { assignedToId: true } })
    if (!lead || lead.assignedToId !== session.user.id) {
      return { success: false, error: "Unauthorized" }
    }
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


export async function assignLead(leadId: string, userId: string | null) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { assignedToId: userId }
    })

    revalidatePath("/leads", "layout")
    revalidatePath(`/leads/${leadId}`)
    return { success: true }
  } catch {
    return { success: false, error: "Failed to assign lead." }
  }
}


export async function bulkAssignLeads(leadIds: string[], userId: string | null) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  if (leadIds.length === 0) {
    return { success: false, error: "No leads selected." }
  }

  try {
    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { assignedToId: userId }
    })

    revalidatePath("/leads", "layout")
    return { success: true, count: leadIds.length }
  } catch {
    return { success: false, error: "Failed to bulk assign leads." }
  }
}
