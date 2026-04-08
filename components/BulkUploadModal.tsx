"use client"

import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { bulkUploadLeads } from "@/app/actions/bulkUpload"

type Result = {
  created: number
  skipped: number
  errors: { row: number; reason: string }[]
} | null

const SAMPLE_CSV = `name,phone,email,state,source,status,model_interest,size,notes
John Smith,0411000001,john@example.com,NSW,META,INQUIRY,Traveller 21ft,21ft,Interested in finance options
Jane Doe,0422000002,jane@example.com,VIC,REFERRAL,INQUIRY,Explorer 18ft,18ft,Called back twice
`

export default function BulkUploadModal() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setOpen(false)
    setFile(null)
    setResult(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.name.endsWith(".csv")) setFile(dropped)
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "leads_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleUpload() {
    if (!file) return
    setIsPending(true)
    setResult(null)
    const formData = new FormData()
    formData.append("file", file)
    const res = await bulkUploadLeads(formData)
    setResult({ created: res.created, skipped: res.skipped, errors: res.errors })
    setIsPending(false)
  }

  const modal = open ? (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={handleClose}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 540,
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "column", maxHeight: "90vh",
        overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text-main)" }}>Bulk Upload Leads</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Upload a CSV file to import multiple leads at once</div>
          </div>
          <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Download Template */}
          <div style={{ background: "var(--primary-light)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>Need a template?</div>
              <div style={{ fontSize: 12, color: "#6366F1", marginTop: 2 }}>Download our sample CSV with the correct column format</div>
            </div>
            <button onClick={downloadSample} style={{
              background: "var(--primary)", color: "white", border: "none", borderRadius: 8,
              padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap"
            }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Template
            </button>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "var(--primary)" : file ? "#10B981" : "var(--border-color)"}`,
              borderRadius: 12, padding: "32px 20px", textAlign: "center",
              cursor: "pointer", background: dragOver ? "var(--primary-light)" : file ? "#F0FDF4" : "#FAFBFC",
              transition: "all 0.2s ease"
            }}
          >
            {file ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 600, color: "#059669", fontSize: 14 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} KB · Click to replace
                </div>
              </>
            ) : (
              <>
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth={1.5} style={{ margin: "0 auto 12px" }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: 14 }}>Drop your CSV here</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>or click to browse</div>
              </>
            )}
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>

          {/* Required columns hint */}
          <div style={{ fontSize: 12, color: "var(--text-muted)", background: "#F8FAFC", borderRadius: 8, padding: "10px 14px", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--text-main)" }}>Required columns:</strong> <code>name</code>, <code>phone</code><br/>
            <strong style={{ color: "var(--text-main)" }}>Optional:</strong> <code>email</code>, <code>state</code>, <code>source</code>, <code>status</code>, <code>model_interest</code>, <code>size</code>, <code>notes</code>, <code>next_action_date</code>
          </div>

          {/* Results */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={{ textAlign: "center", background: "#F0FDF4", borderRadius: 10, padding: "12px 0" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981" }}>{result.created}</div>
                  <div style={{ fontSize: 12, color: "#065F46", fontWeight: 600 }}>Created</div>
                </div>
                <div style={{ textAlign: "center", background: "#FFFBEB", borderRadius: 10, padding: "12px 0" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B" }}>{result.skipped}</div>
                  <div style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>Skipped (dup)</div>
                </div>
                <div style={{ textAlign: "center", background: "#FEF2F2", borderRadius: 10, padding: "12px 0" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#EF4444" }}>{result.errors.length}</div>
                  <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600 }}>Errors</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div style={{ maxHeight: 140, overflowY: "auto", border: "1px solid #FCA5A5", borderRadius: 8, padding: "8px 12px" }}>
                  {result.errors.map((e, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#991B1B", padding: "3px 0" }}>
                      <strong>Row {e.row}:</strong> {e.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-color)", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fff" }}>
          <button onClick={handleClose} style={{ padding: "9px 18px", border: "1px solid var(--border-color)", borderRadius: 8, background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "var(--text-main)" }}>
            {result ? "Done" : "Cancel"}
          </button>
          {!result && (
            <button
              onClick={handleUpload}
              disabled={!file || isPending}
              className="btn-primary"
              style={{ opacity: (!file || isPending) ? 0.6 : 1, cursor: (!file || isPending) ? "not-allowed" : "pointer" }}
            >
              {isPending ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Uploading…
                </span>
              ) : "Upload Leads"}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 14px", border: "1px solid var(--border-color)",
          borderRadius: 8, background: "white", cursor: "pointer",
          fontWeight: 600, fontSize: 13, color: "var(--text-main)",
          transition: "all 0.15s ease"
        }}
      >
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Bulk Upload
      </button>
      {typeof window !== "undefined" && open && createPortal(modal, document.body)}
    </>
  )
}
