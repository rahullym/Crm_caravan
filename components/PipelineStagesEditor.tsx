"use client"

import { useState, useTransition } from "react"
import { savePipelineStages, type StageConfig } from "@/app/actions/pipeline"

const PRESET_COLORS = [
  { color: "#6B7280", bg: "#F1F5F9" },
  { color: "#2563EB", bg: "#DBEAFE" },
  { color: "#7C3AED", bg: "#EDE9FE" },
  { color: "#0891B2", bg: "#CFFAFE" },
  { color: "#D97706", bg: "#FEF3C7" },
  { color: "#EA580C", bg: "#FFEDD5" },
  { color: "#DC2626", bg: "#FEE2E2" },
  { color: "#9333EA", bg: "#F3E8FF" },
  { color: "#B45309", bg: "#FEF9C3" },
  { color: "#059669", bg: "#D1FAE5" },
  { color: "#9CA3AF", bg: "#F3F4F6" },
]

export default function PipelineStagesEditor({ initialStages }: { initialStages: StageConfig[] }) {
  const [stages, setStages] = useState<StageConfig[]>(
    [...initialStages].sort((a, b) => a.order - b.order)
  )
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  function updateStage(index: number, patch: Partial<StageConfig>) {
    setStages(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s))
  }

  function moveUp(index: number) {
    if (index === 0) return
    setStages(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }

  function moveDown(index: number) {
    if (index === stages.length - 1) return
    setStages(prev => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }

  function handleSave() {
    startTransition(async () => {
      const result = await savePipelineStages(stages.map((s, i) => ({ ...s, order: i })))
      if (result.success) {
        setMessage({ type: "success", text: "Pipeline stages saved!" })
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to save." })
      }
      setTimeout(() => setMessage(null), 3500)
    })
  }

  function handleReset() {
    if (!confirm("Reset all stages to defaults?")) return
    startTransition(async () => {
      const result = await savePipelineStages([])
      if (result.success) {
        window.location.reload()
      }
    })
  }

  return (
    <div>
      {/* Header actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>
            {stages.length} stages · {stages.filter(s => s.visible).length} visible
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Drag order ↑↓, edit labels and colors, toggle visibility
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleReset}
            disabled={isPending}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0",
              background: "#fff", color: "var(--text-muted)", fontSize: 13,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: "var(--primary)", color: "#fff", fontSize: 13,
              fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 16,
          background: message.type === "success" ? "#F0FDF4" : "#FEF2F2",
          border: `1px solid ${message.type === "success" ? "#BBF7D0" : "#FECACA"}`,
          color: message.type === "success" ? "#166534" : "#B91C1C",
          fontSize: 13, fontWeight: 600,
        }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* Stage rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stages.map((stage, idx) => (
          <div
            key={stage.value}
            style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr 200px 140px 80px 80px",
              gap: 12,
              alignItems: "center",
              padding: "12px 16px",
              background: stage.visible ? "#fff" : "#F8FAFC",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              opacity: stage.visible ? 1 : 0.55,
              transition: "opacity 0.2s",
            }}
          >
            {/* Order buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                style={{
                  padding: "2px 6px", border: "1px solid #E2E8F0",
                  borderRadius: 4, background: "#F8FAFC", cursor: idx === 0 ? "not-allowed" : "pointer",
                  opacity: idx === 0 ? 0.3 : 1, fontSize: 10, lineHeight: 1,
                }}
              >↑</button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === stages.length - 1}
                style={{
                  padding: "2px 6px", border: "1px solid #E2E8F0",
                  borderRadius: 4, background: "#F8FAFC",
                  cursor: idx === stages.length - 1 ? "not-allowed" : "pointer",
                  opacity: idx === stages.length - 1 ? 0.3 : 1, fontSize: 10, lineHeight: 1,
                }}
              >↓</button>
            </div>

            {/* Label editor */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Label
              </div>
              <input
                value={stage.label}
                onChange={(e) => updateStage(idx, { label: e.target.value })}
                style={{
                  width: "100%", padding: "7px 10px",
                  border: "1px solid #D1D5DB", borderRadius: 6,
                  fontSize: 13, fontFamily: "var(--font-geist)",
                  outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "var(--primary)"}
                onBlur={e => e.target.style.borderColor = "#D1D5DB"}
              />
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
                DB key: <code style={{ fontFamily: "monospace" }}>{stage.value}</code>
              </div>
            </div>

            {/* Color picker */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Color
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => updateStage(idx, { color: preset.color, bg: preset.bg })}
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: preset.color,
                      border: stage.color === preset.color ? "2px solid #0F172A" : "2px solid transparent",
                      cursor: "pointer", padding: 0,
                      boxShadow: stage.color === preset.color ? "0 0 0 1px #fff inset" : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Preview badge */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Preview
              </div>
              <span style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
                background: stage.bg,
                color: stage.color,
              }}>
                {stage.label}
              </span>
            </div>

            {/* Visible toggle */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Visible
              </div>
              <button
                onClick={() => updateStage(idx, { visible: !stage.visible })}
                style={{
                  width: 40, height: 22, borderRadius: 100,
                  background: stage.visible ? "var(--primary)" : "#CBD5E1",
                  border: "none", cursor: "pointer",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute",
                  top: 3, left: stage.visible ? 20 : 3,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>

            {/* Order number */}
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#CBD5E1" }}>
              #{idx + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
