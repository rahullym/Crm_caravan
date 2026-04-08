"use server"

import { prisma } from "@/lib/prisma"
import { caravanSchema, updateCaravanSchema } from "@/lib/validations/caravan"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function createCaravan(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }
  try {
    const rawData = {
      make: formData.get("make"),
      model: formData.get("model"),
      year: formData.get("year"),
      price: formData.get("price"),
      vin: formData.get("vin"),
    }

    const data = caravanSchema.parse(rawData)

    // Optional: enforce unique VIN if provided
    if (data.vin) {
      const existing = await prisma.caravan.findUnique({ where: { vin: data.vin } })
      if (existing) {
        return { success: false, error: "A caravan with this VIN already exists." }
      }
    }

    const caravan = await prisma.caravan.create({
      data: {
        make: data.make,
        model: data.model,
        year: data.year,
        price: data.price,
        vin: data.vin || null
      }
    })

    revalidatePath("/caravans")
    return { success: true, data: caravan }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to create caravan" }
  }
}

export async function updateCaravan(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }
  try {
    const rawData = {
      id,
      make: formData.get("make") || undefined,
      model: formData.get("model") || undefined,
      year: formData.get("year") || undefined,
      price: formData.get("price") || undefined,
      vin: formData.get("vin") || undefined,
    }

    const data = updateCaravanSchema.parse(rawData)

    const updated = await prisma.caravan.update({
      where: { id: data.id },
      data: {
        make: data.make,
        model: data.model,
        year: data.year,
        price: data.price,
        vin: data.vin || null
      }
    })

    revalidatePath("/caravans")
    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to update caravan" }
  }
}

export async function deleteCaravan(id: string) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }
  try {
    await prisma.caravan.delete({
      where: { id }
    })
    
    revalidatePath("/caravans")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete caravan." }
  }
}
