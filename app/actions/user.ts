"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { Role } from "@prisma/client"

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "SALES", "SERVICE_MANAGER", "TECHNICIAN"]),
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
