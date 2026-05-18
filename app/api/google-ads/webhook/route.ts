import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { LeadSource } from "@prisma/client"

// ─── Google Ads Lead Form webhook ───────────────────────────────────────────
// Docs: https://support.google.com/google-ads/answer/9418154
// Google posts a single JSON body for each submitted lead, with a static
// `google_key` that must match the value you configured in Google Ads.

type ColumnDatum = {
  column_name: string
  string_value: string
  column_id?: string
}

type GoogleAdsPayload = {
  lead_id?: string
  api_version?: string
  form_id?: number
  campaign_id?: number
  google_key?: string
  is_test?: boolean
  gcl_id?: string
  adgroup_id?: number
  creative_id?: number
  user_column_data?: ColumnDatum[]
}

export async function POST(request: Request) {
  try {
    const expectedKey = process.env.GOOGLE_ADS_WEBHOOK_KEY
    if (!expectedKey) {
      // Misconfiguration on our side — return 500 so Google retries (and so we notice in logs)
      return NextResponse.json({ error: "GOOGLE_ADS_WEBHOOK_KEY not set" }, { status: 500 })
    }

    const body = (await request.json()) as GoogleAdsPayload

    if (!body.google_key || body.google_key !== expectedKey) {
      return NextResponse.json({ error: "Invalid google_key" }, { status: 401 })
    }

    // Test pings from the Google Ads UI use is_test:true and a placeholder lead_id.
    // We verify the key but skip writing them to the DB so they don't pollute the real list.
    if (body.is_test) {
      return NextResponse.json({ success: true, message: "Test ping accepted" }, { status: 200 })
    }

    const cols = body.user_column_data ?? []
    const mapped = mapGoogleColumns(cols)

    if (!mapped.phone) {
      return NextResponse.json({ status: "skipped", reason: "Missing phone" }, { status: 200 })
    }

    const existing = await prisma.lead.findUnique({ where: { phone: mapped.phone } })
    if (existing) {
      return NextResponse.json({ status: "duplicate" }, { status: 200 })
    }

    await prisma.lead.create({
      data: {
        name: mapped.name,
        phone: mapped.phone,
        email: mapped.email ?? null,
        state: mapped.state ?? null,
        source: LeadSource.GOOGLE_ADS,
        customerNotes: mapped.notes ?? null,
        firstContactDate: new Date(),
      },
    })

    return NextResponse.json({ status: "created", lead_id: body.lead_id }, { status: 201 })
  } catch (error) {
    console.error("Google Ads webhook error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// ─── Field mapping ──────────────────────────────────────────────────────────
// Google sends column_id values like FULL_NAME, EMAIL, PHONE_NUMBER, plus any
// custom QUESTION_* columns the form is built with.

function pick(cols: ColumnDatum[], ...ids: string[]): string | undefined {
  for (const id of ids) {
    const idLower = id.toLowerCase()
    const hit = cols.find(c =>
      (c.column_id ?? "").toLowerCase() === idLower ||
      (c.column_name ?? "").toLowerCase() === idLower
    )
    const v = hit?.string_value?.trim()
    if (v) return v
  }
  return undefined
}

function mapGoogleColumns(cols: ColumnDatum[]) {
  const fullName = pick(cols, "FULL_NAME", "Full Name", "name") ??
    [pick(cols, "FIRST_NAME", "First Name"), pick(cols, "LAST_NAME", "Last Name")].filter(Boolean).join(" ").trim()

  const phone = normalisePhone(pick(cols, "PHONE_NUMBER", "User Phone", "phone") ?? "")
  const email = pick(cols, "EMAIL", "User Email", "email")
  const state = normaliseState(pick(cols, "STATE", "User State", "Region", "REGION"))

  // Anything that wasn't a standard field becomes notes (often the QUESTION_* columns)
  const standardIds = new Set([
    "FULL_NAME", "FIRST_NAME", "LAST_NAME",
    "PHONE_NUMBER", "EMAIL", "STATE", "REGION",
    "USER_PHONE", "USER_EMAIL", "USER_STATE",
  ])
  const extras = cols
    .filter(c => !standardIds.has((c.column_id ?? "").toUpperCase()))
    .map(c => `${c.column_name}: ${c.string_value}`)
    .join("\n")

  return {
    name: fullName || "(no name)",
    phone,
    email,
    state,
    notes: extras || undefined,
  }
}

function normalisePhone(p: string): string {
  return p.replace(/[^\d+]/g, "")
}

function normaliseState(s?: string): string | undefined {
  if (!s) return undefined
  const upper = s.trim().toUpperCase()
  const map: Record<string, string> = {
    "NEW SOUTH WALES": "NSW", "VICTORIA": "VIC", "QUEENSLAND": "QLD",
    "WESTERN AUSTRALIA": "WA", "SOUTH AUSTRALIA": "SA", "TASMANIA": "TAS",
    "NORTHERN TERRITORY": "NT", "AUSTRALIAN CAPITAL TERRITORY": "ACT",
  }
  if (map[upper]) return map[upper]
  if (["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].includes(upper)) return upper
  return undefined
}
