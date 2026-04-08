import { z } from "zod"

export const caravanSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear() + 1, "Invalid year"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  vin: z.string().optional().or(z.literal('')),
})

export const updateCaravanSchema = caravanSchema.partial().extend({
  id: z.string().uuid("Invalid Caravan ID")
})
