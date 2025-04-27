// lib/api.ts (modificado)
import axios from "axios"

// Defina a URL do seu servidor Jellyfin
const serverUrl = "http://192.168.0.85:8096"

// Helper function para obter o token e o ID do usuário
export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("jellyfin_token")
  }
  return null
}



function getUserId() {
  if (typeof window !== "undefined") {
    try {
      const userJson = localStorage.getItem("jellyfin_user")
      if (userJson) {
        const user = JSON.parse(userJson)
        return user.id
      }
    } catch (error) {
      console.error("Error parsing user data:", error)
    }
  }
  return null
}

// Create an axios instance with the auth header
const api = axios.create({
  baseURL: serverUrl,
})

// Add a request interceptor to add the auth token to all requests
api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers["X-MediaBrowser-Token"] = token
  }
  
  // Adicionar cabeçalhos do Jellyfin
  config.headers["Content-Type"] = "application/json"
  config.headers["X-Emby-Authorization"] = `MediaBrowser Client="Flix Web", Device="Browser", DeviceId="flix-web-app", Version="1.0.0"`
  
  return config
})

// Get user info
export async function getUserInfo() {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token")
    }

    const response = await api.get("/Users/Me")
    return response.data
  } catch (error) {
    console.error("Error getting user info:", error)
    throw error
  }
}

interface ItemParams {
  filters?: string;
  includeItemTypes?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  recursive?: boolean;
  parentId?: string;
  userId?: string;
  }

export async function getItems(params: ItemParams = {}) {
  try {
    // Primeiro, obtenha as pastas de mídia
    const folders = await getMediaFolders()
    
    // Identifique as pastas corretas com base no tipo solicitado
    let parentId = null
    
    if (params.includeItemTypes === "Movie") {
      // Encontrar a pasta de Filmes
      const movieFolder = folders.find((folder: { CollectionType: string; Name: string }) => 
        folder.CollectionType === "movies" || 
        folder.Name === "Filmes" || 
        folder.Name === "Movies"
      )
      
      if (movieFolder) {
        parentId = movieFolder.Id
      }
    } else if (params.includeItemTypes === "Series") {
      // Encontrar a pasta de Séries
      const seriesFolder = folders.find((folder: { CollectionType: string; Name: string }) => 
        folder.CollectionType === "tvshows" || 
        folder.Name === "Séries" || 
        folder.Name === "TV Shows" ||
        folder.Name === "Series"
      )
      
      if (seriesFolder) {
        parentId = seriesFolder.Id
      }
    }
    
    // Se for uma solicitação para itens vistos recentemente, não precisamos de uma pasta específica
    if (params.filters === "IsResumable") {
      // Obter diretamente sem parentId, mas forçando recursive para true
      const response = await api.get("/Users/" + getUserId() + "/Items", { 
        params: {
          ...params,
          userId: getUserId(),
          recursive: true
        }
      })
      
      console.log("Continue watching items:", response.data)
      return response.data.Items || []
    }
    
    // Se temos um parentId, busque dentro dessa pasta
    if (parentId) {
      return await getLibraryItems(parentId, params)
    }
    
    // Caso não tenhamos encontrado uma pasta específica, retorne a lista de pastas
    return folders
  } catch (error) {
    console.error("Error getting items:", error)
    throw error
  }
}

// Get item details
export async function getItemDetails(itemId: string) {
  try {
    const userId = getUserId()
    if (!userId) {
      throw new Error("User ID not found")
    }
    
    const response = await api.get(`/Users/${userId}/Items/${itemId}`)

    // Transform the response to include image URLs
    const item = response.data
    return {
      ...item,
      primaryImageUrl: getImageUrl(itemId, "Primary"),
      backdropImageUrl: getImageUrl(itemId, "Backdrop"),
    }
  } catch (error) {
    console.error("Error getting item details:", error)
    throw error
  }
}

export async function getMediaFolders() {
  try {
    const userId = getUserId()
    if (!userId) {
      throw new Error("User ID not found")
    }
    
    const response = await api.get("/Users/" + userId + "/Items", {
      params: {
        userId: userId
      }
    })
    
    console.log("Media Folders Response:", response.data)
    return response.data.Items || []
  } catch (error) {
    console.error("Error getting media folders:", error)
    throw error
  }
}


