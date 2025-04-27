"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { loginUser } from "@/lib/auth"
import { AuroraLogo } from "@/components/aurora-logo"
import { MovieBackground } from "@/components/movie-background"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()

  useEffect(() => {
    // Delay showing the form for a smoother entrance
    const timer = setTimeout(() => {
      setShowForm(true)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const authData = await loginUser(username, password)
      
      // Use the auth context
      login(authData.token, authData.user)

      toast({
        title: "Login bem-sucedido",
        description: "Redirecionando para a página inicial...",
      })

      // Use replace instead of push to prevent navigation issues
      setTimeout(() => {
        router.replace("/home")
      }, 1000)
    } catch (error) {
      toast({
        title: "Falha na autenticação",
        description: "Verifique seu nome de usuário e senha",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.8,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  }

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05, boxShadow: "0px 0px 15px rgba(124, 58, 237, 0.6)" },
    tap: { scale: 0.95 },
  }

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Animated background with TMDb popular movies */}
      <MovieBackground />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-violet-900/20 via-gray-900/60 to-gray-950/90 z-10" />

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md z-20"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                type: "spring",
                bounce: 0.4,
              }}
              className="flex justify-center mb-8"
            >
              <AuroraLogo className="h-24 w-auto" />
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <Card className="border-gray-800 bg-gray-900/70 backdrop-blur-xl shadow-2xl shadow-violet-900/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-800/10 to-transparent pointer-events-none" />

                <CardHeader>
                  <motion.div variants={itemVariants}>
                    <CardTitle className="text-2xl text-center text-white">Bem-vindo ao Aurora+</CardTitle>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <CardDescription className="text-center text-gray-400">
                      Entre com sua conta Jellyfin para continuar
                    </CardDescription>
                  </motion.div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="username" className="text-gray-300">
                        Nome de usuário
                      </Label>
                      <div className="relative">
                        <Input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Digite seu nome de usuário"
                          className="bg-gray-800/80 border-gray-700 text-white pl-4 pr-4 py-6 transition-all duration-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                        <motion.span
                          initial={{ width: "0%" }}
                          animate={{ width: username ? "100%" : "0%" }}
                          transition={{ duration: 0.3 }}
                          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-violet-600 to-purple-500"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                      <Label htmlFor="password" className="text-gray-300">
                        Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Digite sua senha"
                          className="bg-gray-800/80 border-gray-700 text-white pl-4 pr-4 py-6 transition-all duration-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                        <motion.span
                          initial={{ width: "0%" }}
                          animate={{ width: password ? "100%" : "0%" }}
                          transition={{ duration: 0.3 }}
                          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-violet-600 to-purple-500"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <motion.div variants={buttonVariants} initial="idle" whileHover="hover" whileTap="tap">
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-violet-700 to-purple-600 hover:from-violet-600 hover:to-purple-500 text-white py-6 font-medium text-lg relative overflow-hidden group"
                          disabled={isLoading}
                        >
                          <span className="relative z-10">
                            {isLoading ? (
                              <div className="flex items-center justify-center">
                                <svg
                                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Entrando...
                              </div>
                            ) : (
                              "Entrar"
                            )}
                          </span>
                          <span className="absolute inset-0 bg-gradient-to-r from-violet-600/40 to-purple-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  </form>
                </CardContent>

                <CardFooter className="flex justify-center">
                  <motion.p variants={itemVariants} className="text-sm text-gray-500">
                    Powered by Jellyfin API
                  </motion.p>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}