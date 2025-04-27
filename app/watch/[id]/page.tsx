"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getPlaybackInfo, getStreamUrl } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Maximize, Volume2, VolumeX, Pause, Play } from "lucide-react"
import Hls from "hls.js"

export default function WatchPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const fetchStreamInfo = async () => {
      try {
        setIsLoading(true)
        const playbackInfo = await getPlaybackInfo(params.id)
        const url = await getStreamUrl(params.id, playbackInfo)
        setStreamUrl(url)
      } catch (error) {
        toast({
          title: "Error loading video",
          description: "Failed to load video stream",
          variant: "destructive",
        })
        router.push(`/details/${params.id}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreamInfo()

    // Hide controls after 3 seconds of inactivity
    const hideControlsTimer = () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }

      setShowControls(true)

      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    // Set up event listeners
    document.addEventListener("mousemove", hideControlsTimer)

    return () => {
      document.removeEventListener("mousemove", hideControlsTimer)
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
    }
  }, [params.id, isAuthenticated, router, toast])

  useEffect(() => {
    if (streamUrl && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(streamUrl)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play()
        })
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        videoRef.current.src = streamUrl
        videoRef.current.play()
      }
    }
  }, [streamUrl])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const goBack = () => {
    router.push(`/details/${params.id}`)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="h-screen w-screen bg-black relative">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-violet-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="h-full w-full object-contain" onClick={togglePlay} />

          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
            >
              <div className="absolute top-4 left-4">
                <Button variant="ghost" size="icon" onClick={goBack} className="text-white hover:bg-black/30">
                  <ArrowLeft size={24} />
                </Button>
              </div>

              <div className="absolute bottom-8 left-0 right-0 px-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-black/30">
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </Button>

                    <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-black/30">
                      {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-black/30"
                  >
                    <Maximize size={24} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
