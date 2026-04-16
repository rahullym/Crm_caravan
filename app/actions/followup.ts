"use server"

import { prisma } from "@/lib/prisma"
import { ActionChannel, NextAction } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const FOLLOWUP_ROLES = ["ADMIN", "SALES"]

export async function addFollowUp(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !FOLLOWUP_ROLES.includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }

  if (session.user.role === "SALES") {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { assignedToId: true } })
    if (!lead || lead.assignedToId !== session.user.id) {
      return { success: false, error: "You can only log follow-ups on leads assigned to you." }
    }
  }

  const notes = formData.get("notes") as string
  if (!notes?.trim()) return { success: false, error: "Notes are required" }

  const channel = (formData.get("channel") as string) || undefined
  const nextAction = (formData.get("nextAction") as string) || undefined
  const nextActionDateRaw = formData.get("nextActionDate") as string

  try {
    // Find user ID from session email
    const user = await prisma.user.findUnique({ where: { email: session.user.email! }, select: { id: true } })

    await prisma.leadFollowUp.create({
      data: {
        leadId,
        notes: notes.trim(),
        channel: channel as ActionChannel | undefined,
        nextAction: nextAction as NextAction | undefined,
        nextActionDate: nextActionDateRaw ? new Date(nextActionDateRaw) : null,
        authorId: user?.id ?? null,
      }
    })

    // Also update the lead's nextAction + nextActionDate if provided
    if (nextAction || nextActionDateRaw) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          ...(nextAction ? { nextAction: nextAction as NextAction } : {}),
          ...(channel ? { actionChannel: channel as ActionChannel } : {}),
          ...(nextActionDateRaw ? { nextActionDate: new Date(nextActionDateRaw) } : {}),
        }
      })
    }

    revalidatePath(`/leads/${leadId}`)
    return { success: true }
  } catch {
    return { success: false, error: "Failed to save follow-up" }
  }
}
