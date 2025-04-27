"use client"

import { motion } from "framer-motion"

interface LogoProps {
  className?: string
}

export function Logo({ className = "" }: LogoProps) {
  // Animação para cada letra
  const letterVariants = {
    initial: { y: -20, opacity: 0 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 10,
      },
    }),
  }

  // Animação para o brilho
  const glowVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: [0.4, 0.8, 0.4],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "mirror" as const,
      },
    },
  }

  return (
    <motion.div
      className={`relative flex items-center ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Efeito de brilho atrás do logo */}
      <motion.div
        className="absolute inset-0 rounded-full bg-violet-600 blur-2xl"
        variants={glowVariants}
        initial="initial"
        animate="animate"
      />

      {/* Logo com animação de letras */}
      <div className="relative flex">
        {"Aurora+".split("").map((letter, i) => (
          <motion.span
            key={i}
            custom={i}
            variants={letterVariants}
            initial="initial"
            animate="animate"
            className="text-5xl font-bold"
            style={{
              background: "linear-gradient(to right, #c084fc, #a855f7, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
}
