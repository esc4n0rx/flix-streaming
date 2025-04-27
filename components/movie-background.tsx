"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface Movie {
  id: number
  backdrop_path: string
  title: string
}

export function MovieBackground() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchPopularMovies = async () => {
      try {
        // In a real app, you'd fetch from an API route that handles the API token securely
        const response = await fetch(
          `/api/movies?endpoint=discover/movie&language=pt-BR&page=1&sort_by=popularity.desc&include_adult=false`
        )
        const data = await response.json()
        
        // Filter out movies without backdrop images
        const moviesWithBackdrops = data.results.filter((movie: any) => movie.backdrop_path)
        setMovies(moviesWithBackdrops)
      } catch (error) {
        console.error("Error fetching movies:", error)
        // Use empty array as fallback
        setMovies([])
      }
    }

    fetchPopularMovies()
  }, [])

  useEffect(() => {
    if (movies.length === 0) return

    // Change the background image every 8 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [movies])

  if (movies.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-950 z-0" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {movies.map((movie, index) => {
        const isActive = index === currentIndex
        const nextActive = index === (currentIndex + 1) % movies.length

        return (
          <motion.div
            key={movie.id}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1.05 : 1,
            }}
            transition={{
              opacity: { duration: 1.5 },
              scale: { duration: 8 },
            }}
          />
        )
      })}
      
      {/* Overlay to make text more readable */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Moving particles effect */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-full overflow-hidden">
          <div className="stars-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i} 
                className="star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  opacity: Math.random() * 0.7 + 0.3,
                  width: `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .stars-container {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .star {
          position: absolute;
          background-color: white;
          border-radius: 50%;
          animation: twinkle 5s infinite;
        }
        
        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}