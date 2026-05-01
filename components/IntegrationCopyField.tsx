"use client"

import { useState } from "react"

export default function IntegrationCopyField({
  label,
  value,
  hint,
  masked = false,
  missingLabel,
}: {
  label: string
  value: string
  hint?: string
  masked?: boolean
  missingLabel?: string
}) {
  const [copied, setCopied] = useState(false)
  const [reveal, setReveal] = useState(false)

  const empty = !value
  const display = empty
    ? (missingLabel ?? "(not set)")
    : masked && !reveal
      ? "•".repeat(Math.min(value.length, 24))
      : value

  function copy() {
    if (empty) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 10px",
        background: empty ? "#FEF2F2" : "#F8FAFC",
        border: `1px solid ${empty ? "#FECACA" : "var(--border-color)"}`,
        borderRadius: 8,
      }}>
        <code style={{
          flex: 1,
          fontSize: 12,
          fontFamily: "monospace",
          color: empty ? "#B91C1C" : "var(--text-main)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {display}
        </code>
        {!empty && masked && (
          <button onClick={() => setReveal(r => !r)} className="icon-btn" title={reveal ? "Hide" : "Reveal"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {reveal
                ? <><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.43 19.43 0 0 1 5.06-5.94"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.43 19.43 0 0 1-3.06 4.27"/><line x1="1" y1="1" x2="23" y2="23"/></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>
              }
            </svg>
          </button>
        )}
        {!empty && (
          <button onClick={copy} className="icon-btn" title={copied ? "Copied!" : "Copy"}>
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{hint}</div>
      )}
    </div>
  )
}
