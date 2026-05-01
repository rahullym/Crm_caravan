import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { LeadSource, ActionChannel } from "@prisma/client"
import crypto from "crypto"

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0"

// ─── Webhook verification (Meta GET handshake) ──────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: "Invalid verification request" }, { status: 400 })
}

// ─── Lead delivery ──────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    // 1. HMAC signature verification
    const secret = process.env.META_WEBHOOK_SECRET
    if (secret) {
      const signature = request.headers.get("x-hub-signature-256")
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 })
      }
      const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
      const a = Buffer.from(signature)
      const b = Buffer.from(expected)
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)

    // ─── Branch A: real Meta Lead Ads webhook payload ─────────────────────
    // { object: "page", entry: [{ id, time, changes: [{ field: "leadgen", value: { leadgen_id, ... }}]}] }
    if (body?.object === "page" && Array.isArray(body.entry)) {
      const results: Array<{ leadgen_id: string; status: string; reason?: string }> = []

      for (const entry of body.entry) {
        for (const change of entry.changes ?? []) {
          if (change.field !== "leadgen") continue
          const leadgenId = change.value?.leadgen_id
          if (!leadgenId) continue

          try {
            const lead = await fetchAndStoreLead(leadgenId, change.value?.created_time)
            results.push({ leadgen_id: leadgenId, status: lead.status, reason: lead.reason })
          } catch (err) {
            console.error(`Meta lead ${leadgenId} failed:`, err)
            results.push({ leadgen_id: leadgenId, status: "error", reason: String(err) })
            // Don't fail the webhook — Meta will retry the *whole* delivery, which we don't want.
          }
        }
      }
      return NextResponse.json({ success: true, results }, { status: 200 })
    }

    // ─── Branch B: pre-mapped payload (for test scripts / Zapier-style proxies) ─
    const directSchema = z.object({
      name: z.string().min(1),
      phone: z.string().min(5),
      email: z.string().email().optional(),
    }).passthrough()
    const direct = directSchema.safeParse(body)
    if (!direct.success) {
      return NextResponse.json({ error: "Unrecognised payload format" }, { status: 400 })
    }
    const created = await upsertLead({
      name: direct.data.name,
      phone: direct.data.phone,
      email: direct.data.email,
    })
    return NextResponse.json(created, { status: created.status === "created" ? 201 : 200 })
  } catch (error) {
    console.error("Meta Webhook Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type FieldDatum = { name: string; values: string[] }

async function fetchAndStoreLead(leadgenId: string, createdTime?: number) {
  const token = process.env.META_PAGE_ACCESS_TOKEN
  if (!token) {
    throw new Error("META_PAGE_ACCESS_TOKEN is not set")
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}?access_token=${encodeURIComponent(token)}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Graph API ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json() as { field_data?: FieldDatum[]; created_time?: string }
  const fields = data.field_data ?? []

  return upsertLead({
    ...mapMetaFields(fields),
    firstContactDate: createdTime
      ? new Date(createdTime * 1000)
      : data.created_time
        ? new Date(data.created_time)
        : undefined,
  })
}

function getField(fields: FieldDatum[], ...names: string[]): string | undefined {
  for (const n of names) {
    const f = fields.find(d => d.name?.toLowerCase() === n.toLowerCase())
    const value = f?.values?.[0]?.trim()
    if (value) return value
  }
  return undefined
}

function mapMetaFields(fields: FieldDatum[]) {
  const fullName = getField(fields, "full_name", "name") ??
    [getField(fields, "first_name"), getField(fields, "last_name")].filter(Boolean).join(" ").trim()

  // Collect any non-standard fields into customerNotes for visibility
  const standardKeys = new Set([
    "full_name", "name", "first_name", "last_name",
    "phone_number", "phone", "mobile",
    "email", "email_address",
    "state", "city", "post_code", "postal_code",
  ])
  const extras = fields
    .filter(f => !standardKeys.has(f.name?.toLowerCase()))
    .map(f => `${f.name}: ${(f.values ?? []).join(", ")}`)
    .join("\n")

  return {
    name: fullName || "(no name)",
    phone: normalisePhone(getField(fields, "phone_number", "phone", "mobile") ?? ""),
    email: getField(fields, "email", "email_address"),
    state: normaliseState(getField(fields, "state")),
    customerNotes: extras || undefined,
  }
}

function normalisePhone(p: string): string {
  return p.replace(/[^\d+]/g, "")
}

function normaliseState(s?: string): string | undefined {
  if (!s) return undefined
  const upper = s.trim().toUpperCase()
  // Accept full names too
  const map: Record<string, string> = {
    "NEW SOUTH WALES": "NSW", "VICTORIA": "VIC", "QUEENSLAND": "QLD",
    "WESTERN AUSTRALIA": "WA", "SOUTH AUSTRALIA": "SA", "TASMANIA": "TAS",
    "NORTHERN TERRITORY": "NT", "AUSTRALIAN CAPITAL TERRITORY": "ACT",
  }
  if (map[upper]) return map[upper]
  if (["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].includes(upper)) return upper
  return undefined
}

type UpsertInput = {
  name: string
  phone: string
  email?: string
  state?: string
  customerNotes?: string
  firstContactDate?: Date
}

async function upsertLead(input: UpsertInput): Promise<{ status: "created" | "duplicate" | "skipped"; reason?: string }> {
  if (!input.phone) return { status: "skipped", reason: "Missing phone" }

  const existing = await prisma.lead.findUnique({ where: { phone: input.phone } })
  if (existing) return { status: "duplicate" }

  await prisma.lead.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      state: input.state ?? null,
      source: LeadSource.META,
      actionChannel: ActionChannel.META_PAID,
      customerNotes: input.customerNotes ?? null,
      firstContactDate: input.firstContactDate ?? new Date(),
    },
  })
  return { status: "created" }
}
