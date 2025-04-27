// app/page.tsx (modificado)
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else {
        router.push("/home")
      }
    }
  }, [isAuthenticated, isLoading, router])

  return null // Ou um componente de loading
}