export async function getLibraryItems(parentId: string, params = {}) {
  try {
    const userId = getUserId()
    if (!userId) {
      throw new Error("User ID not found")
    }
    
    const response = await api.get("/Users/" + userId + "/Items", { 
      params: {
        ...params,
        userId: userId,
        parentId: parentId,
        recursive: true // Importante: busca recursivamente dentro da pasta
      }
    })
    
    console.log(`Items from parent ${parentId}:`, response.data)
    return response.data.Items || []
  } catch (error) {
    console.error(`Error getting items from parent ${parentId}:`, error)
    throw error
  }
}



// Get image URL
interface ImageOptions {
  itemId: string;
  imageType?: 'Primary' | 'Backdrop' | 'Logo' | 'Banner' | 'Thumb';
}

// lib/api.ts (apenas a função getImageUrl)
export function getImageUrl(itemId : string, imageType = "Primary") {
  const token = getAuthToken()
  
  // Verificar se o ID é válido
  if (!itemId) {
    console.error("Invalid item ID for image:", itemId)
    return "/placeholder.svg"
  }
  
  return `${serverUrl}/Items/${itemId}/Images/${imageType}?fillHeight=400&fillWidth=270&quality=90&api_key=${token}`
}


export async function getSeasons(seriesId: string) {
  try {
    const userId = getUserId()
    if (!userId) {
      throw new Error("User ID not found")
    }
    
    const response = await api.get(`/Shows/${seriesId}/Seasons`, {
      params: {
        userId: userId
      }
    })
    
    return response.data.Items || []
  } catch (error) {
    console.error("Error getting seasons:", error)
    throw error
  }
}

// Função para obter episódios de uma temporada
export async function getSeasonEpisodes(seasonId: string) {
  try {
    const userId = getUserId()
    if (!userId) {
      throw new Error("User ID not found")
    }
    
    const response = await api.get(`/Shows/Seasons/${seasonId}/Episodes`, {
      params: {
        userId: userId
      }
    })
    
    return response.data.Items || []
  } catch (error) {
    console.error("Error getting episodes:", error)
    throw error
  }
}



// Get playback info
export async function getPlaybackInfo(itemId: string) {
  try {
    const userId = getUserId()
    if (!userId) {
      throw new Error("User ID not found")
    }

    // Parametros mais detalhados para melhor compatibilidade
    const response = await api.get(`/Items/${itemId}/PlaybackInfo`, {
      params: {
        userId: userId,
        startTimeTicks: 0,
        autoOpenLiveStream: true,
        mediaSourceId: itemId,
        deviceId: 'flix-web-app',
        maxStreamingBitrate: 140000000
      }
    })

    return response.data
  } catch (error) {
    console.error("Error getting playback info:", error)
    throw error
  }
}

export async function getSubtitleStreams(itemId: string) {
  try {
    const userId = getUserId()
    if (!userId) {
      throw new Error("User ID not found")
    }

    // Primeiro, obtemos os detalhes completos do item para acessar as informações de stream
    const response = await api.get(`/Items/${itemId}`, {
      params: {
        userId: userId
      }
    })
    
    // Extrair streams de legendas dos detalhes do item
    const mediaStreams = response.data.MediaStreams || []
    const subtitleStreams = mediaStreams
      .filter((stream: any) => stream.Type === 'Subtitle')
      .map((stream: any) => ({
        id: stream.Index.toString(),
        displayTitle: stream.DisplayTitle || `${stream.Language || 'Unknown'} ${stream.Title || ''}`,
        language: stream.Language || 'und',
        isDefault: stream.IsDefault || false
      }))
    
    return subtitleStreams
  } catch (error) {
    console.error("Error getting subtitle streams:", error)
    return []
  }
}
export async function getStreamUrl(itemId: string, playbackInfo: any) {
  try {
    const token = getAuthToken()
    
    if (!token) {
      throw new Error("Authentication token not found")
    }

    // Verificar se é possível fazer streaming direto
    if (playbackInfo && playbackInfo.MediaSources && playbackInfo.MediaSources.length > 0) {
      const mediaSource = playbackInfo.MediaSources[0]
      
      // Para streaming direto (preferível para maior compatibilidade)
      if (mediaSource.SupportsDirectStream) {
        return `${serverUrl}/Videos/${itemId}/stream.mp4?static=true&api_key=${token}`
      }
      
      // Caso contrário, tentar HLS
      return `${serverUrl}/Videos/${itemId}/master.m3u8?static=true&api_key=${token}`
    }
    
    // URL padrão como fallback
    return `${serverUrl}/Videos/${itemId}/stream.mp4?static=true&api_key=${token}`
  } catch (error) {
    console.error("Error getting stream URL:", error)
    throw error
  }
}
