// app/home/page.tsx
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
    
        // Get popular movies
        const movies = await getItems({
          includeItemTypes: "Movie",
          sortBy: "SortName",
          sortOrder: "Ascending",
          limit: 20,
        })
        setPopularMovies(movies || [])
    
        // Get featured series
        const series = await getItems({
          includeItemTypes: "Series",
          sortBy: "SortName", 
          sortOrder: "Ascending",
          limit: 20,
        })
        setFeaturedSeries(series || [])
    
        // Get continue watching items (depois das outras requisições)
        const continueWatchingItems = await getItems({
          sortBy: "DatePlayed",
          sortOrder: "Descending",
          filters: "IsResumable",
          limit: 10,
        })
        setContinueWatching(continueWatchingItems || [])
    
        // Set a random featured item from movies ou series
        const allItems = [...(movies || []), ...(series || [])]
        if (allItems.length > 0) {
          // Garantir que itens sem imagens não sejam selecionados como destaque
          const itemsWithImages = allItems.filter(item => 
            (item.ImageTags?.Primary || item.BackdropImageTags?.length > 0)
          )
          
          if (itemsWithImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * itemsWithImages.length)
            setFeaturedItem(itemsWithImages[randomIndex])
          } else if (allItems.length > 0) {
            const randomIndex = Math.floor(Math.random() * allItems.length)
            setFeaturedItem(allItems[randomIndex])
          }
        }
      } catch (error) {
        console.error("Error loading content:", error)
        toast({
          title: "Error loading content",
          description: `Failed to load content from Jellyfin: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [isAuthenticated, router, toast, logout])

  // Exibir tela de loading enquanto carrega dados
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {isLoading ? (
        <ContentSkeleton />
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="pb-12"
        >
          {featuredItem && <FeaturedContent item={featuredItem} />}

          <div className="container mx-auto px-4 py-8 space-y-12">
            {popularMovies.length > 0 && (
              <ContentCarousel title="Popular Movies" items={popularMovies} />
            )}

            {featuredSeries.length > 0 && (
              <ContentCarousel title="Featured Series" items={featuredSeries} />
            )}

            {continueWatching.length > 0 && (
              <ContentCarousel title="Continue Watching" items={continueWatching} />
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}