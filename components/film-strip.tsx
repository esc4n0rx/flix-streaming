"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface FilmStripProps {
  position: "left" | "right"
}

export function FilmStrip({ position }: FilmStripProps) {
  const [posters, setPosters] = useState<string[]>([])

  useEffect(() => {
    // Gerar URLs de placeholders para simular posters de filmes
    const generatePosters = () => {
      const colors = [
        "4c1d95",
        "5b21b6",
        "6d28d9",
        "7c3aed",
        "8b5cf6",
        "581c87",
        "6b21a8",
        "7e22ce",
        "9333ea",
        "a855f7",
      ]

      return Array.from({ length: 10 }, (_, i) => {
        const color = colors[Math.floor(Math.random() * colors.length)]
        return `/placeholder.svg?height=300&width=200&text=Movie%20${i + 1}&bg=${color}`
      })
    }

    setPosters(generatePosters())
  }, [])

  const direction = position === "left" ? -1 : 1
  const initialX = position === "left" ? -100 : 100

  return (
    <motion.div
      className={`absolute ${position === "left" ? "left-0" : "right-0"} top-0 bottom-0 w-64 overflow-hidden opacity-40 z-0 pointer-events-none`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <motion.div
        className="flex flex-col gap-4 py-8"
        initial={{ y: initialX }}
        animate={{ y: initialX * -1 }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "mirror",
          duration: 30,
          ease: "linear",
        }}
      >
        {posters.map((poster, index) => (
          <motion.div
            key={index}
            className="w-40 h-56 rounded-lg overflow-hidden shadow-lg mx-auto"
            initial={{ x: initialX * 2, rotate: direction * 5, opacity: 0.6 }}
            animate={{
              x: 0,
              rotate: 0,
              opacity: 0.8,
            }}
            transition={{
              delay: index * 0.1,
              duration: 0.8,
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
          >
            <img src={poster || "/placeholder.svg"} alt="Movie poster" className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
