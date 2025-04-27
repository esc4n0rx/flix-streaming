// lib/auth.ts (corrigido)
import axios from "axios"

// Ajustar para o URL do seu servidor Jellyfin
const serverUrl = "http://192.168.0.85:8096"

export async function loginUser(username: string, password: string) {
  try {
    // A API do Jellyfin espera os headers corretos
    const authResponse = await axios.post(
      `${serverUrl}/Users/AuthenticateByName`,
      {
        Username: username,
        Pw: password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Authorization': `MediaBrowser Client="Flix Web", Device="Browser", DeviceId="unique-device-id", Version="1.0.0"`
        }
      }
    )

    if (!authResponse.data || !authResponse.data.AccessToken) {
      throw new Error("Authentication failed")
    }

    const { AccessToken, User } = authResponse.data

    // Criar objeto de usuário
    const userData = {
      id: User.Id,
      name: User.Name,
      email: User.Email || undefined,
      imageUrl: User.PrimaryImageTag
        ? `${serverUrl}/Users/${User.Id}/Images/Primary?tag=${User.PrimaryImageTag}`
        : undefined,
    }

    // Salvar token e dados do usuário no localStorage
    localStorage.setItem("jellyfin_token", AccessToken)
    localStorage.setItem("jellyfin_user", JSON.stringify(userData))

    return {
      token: AccessToken,
      user: userData
    }
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}