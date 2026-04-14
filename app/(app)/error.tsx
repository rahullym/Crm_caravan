"use client"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      gap: 16,
      fontFamily: "var(--font-geist, sans-serif)",
      color: "#0F172A",
    }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Something went wrong</h2>
      <pre style={{
        fontSize: 12,
        background: "#F1F5F9",
        padding: "12px 16px",
        borderRadius: 8,
        maxWidth: 600,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        color: "#DC2626",
      }}>
        {error.message}
      </pre>
      <button
        onClick={reset}
        style={{
          padding: "8px 20px",
          background: "#5B5FED",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  )
}
