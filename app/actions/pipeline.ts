"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { LEAD_STATUSES } from "@/lib/lead-statuses"

export type StageConfig = {
  value: string
  label: string
  color: string
  bg: string
  visible: boolean
  order: number
}

const SETTING_KEY = "pipeline_stages"

export async function getPipelineStages(): Promise<StageConfig[]> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
    if (setting) {
      const parsed = JSON.parse(setting.value) as StageConfig[]
      // Merge with canonical list — new enum values added to schema get appended
      const canonicalValues = LEAD_STATUSES.map(s => s.value)
      const savedValues = parsed.map(s => s.value)
      const missing = LEAD_STATUSES.filter(s => !savedValues.includes(s.value)).map((s, i) => ({
        value: s.value,
        label: s.label,
        color: s.color,
        bg: s.bg,
        visible: true,
        order: parsed.length + i,
      }))
      return [...parsed, ...missing]
    }
  } catch {
    // Fall through to defaults
  }

  // Default: use canonical list
  return LEAD_STATUSES.map((s, i) => ({
    value: s.value,
    label: s.label,
    color: s.color,
    bg: s.bg,
    visible: true,
    order: i,
  }))
}

export async function savePipelineStages(stages: StageConfig[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Only admins can edit pipeline stages." }
  }

  try {
    await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(stages) },
      create: { key: SETTING_KEY, value: JSON.stringify(stages) },
    })
    revalidatePath("/leads")
    revalidatePath("/pipeline")
    revalidatePath("/reports")
    revalidatePath("/settings/pipeline")
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
