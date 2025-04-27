"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Item } from "@/types/jellyfin"
import { Play, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { getImageUrl } from "@/lib/api"

interface FeaturedContentProps {
  item: Item
}

export function FeaturedContent({ item }: FeaturedContentProps) {
  const router = useRouter()

  const handlePlay = () => {
    router.push(`/watch/${item.id}`)
  }

  const handleDetails = () => {
    router.push(`/details/${item.id}`)
  }

  return (
    <div className="relative w-full h-[80vh]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${getImageUrl(item.id, "Backdrop")})`,
          backgroundPosition: "center 20%",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-gray-950/30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative h-full container mx-auto px-4 flex flex-col justify-center"
      >
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">{item.name}</h1>

          {item.overview && <p className="text-lg text-gray-300 mb-8 line-clamp-3">{item.overview}</p>}

          <div className="flex flex-wrap gap-4">
            <Button onClick={handlePlay} size="lg" className="bg-violet-700 hover:bg-violet-600 text-white">
              <Play className="mr-2 h-5 w-5" /> Play
            </Button>

            <Button
              onClick={handleDetails}
              size="lg"
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <Info className="mr-2 h-5 w-5" /> More Info
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
