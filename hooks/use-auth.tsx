"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getUserInfo } from "@/lib/api"

interface User {
  id: string
  name: string
  email?: string
  imageUrl?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("jellyfin_token")

        if (!token) {
          setIsLoading(false)
          return
        }

        const userInfo = await getUserInfo()

        if (userInfo) {
          setUser({
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            imageUrl: userInfo.imageUrl,
          })
        }
      } catch (error) {
        localStorage.removeItem("jellyfin_token")
        localStorage.removeItem("jellyfin_user")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (token: string, userData: User) => {
    localStorage.setItem("jellyfin_token", token)
    localStorage.setItem("jellyfin_user", JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("jellyfin_token")
    localStorage.removeItem("jellyfin_user")
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
