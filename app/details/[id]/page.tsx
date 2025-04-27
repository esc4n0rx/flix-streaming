"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getItemDetails } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { DetailsSkeleton } from "@/components/details-skeleton"
import type { ItemDetails } from "@/types/jellyfin"
import { Play, Clock, Star, Calendar, Film, Tv } from "lucide-react"

export default function DetailsPage({ params }: { params: { id: string } }) {
  const [details, setDetails] = useState<ItemDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const fetchDetails = async () => {
      try {
        setIsLoading(true)
        const itemDetails = await getItemDetails(params.id)
        setDetails(itemDetails)
      } catch (error) {
        toast({
          title: "Error loading details",
          description: "Failed to load content details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()
  }, [params.id, isAuthenticated, router, toast])

  const handlePlay = () => {
    router.push(`/watch/${params.id}`)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {isLoading || !details ? (
        <DetailsSkeleton />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
            <div
              className="h-[70vh] bg-cover bg-center"
              style={{
                backgroundImage: `url(${details.backdropImageUrl})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />

            <div className="container mx-auto px-4 relative -mt-80 z-10">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 lg:w-1/4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-lg overflow-hidden shadow-2xl"
                  >
                    <img
                      src={details.primaryImageUrl || "/placeholder.svg"}
                      alt={details.name}
                      className="w-full h-auto"
                    />
                  </motion.div>
                </div>

                <div className="w-full md:w-2/3 lg:w-3/4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                  >
                    <h1 className="text-4xl font-bold text-white">{details.name}</h1>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      {details.productionYear && (
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{details.productionYear}</span>
                        </div>
                      )}

                      {details.runTimeTicks && (
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{Math.floor(details.runTimeTicks / (10000000 * 60))} min</span>
                        </div>
                      )}

                      {details.communityRating && (
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-yellow-500" />
                          <span>{details.communityRating.toFixed(1)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {details.type === "Movie" ? (
                          <>
                            <Film size={16} />
                            <span>Movie</span>
                          </>
                        ) : (
                          <>
                            <Tv size={16} />
                            <span>Series</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={handlePlay} className="bg-violet-700 hover:bg-violet-600 text-white">
                        <Play className="mr-2 h-4 w-4" /> Play
                      </Button>

                      <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                        Add to Favorites
                      </Button>
                    </div>

                    {details.overview && (
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Overview</h3>
                        <p className="text-gray-300 leading-relaxed">{details.overview}</p>
                      </div>
                    )}

                    {details.genres && details.genres.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Genres</h3>
                        <div className="flex flex-wrap gap-2">
                          {details.genres.map((genre) => (
                            <span key={genre} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
