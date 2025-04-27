// components/content-carousel.tsx
"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Item } from "@/types/jellyfin"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { getImageUrl } from "@/lib/api"

interface ContentCarouselProps {
  title: string
  items: Item[]
}

export function ContentCarousel({ title, items }: ContentCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({})
  const router = useRouter()

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { current } = carouselRef
      const scrollAmount = direction === "left" ? -current.clientWidth * 0.75 : current.clientWidth * 0.75
      current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const handleImageError = (itemId: string) => {
    setImageLoadError(prev => ({
      ...prev,
      [itemId]: true
    }))
  }

  const handlePlay = (id: string) => {
    router.push(`/watch/${id}`)
  }

  const handleDetails = (id: string) => {
    router.push(`/details/${id}`)
  }

  // Caso não tenha itens para exibir, não renderize nada
  if (items.length === 0) {
    return null
  }

  return (
    <div className="relative py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="rounded-full border-gray-700 text-white hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="rounded-full border-gray-700 text-white hover:bg-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={carouselRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item) => (
          <motion.div
            key={item.Id}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 w-48 md:w-56"
          >
            <div 
              className="relative rounded-lg overflow-hidden shadow-lg card-hover bg-gray-800 h-72 cursor-pointer"
              onClick={() => handleDetails(item.Id)}
            >
              {!imageLoadError[item.Id] ? (
                <img
                  src={getImageUrl(item.Id, "Primary")}
                  alt={item.Name}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(item.Id)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-center p-4">
                  <p className="text-white">{item.Name}</p>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <Button 
                    size="icon" 
                    className="rounded-full bg-violet-700 hover:bg-violet-600 h-9 w-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(item.Id);
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-white font-medium line-clamp-2">{item.Name}</h3>
                  {item.PremiereDate && (
                    <p className="text-gray-300 text-sm">
                      {new Date(item.PremiereDate).getFullYear()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}