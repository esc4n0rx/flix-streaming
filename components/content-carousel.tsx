"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Item } from "@/types/jellyfin"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getImageUrl } from "@/lib/api"

interface ContentCarouselProps {
  title: string
  items: Item[]
}

export function ContentCarousel({ title, items }: ContentCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { current } = carouselRef
      const scrollAmount = direction === "left" ? -current.clientWidth * 0.75 : current.clientWidth * 0.75

      current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="relative">
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
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 w-48 md:w-56"
          >
            <Link href={`/details/${item.id}`}>
              <div className="relative rounded-lg overflow-hidden shadow-lg card-hover">
                <img
                  src={getImageUrl(item.id, "Primary") || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-72 object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=288&width=192"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-4">
                    <h3 className="text-white font-medium truncate">{item.name}</h3>
                    {item.productionYear && <p className="text-gray-300 text-sm">{item.productionYear}</p>}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
