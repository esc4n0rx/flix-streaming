"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast"
import { getItemDetails, getSeasonEpisodes, getImageUrl,getAuthToken } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { DetailsSkeleton } from "@/components/details-skeleton"
import type { ItemDetails, Season, Episode } from "@/types/jellyfin"
import { Play, Clock, Star, Calendar, Film, Tv, Info, ListPlus, Heart } from "lucide-react"

export default function DetailsPage({ params }: { params: { id: string } }) {
  const [details, setDetails] = useState<ItemDetails | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [episodes, setEpisodes] = useState<Record<string, Episode[]>>({})
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [imageLoadError, setImageLoadError] = useState({
    backdrop: false,
    poster: false
  })
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
        
        // Se for uma série, buscar as temporadas
        if (itemDetails.Type === "Series") {
          setActiveTab("episodes")
          
          // Buscar temporadas
          try {
            const seasonData = await getSeasonEpisodes(params.id)
            setSeasons(seasonData || [])
            
            // Pré-carregar episódios da primeira temporada, se houver
            if (seasonData && seasonData.length > 0) {
              await loadEpisodesForSeason(seasonData[0].Id)
            }
          } catch (error) {
            console.error("Error loading seasons:", error)
          }
        }
      } catch (error) {
        console.error("Error loading details:", error)
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

  const loadEpisodesForSeason = async (seasonId: string) => {
    // Se já carregamos os episódios desta temporada, não precisamos carregar novamente
    if (episodes[seasonId]) return
    
    try {
      const episodeData = await getSeasonEpisodes(seasonId)
      setEpisodes(prev => ({
        ...prev,
        [seasonId]: episodeData || []
      }))
    } catch (error) {
      console.error(`Error loading episodes for season ${seasonId}:`, error)
      toast({
        title: "Error loading episodes",
        description: "Failed to load episode data",
        variant: "destructive",
      })
    }
  }

  const handlePlay = (itemId?: string) => {
    router.push(`/watch/${itemId || params.id}`)
  }

  const handleImageError = (type: 'backdrop' | 'poster') => {
    setImageLoadError(prev => ({
      ...prev,
      [type]: true
    }))
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
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="pb-12"
        >
          {/* Hero section with backdrop */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent z-10" />
            
            {!imageLoadError.backdrop ? (
              <div
                className="h-[70vh] bg-cover bg-center"
                style={{
                  backgroundImage: `url(${details.backdropImageUrl})`,
                }}
                onError={() => handleImageError('backdrop')}
              />
            ) : (
              <div className="h-[70vh] bg-gradient-to-r from-gray-900 to-gray-800" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent z-10" />

            {/* Content section */}
            <div className="container mx-auto px-4 relative -mt-80 z-20">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Poster column */}
                <div className="w-full md:w-1/3 lg:w-1/4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-lg overflow-hidden shadow-2xl bg-gray-800"
                  >
                    {!imageLoadError.poster ? (
                      <img
                        src={details.primaryImageUrl}
                        alt={details.Name}
                        className="w-full h-auto"
                        onError={() => handleImageError('poster')}
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] flex items-center justify-center bg-gray-800 p-4">
                        <div className="text-center">
                          <div className="text-5xl mb-4">
                            {details.Type === "Movie" ? <Film /> : <Tv />}
                          </div>
                          <h3 className="text-lg text-white">{details.Name}</h3>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Details column */}
                <div className="w-full md:w-2/3 lg:w-3/4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                  >
                    <h1 className="text-4xl font-bold text-white">{details.Name}</h1>

                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      {details.ProductionYear && (
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{details.ProductionYear}</span>
                        </div>
                      )}

                      {details.RunTimeTicks && (
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{Math.floor(details.RunTimeTicks / (10000000 * 60))} min</span>
                        </div>
                      )}

                      {details.CommunityRating && (
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-yellow-500" />
                          <span>{details.CommunityRating.toFixed(1)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {details.Type === "Movie" ? (
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
                      
                      {details.OfficialRating && (
                        <div className="px-2 py-0.5 bg-gray-800 rounded text-xs">
                          {details.OfficialRating}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-4">
                      <Button onClick={() => handlePlay()} className="bg-violet-700 hover:bg-violet-600 text-white">
                        <Play className="mr-2 h-4 w-4" /> Play
                      </Button>

                      <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                        <Heart className="mr-2 h-4 w-4" /> Favorite
                      </Button>

                      <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                        <ListPlus className="mr-2 h-4 w-4" /> Add to List
                      </Button>
                    </div>

                    {/* Tabs for different sections */}
                    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="bg-gray-800 border-b border-gray-700">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
                          Overview
                        </TabsTrigger>
                        {details.Type === "Series" && (
                          <TabsTrigger value="episodes" className="data-[state=active]:bg-gray-700">
                            Episodes
                          </TabsTrigger>
                        )}
                        <TabsTrigger value="details" className="data-[state=active]:bg-gray-700">
                          Details
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* Overview tab content */}
                      <TabsContent value="overview" className="pt-4">
                        <div className="space-y-6">
                          {details.Overview && (
                            <div>
                              <h3 className="text-xl font-semibold text-white mb-2">Overview</h3>
                              <p className="text-gray-300 leading-relaxed">{details.Overview}</p>
                            </div>
                          )}

                          {details.Genres && details.Genres.length > 0 && (
                            <div>
                              <h3 className="text-xl font-semibold text-white mb-2">Genres</h3>
                              <div className="flex flex-wrap gap-2">
                                {details.Genres.map((genre) => (
                                  <span key={genre} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                                    {genre}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      {/* Episodes tab content */}
                      {details.Type === "Series" && (
                        <TabsContent value="episodes" className="pt-4">
                          <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-white mb-2">Episodes</h3>
                            
                            {seasons.length > 0 ? (
                              <Accordion type="single" collapsible className="w-full">
                                {seasons.map((season) => (
                                  <AccordionItem 
                                    key={season.Id} 
                                    value={season.Id}
                                    className="border-b border-gray-800"
                                    onClick={() => loadEpisodesForSeason(season.Id)}
                                  >
                                    <AccordionTrigger className="text-white hover:text-violet-400">
                                      {season.Name}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="space-y-4 mt-2">
                                        {episodes[season.Id] ? (
                                          episodes[season.Id].map((episode) => (
                                            <div 
                                              key={episode.Id} 
                                              className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-colors"
                                            >
                                              <div className="w-full sm:w-40 h-24 flex-shrink-0">
                                                {episode.ImageTags?.Primary ? (
                                                  <img 
                                                    src={getImageUrl(episode.Id, "Primary")} 
                                                    alt={episode.Name}
                                                    className="w-full h-full object-cover rounded"
                                                  />
                                                ) : (
                                                  <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center">
                                                    <Tv className="text-gray-400" />
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <h4 className="text-white font-medium">
                                                      {episode.IndexNumber && `${episode.IndexNumber}. `}{episode.Name}
                                                    </h4>
                                                    <div className="text-sm text-gray-400 mt-1">
                                                      {episode.RunTimeTicks && (
                                                        <span>{Math.floor(episode.RunTimeTicks / (10000000 * 60))} min</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <Button 
                                                    size="sm" 
                                                    className="bg-violet-700 hover:bg-violet-600"
                                                    onClick={() => handlePlay(episode.Id)}
                                                  >
                                                    <Play size={16} />
                                                  </Button>
                                                </div>
                                                {episode.Overview && (
                                                  <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                                                    {episode.Overview}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="py-4 text-center text-gray-400">
                                            <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
                                            <p>Loading episodes...</p>
                                          </div>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            ) : (
                              <div className="text-gray-400 text-center py-8">
                                No episodes available
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      )}
                      
                      {/* Details tab content */}
                      <TabsContent value="details" className="pt-4">
                        <div className="space-y-6">
                          {details.Studios && details.Studios.length > 0 && (
                            <div>
                              <h3 className="text-xl font-semibold text-white mb-2">Studios</h3>
                              <div className="flex flex-wrap gap-2">
                                {details.Studios.map((studio) => (
                                  <span key={studio.Name} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                                    {studio.Name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {details.People && details.People.length > 0 && (
                            <div>
                              <h3 className="text-xl font-semibold text-white mb-2">Cast & Crew</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {details.People.slice(0, 12).map((person) => (
                                  <div key={person.Id} className="flex items-center gap-3 bg-gray-800/50 p-2 rounded">
                                    {person.PrimaryImageTag ? (
                                      <img 
                                        src={`${person.Id}/Images/Primary?api_key=${getAuthToken()}`} 
                                        alt={person.Name}
                                        className="w-10 h-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                        <span className="text-xs text-gray-400">
                                          {person.Name.charAt(0)}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-sm font-medium text-white">{person.Name}</div>
                                      <div className="text-xs text-gray-400">{person.Role || person.Type}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Informações técnicas */}
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">Technical Info</h3>
                            <div className="bg-gray-800/50 rounded-lg p-4">
                              <dl className="space-y-2">
                                {details.Container && (
                                  <div className="grid grid-cols-3">
                                    <dt className="text-gray-400">Container</dt>
                                    <dd className="text-white col-span-2">{details.Container}</dd>
                                  </div>
                                )}
                                {details.MediaStreams && details.MediaStreams.length > 0 && (
                                  <>
                                    <div className="grid grid-cols-3">
                                      <dt className="text-gray-400">Video</dt>
                                      <dd className="text-white col-span-2">
                                        {details.MediaStreams.find(s => s.Type === "Video")?.DisplayTitle || "Unknown"}
                                      </dd>
                                    </div>
                                    <div className="grid grid-cols-3">
                                      <dt className="text-gray-400">Audio</dt>
                                      <dd className="text-white col-span-2">
                                        {details.MediaStreams.find(s => s.Type === "Audio")?.DisplayTitle || "Unknown"}
                                      </dd>
                                    </div>
                                  </>
                                )}
                              </dl>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
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