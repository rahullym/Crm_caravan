import { z } from "zod"
import { ServiceStatus } from "@prisma/client"

export const createServiceRequestSchema = z.object({
  caravanId: z.string().uuid("Please select a valid Caravan"),
  description: z.string().min(1, "Description is required"),
  technicianId: z.string().uuid().optional().or(z.literal('')),
})

export const updateServiceStatusSchema = z.object({
  id: z.string().uuid("Invalid Service ID"),
  status: z.nativeEnum(ServiceStatus)
})

export const assignTechnicianSchema = z.object({
  id: z.string().uuid("Invalid Service ID"),
  technicianId: z.string().uuid("Invalid Technician ID").nullable()
})
