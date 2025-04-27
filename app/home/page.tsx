"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { ContentCarousel } from "@/components/content-carousel"
import { FeaturedContent } from "@/components/featured-content"
import { useToast } from "@/hooks/use-toast"
import { getUserInfo, getItems } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { ContentSkeleton } from "@/components/content-skeleton"
import type { Item } from "@/types/jellyfin"

export default function HomePage() {
  const [featuredItem, setFeaturedItem] = useState<Item | null>(null)
  const [continueWatching, setContinueWatching] = useState<Item[]>([])
  const [popularMovies, setPopularMovies] = useState<Item[]>([])
  const [featuredSeries, setFeaturedSeries] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get user info to verify authentication
        await getUserInfo()

        // Get continue watching items
        const continueWatchingItems = await getItems({
          sortBy: "DatePlayed",
          sortOrder: "Descending",
          filters: "IsResumable",
          limit: 10,
        })
        setContinueWatching(continueWatchingItems)

        // Get popular movies
        const movies = await getItems({
          includeItemTypes: "Movie",
          sortBy: "SortName",
          sortOrder: "Ascending",
          limit: 20,
        })
        setPopularMovies(movies)

        // Get featured series
        const series = await getItems({
          includeItemTypes: "Series",
          sortBy: "SortName",
          sortOrder: "Ascending",
          limit: 20,
        })
        setFeaturedSeries(series)

        // Set a random featured item from movies or series
        const allItems = [...movies, ...series]
        if (allItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * allItems.length)
          setFeaturedItem(allItems[randomIndex])
        }
      } catch (error) {
        toast({
          title: "Error loading content",
          description: "Failed to load content from Jellyfin",
          variant: "destructive",
        })
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, router, toast, logout])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {isLoading ? (
        <ContentSkeleton />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {featuredItem && <FeaturedContent item={featuredItem} />}

          <div className="container mx-auto px-4 py-8 space-y-12">
            {continueWatching.length > 0 && <ContentCarousel title="Continue Watching" items={continueWatching} />}

            {popularMovies.length > 0 && <ContentCarousel title="Popular Movies" items={popularMovies} />}

            {featuredSeries.length > 0 && <ContentCarousel title="Featured Series" items={featuredSeries} />}
          </div>
        </motion.div>
      )}
    </div>
  )
}
