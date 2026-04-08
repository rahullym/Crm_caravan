import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { LeadSource } from "@prisma/client"
import crypto from "crypto"

// Validation schema for incoming Meta payload
const metaPayloadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Invalid email").optional(),
}).passthrough() // Allow other fields that Meta might send

// GET handler for Webhook Verification (Meta requirement)
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

// POST handler for receiving Lead Data
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    // Verify Meta HMAC signature if secret is configured
    const secret = process.env.META_WEBHOOK_SECRET
    if (secret) {
      const signature = request.headers.get("x-hub-signature-256")
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 })
      }
      const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)

    // Assuming the payload has been mapped by an intermediate service or directly contains these fields.
    // If it's a raw Meta Webhook (leadgen_id), you normally have to fetch the Graph API.
    // Following the strict requirement: "Map fields (name, phone, email)" directly from payload.
    const result = metaPayloadSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload: Phone and Name are required." },
        { status: 400 }
      )
    }

    const { name, phone, email } = result.data

    // Prevent duplicate leads
    const existingLead = await prisma.lead.findUnique({
      where: { phone }
    })

    if (existingLead) {
      // Returning 200 so Meta doesn't retry the webhook delivery infinitely for a duplicate
      return NextResponse.json(
        { message: "Lead already exists. Ignoring." },
        { status: 200 }
      )
    }

    // Insert into DB
    await prisma.lead.create({
      data: {
        name,
        phone,
        email: email || null,
        source: LeadSource.META,
      }
    })

    return NextResponse.json({ success: true, message: "Lead captured successfully" }, { status: 201 })

  } catch (error) {
    console.error("Meta Webhook Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
