import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * One-shot migration endpoint.
 *
 * Applies the *idempotent* schema migrations that the app needs but that
 * aren't auto-applied (this project uses hand-written SQL, not `prisma migrate`).
 * Every statement here is safe to run repeatedly — `IF NOT EXISTS` everywhere.
 *
 * ADMIN only. Visit /api/setup-db in the browser while logged in as an admin.
 */

// Each entry is a single, idempotent DDL statement.
// NOTE: `ALTER TYPE ... ADD VALUE` must run outside a transaction, so we
// execute them one-by-one in autocommit mode via $executeRawUnsafe.
const STATEMENTS: { label: string; sql: string }[] = [
  {
    label: "AppSetting table",
    sql: `CREATE TABLE IF NOT EXISTS "AppSetting" (
      "key"       TEXT         NOT NULL,
      "value"     TEXT         NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
    )`,
  },
  {
    label: "ActionChannel.META_PAID",
    sql: `ALTER TYPE "ActionChannel" ADD VALUE IF NOT EXISTS 'META_PAID'`,
  },
  {
    label: "ActionChannel.META_ORGANIC",
    sql: `ALTER TYPE "ActionChannel" ADD VALUE IF NOT EXISTS 'META_ORGANIC'`,
  },
  {
    label: "LeadSource.GOOGLE_ADS",
    sql: `ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'GOOGLE_ADS'`,
  },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 403 })
  }

  const results: { label: string; status: "ok" | "error"; error?: string }[] = []

  for (const { label, sql } of STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(sql)
      results.push({ label, status: "ok" })
    } catch (e) {
      results.push({ label, status: "error", error: String(e) })
    }
  }

  const allOk = results.every(r => r.status === "ok")
  return NextResponse.json(
    {
      success: allOk,
      message: allOk
        ? "All migrations applied. Restart the dev server so the Prisma client picks up the new enum values."
        : "Some migrations failed — see results.",
      results,
    },
    { status: allOk ? 200 : 500 },
  )
}
