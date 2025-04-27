import axios from "axios"

// This is a client-side function that will be used to authenticate the user
export async function loginUser(username: string, password: string) {
  try {
    // Replace with your Jellyfin server URL
    const serverUrl = "http://192.168.0.85:8096"

    // First, we need to get the authentication info
    const authResponse = await axios.post(`${serverUrl}/Users/AuthenticateByName`, {
      Username: username,
      Pw: password,
    })

    if (!authResponse.data || !authResponse.data.AccessToken) {
      throw new Error("Authentication failed")
    }

    const { AccessToken, User } = authResponse.data

    // Get the auth context to store the user data
    // Access the login function from the context

    // Store the token and user data

    return AccessToken && User
      ? {
          token: AccessToken,
          user: {
            id: User.Id,
            name: User.Name,
            email: User.Email || undefined,
            imageUrl: User.PrimaryImageTag
              ? `${serverUrl}/Users/${User.Id}/Images/Primary?tag=${User.PrimaryImageTag}`
              : undefined,
          },
        }
      : null
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}
