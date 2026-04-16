"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createLeadSchema } from "@/lib/validations/lead"
import { Prisma } from "@prisma/client"

const LEAD_ROLES = ["ADMIN", "SALES"]

// Parse a CSV string into an array of objects keyed by header row
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    // Handle quoted fields with commas inside
    const values: string[] = []
    let inQuotes = false
    let current = ""
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes }
      else if (ch === "," && !inQuotes) { values.push(current.trim()); current = "" }
      else { current += ch }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] ?? "" })
    rows.push(row)
  }

  return rows
}

export async function bulkUploadLeads(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !LEAD_ROLES.includes(session.user.role)) {
    return { success: false, error: "Unauthorized", created: 0, skipped: 0, errors: [] }
  }

  const file = formData.get("file") as File
  if (!file || file.size === 0) {
    return { success: false, error: "No file provided", created: 0, skipped: 0, errors: [] }
  }

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0) {
    return { success: false, error: "CSV is empty or has no data rows", created: 0, skipped: 0, errors: [] }
  }

  // Pre-fetch all existing phones to avoid N+1 queries
  const existingPhones = new Set(
    (await prisma.lead.findMany({ select: { phone: true } })).map(l => l.phone)
  )

  let created = 0
  let skipped = 0
  const errors: { row: number; reason: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because row 1 is header

    try {
      const parsed = createLeadSchema.safeParse({
        name: row["name"] || row["full_name"] || row["customer_name"],
        phone: row["phone"] || row["phone_number"] || row["mobile"],
        email: row["email"] || row["email_address"],
        state: (row["state"] || "").toUpperCase(),
        source: (row["source"] || row["lead_source"] || "OTHER").toUpperCase().replace(/\s+/g, "_"),
        status: (row["status"] || "NEW_LEAD").toUpperCase().replace(/\s+/g, "_"),
        modelInterest: row["model_interest"] || row["model"] || row["caravan_model"],
        size: row["size"] || row["caravan_size"],
        customerNotes: row["notes"] || row["customer_notes"],
        internalNotes: row["internal_notes"],
        firstContactDate: row["first_contact_date"] || row["contact_date"],
        nextActionDate: row["next_action_date"],
        nextAction: (row["next_action"] || "").toUpperCase().replace(/\s+/g, "_"),
        actionChannel: (row["action_channel"] || row["channel"] || "").toUpperCase().replace(/\s+/g, "_"),
      })

      if (!parsed.success) {
        errors.push({ row: rowNum, reason: parsed.error.issues.map(e => e.message).join(", ") })
        continue
      }

      // Skip duplicates by phone
      if (existingPhones.has(parsed.data.phone)) {
        skipped++
        continue
      }

      await prisma.lead.create({ data: parsed.data as Prisma.LeadCreateInput })
      created++
    } catch {
      errors.push({ row: rowNum, reason: "Unexpected error processing row" })
    }
  }

  revalidatePath("/leads")
  revalidatePath("/reports")
  return { success: true, error: null, created, skipped, errors }
}
