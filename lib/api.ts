import axios from "axios"

// Replace with your Jellyfin server URL
const serverUrl = "http://192.168.0.85:8096"

// Helper function to get the auth token
function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("jellyfin_token")
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

// Get items with filters
export async function getItems(params: any = {}) {
  try {
    const response = await api.get("/Items", { params })
    return response.data.Items || []
  } catch (error) {
    console.error("Error getting items:", error)
    throw error
  }
}

// Get item details
export async function getItemDetails(itemId: string) {
  try {
    const response = await api.get(`/Items/${itemId}`)

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

// Get playback info
export async function getPlaybackInfo(itemId: string) {
  try {
    const userId = JSON.parse(localStorage.getItem("jellyfin_user") || "{}").id

    if (!userId) {
      throw new Error("User ID not found")
    }

    const response = await api.get(`/Items/${itemId}/PlaybackInfo`, {
      params: {
        userId,
      },
    })

    return response.data
  } catch (error) {
    console.error("Error getting playback info:", error)
    throw error
  }
}

// Get stream URL
export async function getStreamUrl(itemId: string, playbackInfo: any) {
  try {
    const userId = JSON.parse(localStorage.getItem("jellyfin_user") || "{}").id

    if (!userId) {
      throw new Error("User ID not found")
    }

    // For simplicity, we'll use the direct streaming URL
    // In a real app, you might want to handle different media sources and formats
    return `${serverUrl}/Videos/${itemId}/master.m3u8?api_key=${getAuthToken()}&static=true`
  } catch (error) {
    console.error("Error getting stream URL:", error)
    throw error
  }
}

// Get image URL
export function getImageUrl(itemId: string, imageType = "Primary") {
  const token = getAuthToken()
  return `${serverUrl}/Items/${itemId}/Images/${imageType}?fillHeight=400&fillWidth=270&quality=90&tag=${Date.now()}&api_key=${token}`
}
