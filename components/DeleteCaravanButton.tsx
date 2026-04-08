"use client"

import { useTransition } from "react"
import { deleteCaravan } from "@/app/actions/caravan"

export default function DeleteCaravanButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm("Delete this caravan?")) {
          startTransition(async () => {
            const res = await deleteCaravan(id)
            if (!res.success) alert(res.error)
          })
        }
      }}
      className="btn-danger"
    >
      {isPending ? "..." : "Delete"}
    </button>
  )
}
