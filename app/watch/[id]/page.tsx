"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { getPlaybackInfo, getStreamUrl, getItemDetails, getSubtitleStreams } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { 
  ArrowLeft, 
  Maximize, 
  Minimize,
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  SkipForward, 
  SkipBack, 
  Settings,
  Subtitles,
  X,
  Info,
  Check
} from "lucide-react"
import Hls from "hls.js"
import { formatTime } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Tipos para legendas e streams
interface SubtitleTrack {
  id: string;
  displayTitle: string;
  language: string;
  isDefault: boolean;
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Extrair o ID de maneira correta para o Next.js
  const resolvedParams = React.use(params as Promise<{ id: string }>);
  const itemId = resolvedParams.id;

  // Principais estados
  const [isLoading, setIsLoading] = useState(true)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [itemDetails, setItemDetails] = useState<any>(null)
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([])
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null)
  
  // Estados do player
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(100)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedTime, setBufferedTime] = useState(0)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false)
  const [seeking, setSeeking] = useState(false)
  const [streamError, setStreamError] = useState(false)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hlsInstanceRef = useRef<Hls | null>(null)
  const isUserInteractingRef = useRef(false)
  
  // Hooks
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Carregar informações do stream e detalhes do item
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Obter detalhes do item (título, descrição, etc)
        const details = await getItemDetails(itemId)
        setItemDetails(details)
        
        // Obter informações de reprodução
        const playbackInfo = await getPlaybackInfo(itemId)
        
        // Obter legendas disponíveis
        const subtitles = await getSubtitleStreams(itemId)
        setSubtitleTracks(subtitles || [])
        
        // Se houver uma legenda padrão, configurar
        const defaultSubtitle = subtitles?.find((s: { isDefault: any }) => s.isDefault)
        if (defaultSubtitle) {
          setCurrentSubtitle(defaultSubtitle.id)
        }
        
        // Obter URL do stream
        const url = await getStreamUrl(itemId, playbackInfo)
        setStreamUrl(url)
      } catch (error) {
        console.error("Error loading video:", error)
        toast({
          title: "Error loading video",
          description: "Failed to load video stream",
          variant: "destructive",
        })
        router.push(`/details/${itemId}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    return () => {
      // Limpar a instância HLS quando o componente for desmontado
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy()
        hlsInstanceRef.current = null
      }
    }
  }, [itemId, isAuthenticated, router, toast])

  // Configurar controladores de eventos para mouse e teclado
  useEffect(() => {
    // Limpar controles após inatividade
    const hideControlsTimer = () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }

      // Não ocultar controles se o usuário estiver interagindo
      if (isUserInteractingRef.current) {
        return
      }

      setShowControls(true)

      controlsTimerRef.current = setTimeout(() => {
        if (isPlaying && !showVolumeSlider && !showInfoPanel && !showSubtitlesMenu) {
          setShowControls(false)
        }
      }, 3000)
    }

    // Configurar event listeners
    document.addEventListener("mousemove", hideControlsTimer)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousemove", hideControlsTimer)
      document.removeEventListener("keydown", handleKeyDown)
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
    }
  }, [isPlaying, showVolumeSlider, showInfoPanel, showSubtitlesMenu])

  // Configurar player quando a URL do stream estiver disponível
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    
    // Limpar qualquer instância existente do HLS
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy()
      hlsInstanceRef.current = null
    }
    
    setStreamError(false)
    
    // Verificar se a URL é para streaming HLS ou direto
    if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
      // Configurar player HLS
      const hls = new Hls({
        progressive: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        xhrSetup: function(xhr) {
          // Aumentar timeout para evitar erros de timeout
          xhr.timeout = 60000
        }
      });
      
      hlsInstanceRef.current = hls
      
      // Configurar tratamento de erros
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data)
        
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.details === 'manifestLoadTimeOut' || data.details === 'manifestLoadError') {
                // Tentar uma URL alternativa para streaming direto
                tryDirectStreamingUrl()
              } else {
                toast({
                  title: "Network Error",
                  description: "Please check your connection",
                  variant: "destructive"
                })
                hls.startLoad()
              }
              break
              
            case Hls.ErrorTypes.MEDIA_ERROR:
              toast({
                title: "Media Error",
                description: "Attempting to recover",
                variant: "destructive"
              })
              hls.recoverMediaError()
              break
              
            default:
              setStreamError(true)
              toast({
                title: "Playback Error",
                description: "Unable to play this content",
                variant: "destructive"
              })
              break
          }
        }
      })

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(err => {
          console.error("Play error:", err)
          setIsPlaying(false)
        })
      })
      
      hls.loadSource(streamUrl)
      hls.attachMedia(videoRef.current)
    } 
    else {
      // Streaming direto (não HLS)
      videoRef.current.src = streamUrl
      videoRef.current.play().catch(err => {
        console.error("Play error:", err)
        setIsPlaying(false)
      })
    }
    
  }, [streamUrl, toast])

  // Função para tentar URL de streaming direto se HLS falhar
  const tryDirectStreamingUrl = async () => {
    if (!videoRef.current) return;
    
    try {
      // Tentar obter uma URL de streaming direto MP4
      let directUrl = streamUrl?.replace('master.m3u8', 'stream.mp4');
      
      // Se ainda não tiver .mp4, adicionar
      if (!directUrl?.includes('.mp4')) {
        directUrl = streamUrl?.split('?')[0];
        if (!directUrl?.endsWith('.mp4')) {
          directUrl += '/stream.mp4';
        }
        directUrl += '?' + streamUrl?.split('?')[1];
      }
      
      console.log("Trying direct streaming URL:", directUrl);
      
      if (directUrl) {
        videoRef.current.src = directUrl;
      }
      videoRef.current.play().catch(err => {
        console.error("Direct play error:", err)
        setIsPlaying(false)
        setStreamError(true)
      })
    } catch (error) {
      console.error("Error with direct streaming:", error)
      setStreamError(true)
    }
  }

  // Event handlers do vídeo
  useEffect(() => {
    const videoElement = videoRef.current
    
    if (!videoElement) return
    
    const handleTimeUpdate = () => {
      if (!seeking && !isUserInteractingRef.current) {
        setCurrentTime(videoElement.currentTime)
      }
    }
    
    const handleDurationChange = () => {
      setDuration(videoElement.duration)
    }
    
    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        setBufferedTime(videoElement.buffered.end(videoElement.buffered.length - 1))
      }
    }
    
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => setVolume(videoElement.volume * 100)
    const handleEnded = () => {
      setIsPlaying(false)
      setShowControls(true)
    }
    
    const handleError = (e: Event) => {
      console.error("Video error:", videoElement.error)
      setStreamError(true)
    }

    // Adicionar event listeners
    videoElement.addEventListener("timeupdate", handleTimeUpdate)
    videoElement.addEventListener("durationchange", handleDurationChange)
    videoElement.addEventListener("progress", handleProgress)
    videoElement.addEventListener("play", handlePlay)
    videoElement.addEventListener("pause", handlePause)
    videoElement.addEventListener("volumechange", handleVolumeChange)
    videoElement.addEventListener("ended", handleEnded)
    videoElement.addEventListener("error", handleError)
    
    return () => {
      // Remover event listeners
      videoElement.removeEventListener("timeupdate", handleTimeUpdate)
      videoElement.removeEventListener("durationchange", handleDurationChange)
      videoElement.removeEventListener("progress", handleProgress)
      videoElement.removeEventListener("play", handlePlay)
      videoElement.removeEventListener("pause", handlePause)
      videoElement.removeEventListener("volumechange", handleVolumeChange)
      videoElement.removeEventListener("ended", handleEnded)
      videoElement.removeEventListener("error", handleError)
    }
  }, [seeking])

  // Atualizar legendas quando selecionadas
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Remover todas as legendas atuais
    const tracks = videoRef.current.textTracks;
    for (let i = tracks.length - 1; i >= 0; i--) {
      videoRef.current.removeChild(tracks[i] as any);
    }
    
    // Adicionar a legenda selecionada, se houver
    if (currentSubtitle) {
      const selectedTrack = subtitleTracks.find(t => t.id === currentSubtitle);
      if (selectedTrack) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = selectedTrack.displayTitle;
        track.srclang = selectedTrack.language;
        track.src = `${getSubtitleUrl(itemId, selectedTrack.id)}`;
        track.default = true;
        
        videoRef.current.appendChild(track);
        
        // Forçar exibição da legenda
        setTimeout(() => {
          if (videoRef.current && videoRef.current.textTracks[0]) {
            videoRef.current.textTracks[0].mode = 'showing';
          }
        }, 500);
      }
    }
  }, [currentSubtitle, subtitleTracks, itemId]);

  // Função auxiliar para obter URL da legenda
  const getSubtitleUrl = (itemId: string, subtitleId: string) => {
    const baseUrl = streamUrl?.split('/Videos/')[0] || '';
    return `${baseUrl}/Videos/${itemId}/${subtitleId}/Subtitles/0/Stream.vtt`;
  };

  // Handler para teclas de atalho
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case "Space":
        e.preventDefault()
        togglePlay()
        break
      case "ArrowRight":
        e.preventDefault()
        skipForward()
        break
      case "ArrowLeft":
        e.preventDefault()
        skipBackward()
        break
      case "ArrowUp":
        e.preventDefault()
        adjustVolume(Math.min(volume + 5, 100))
        break
      case "ArrowDown":
        e.preventDefault()
        adjustVolume(Math.max(volume - 5, 0))
        break
      case "KeyM":
        e.preventDefault()
        toggleMute()
        break
      case "KeyF":
        e.preventDefault()
        toggleFullscreen()
        break
      case "KeyS":
        e.preventDefault()
        setShowSubtitlesMenu(!showSubtitlesMenu)
        break
      case "Escape":
        if (showInfoPanel) {
          setShowInfoPanel(false)
        }
        if (showSubtitlesMenu) {
          setShowSubtitlesMenu(false)
        }
        break
    }
  }

  // Controladores de reprodução
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(err => {
          console.error("Play toggle error:", err)
        })
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

  const adjustVolume = (newVolume: number) => {
    if (videoRef.current) {
      const volumeValue = newVolume / 100
      videoRef.current.volume = volumeValue
      setVolume(newVolume)
      
      if (newVolume === 0 && !isMuted) {
        setIsMuted(true)
        videoRef.current.muted = true
      } else if (newVolume > 0 && isMuted) {
        setIsMuted(false)
        videoRef.current.muted = false
      }
    }
  }

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration)
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0)
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current && value.length > 0) {
      const newTime = value[0]
      setSeeking(true)
      isUserInteractingRef.current = true
      setCurrentTime(newTime)
    }
  }
  
  const handleSeekEnd = (value: number[]) => {
    if (videoRef.current && value.length > 0) {
      const newTime = value[0]
      videoRef.current.currentTime = newTime
      setSeeking(false)
      
      // Usar um pequeno timeout para evitar que o usuário veja um salto na barra de progresso
      setTimeout(() => {
        isUserInteractingRef.current = false
      }, 500)
    }
  }

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return
    
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        toast({
          title: "Fullscreen Error",
          description: "Could not enter fullscreen mode",
          variant: "destructive"
        })
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(err => {
        console.error("Error exiting fullscreen:", err)
      })
      setIsFullscreen(false)
    }
  }

  const handleSubtitleSelect = (id: string | null) => {
    setCurrentSubtitle(id)
    setShowSubtitlesMenu(false)
  }

  const goBack = () => {
    router.push(`/details/${itemId}`)
  }

  // Renderização condicional para estado não autenticado
  if (!isAuthenticated) {
    return null
  }

  return (
    <div 
      ref={playerContainerRef}
      className="h-screen w-screen bg-black relative overflow-hidden"
      onClick={() => {
        // Toggle controls on background click
        if (showControls) {
          setShowControls(false)
        } else {
          setShowControls(true)
        }
      }}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-violet-700 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading video...</p>
        </div>
      ) : streamError ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="bg-red-900/50 p-8 rounded-lg max-w-md">
            <h2 className="text-white text-xl font-bold mb-4">Playback Error</h2>
            <p className="text-gray-300 mb-6">
              Sorry, we couldn't play this content. There might be an issue with the stream or your connection.
            </p>
            <Button onClick={goBack} className="bg-violet-700 hover:bg-violet-600">
              Go Back
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Video element */}
          <video 
            ref={videoRef} 
            className="h-full w-full object-contain cursor-none" 
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            crossOrigin="anonymous" // Importante para legendas
          />

          {/* Info panel overlay */}
          <AnimatePresence>
            {showInfoPanel && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowInfoPanel(false)
                }}
              >
                <div 
                  className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-gray-800"
                    onClick={() => setShowInfoPanel(false)}
                  >
                    <X size={20} />
                  </Button>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    {itemDetails?.primaryImageUrl && (
                      <div className="w-32 h-48 md:h-auto flex-shrink-0">
                        <img 
                          src={itemDetails.primaryImageUrl} 
                          alt={itemDetails.Name} 
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{itemDetails?.Name}</h2>
                      
                      {itemDetails?.ProductionYear && (
                        <p className="text-gray-400 text-sm mb-4">{itemDetails.ProductionYear}</p>
                      )}
                      
                      {itemDetails?.Overview && (
                        <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-4">{itemDetails.Overview}</p>
                      )}
                      
                      {itemDetails?.Genres && itemDetails.Genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-auto">
                          {itemDetails.Genres.map((genre: string) => (
                            <span key={genre} className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300">
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls overlay */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top gradient overlay */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                
                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                
                {/* Top controls */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={goBack} 
                      className="text-white bg-black/30 hover:bg-black/50"
                    >
                      <ArrowLeft size={20} />
                    </Button>
                    
                    <h2 className="text-white text-lg font-medium hidden md:block">
                      {itemDetails?.Name}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowInfoPanel(prev => !prev)}
                      className="text-white bg-black/30 hover:bg-black/50"
                    >
                      <Info size={20} />
                    </Button>
                    
                    {/* Menu de legendas */}
                    <DropdownMenu open={showSubtitlesMenu} onOpenChange={setShowSubtitlesMenu}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`text-white bg-black/30 hover:bg-black/50 ${currentSubtitle ? 'text-violet-400' : ''}`}
                        >
                          <Subtitles size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
                        <DropdownMenuItem 
                          className={`flex justify-between items-center ${!currentSubtitle ? 'text-violet-400' : ''}`}
                          onClick={() => handleSubtitleSelect(null)}
                        >
                          Off
                          {!currentSubtitle && <Check size={16} />}
                        </DropdownMenuItem>
                        
                        {subtitleTracks.map((track) => (
                          <DropdownMenuItem 
                            key={track.id}
                            className={`flex justify-between items-center ${currentSubtitle === track.id ? 'text-violet-400' : ''}`}
                            onClick={() => handleSubtitleSelect(track.id)}
                          >
                            {track.displayTitle}
                            {currentSubtitle === track.id && <Check size={16} />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white bg-black/30 hover:bg-black/50"
                    >
                      <Settings size={20} />
                    </Button>
                  </div>
                </div>
                
                {/* Center play/pause button */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {!isPlaying && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlay}
                      className="text-white bg-black/30 hover:bg-black/50 rounded-full w-20 h-20 pointer-events-auto"
                    >
                      <Play size={40} />
                    </Button>
                  )}
                </div>
                
                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium w-12 text-center">
                      {formatTime(currentTime)}
                    </span>
                    
                    <div className="flex-1 flex items-center">
                      <div className="relative w-full h-1 group">
                        {/* Buffered progress */}
                        <div 
                          className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
                          style={{ width: `${(bufferedTime / (duration || 1)) * 100}%` }}
                        />
                        
                        {/* Actual progress */}
                        <div 
                          className="absolute inset-y-0 left-0 bg-violet-600 rounded-full"
                          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                        
                        {/* Slider for seeking */}
                        <Slider 
                          value={[currentTime]} 
                          min={0} 
                          max={duration || 100}
                          step={0.01}
                          onValueChange={handleSeek}
                          onValueCommit={handleSeekEnd}
                          className="absolute inset-0 h-1 group-hover:h-2 transition-all cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                    
                    <span className="text-white text-sm font-medium w-12 text-center">
                      {formatTime(duration)}
                    </span>
                  </div>
                  
                  {/* Control buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 md:gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={togglePlay}
                        className="text-white hover:bg-black/30"
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={skipBackward}
                        className="text-white hover:bg-black/30"
                      >
                        <SkipBack size={24} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={skipForward}
                        className="text-white hover:bg-black/30"
                      > <SkipForward size={24} />
                      </Button>
                      
                      <div className="relative flex items-center" 
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => setShowVolumeSlider(false)}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleMute}
                          className="text-white hover:bg-black/30 z-10"
                        >
                          {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </Button>
                        
                        <AnimatePresence>
                          {showVolumeSlider && (
                            <motion.div 
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: 100, opacity: 1 }}
                              exit={{ width: 0, opacity: 0 }}
                              className="absolute left-10 h-10 z-0 flex items-center pl-2"
                            >
                              <Slider 
                                value={[isMuted ? 0 : volume]} 
                                min={0} 
                                max={100}
                                step={1}
                                onValueChange={(val) => adjustVolume(val[0])}
                                className="h-5"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-black/30"
                    >
                      {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}