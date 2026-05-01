"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { Role } from "@prisma/client"

const ROLE_VALUES = ["ADMIN", "SALES", "SERVICE_MANAGER", "TECHNICIAN"] as const

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(ROLE_VALUES),
})

const updateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(ROLE_VALUES),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")).transform(v => v || undefined),
})

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions)
  // Ensure ONLY an ADMIN can create a new user
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Only admins can create users." }
  }

  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    }

    const { email, password, role } = createUserSchema.parse(rawData)

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { success: false, error: "A user with this email already exists." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as Role,
      }
    })

    revalidatePath("/settings/users")
    return { success: true, data: { email: user.email, role: user.role } }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to create user." }
  }
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Only admins can edit users." }
  }

  try {
    const parsed = updateUserSchema.parse({
      email: formData.get("email"),
      role: formData.get("role"),
      password: formData.get("password") ?? "",
    })

    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target) return { success: false, error: "User not found." }

    // Prevent demoting the last remaining admin
    if (target.role === "ADMIN" && parsed.role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
      if (adminCount <= 1) {
        return { success: false, error: "Cannot change role: this is the last remaining admin." }
      }
    }

    // Email uniqueness check (only if it changed)
    if (parsed.email !== target.email) {
      const conflict = await prisma.user.findUnique({ where: { email: parsed.email } })
      if (conflict) return { success: false, error: "A user with this email already exists." }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: parsed.email,
        role: parsed.role as Role,
        ...(parsed.password ? { password: await bcrypt.hash(parsed.password, 10) } : {}),
      },
    })

    revalidatePath("/settings/users")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to update user." }
  }
}

export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Only admins can delete users." }
  }

  if (session.user.id === userId) {
    return { success: false, error: "You cannot delete your own account." }
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return { success: false, error: "User not found." }

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1) {
      return { success: false, error: "Cannot delete the last remaining admin." }
    }
  }

  try {
    // Detach related records first so the user row can be removed cleanly.
    // Foreign keys are nullable; we just null them out to keep history.
    await prisma.$transaction([
      prisma.lead.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } }),
      prisma.leadFollowUp.updateMany({ where: { authorId: userId }, data: { authorId: null } }),
      prisma.serviceRequest.updateMany({ where: { technicianId: userId }, data: { technicianId: null } }),
      prisma.user.delete({ where: { id: userId } }),
    ])

    revalidatePath("/settings/users")
    revalidatePath("/leads")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete user." }
  }
}
