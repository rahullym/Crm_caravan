import { z } from "zod"
import { LeadSource, LeadStatus } from "@prisma/client"

const AUS_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"] as const

const ActionChannelEnum = z.enum(["PHONE_CALL", "EMAIL", "SMS", "WALK_IN", "SOCIAL_MEDIA", "OTHER"])
const NextActionEnum = z.enum(["FOLLOW_UP_CALL", "SEND_QUOTE", "SCHEDULE_DEMO", "SEND_EMAIL", "SITE_VISIT", "CLOSE_DEAL", "NO_ACTION"])

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(5, "Valid phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")).transform(v => v || undefined),
  state: z.enum(AUS_STATES).optional().or(z.literal("")).transform(v => v || undefined),
  source: z.nativeEnum(LeadSource).optional().default("OTHER"),
  status: z.nativeEnum(LeadStatus).optional().default("NEW_LEAD"),
  modelInterest: z.string().optional().or(z.literal("")).transform(v => v || undefined),
  size: z.string().optional().or(z.literal("")).transform(v => v || undefined),
  actionChannel: ActionChannelEnum.optional().or(z.literal("")).transform(v => v || undefined),
  nextAction: NextActionEnum.optional().or(z.literal("")).transform(v => v || undefined),
  firstContactDate: z.string().optional().or(z.literal("")).transform(v => v ? new Date(v) : undefined),
  nextActionDate: z.string().optional().or(z.literal("")).transform(v => v ? new Date(v) : undefined),
  customerNotes: z.string().optional().or(z.literal("")).transform(v => v || undefined),
  internalNotes: z.string().optional().or(z.literal("")).transform(v => v || undefined),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

export const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().uuid("Invalid lead ID"),
})

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

export const updateLeadStatusSchema = z.object({
  id: z.string().uuid("Invalid lead ID"),
  status: z.nativeEnum(LeadStatus),
})
