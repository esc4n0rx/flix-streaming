"use client"

import { motion } from "framer-motion"

interface AuroraLogoProps {
  className?: string
}

export function AuroraLogo({ className = "" }: AuroraLogoProps) {
  // Animation for each letter
  const letterVariants = {
    initial: { y: -20, opacity: 0 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.07,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 10,
      },
    }),
  }

  // Animation for the glow effect
  const glowVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: [0.4, 0.8, 0.4],
      transition: {
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "mirror" as const,
      },
    },
  }

  // Animation for the plus sign
  const plusVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.6,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 10,
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
      {/* Enhanced glow effect behind the logo */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 blur-2xl"
        variants={glowVariants}
        initial="initial"
        animate="animate"
      />

      {/* Logo with animation of letters */}
      <div className="relative flex">
        {"Aurora".split("").map((letter, i) => (
          <motion.span
            key={i}
            custom={i}
            variants={letterVariants}
            initial="initial"
            animate="animate"
            className="text-5xl font-bold"
            style={{
              background: "linear-gradient(to right, #a5b4fc, #8b5cf6, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 15px rgba(139, 92, 246, 0.5)",
            }}
          >
            {letter}
          </motion.span>
        ))}
        
        {/* Plus Sign with its own animation */}
        <motion.span
          variants={plusVariants}
          initial="initial"
          animate="animate"
          className="text-5xl font-bold ml-1"
          style={{
            background: "linear-gradient(to right, #a5b4fc, #8b5cf6, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 15px rgba(139, 92, 246, 0.5)",
          }}
        >
          +
        </motion.span>
      </div>
      
      {/* Secondary glow effect for extra shine */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20 blur-3xl"
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "mirror",
        }}
      />
    </motion.div>
  )
}