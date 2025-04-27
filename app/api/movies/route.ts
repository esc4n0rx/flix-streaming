import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams
  const endpoint = searchParams.get('endpoint') || 'discover/movie'
  const language = searchParams.get('language') || 'pt-BR'
  const page = searchParams.get('page') || '1'
  const sort_by = searchParams.get('sort_by') || 'popularity.desc'
  const include_adult = searchParams.get('include_adult') || 'false'

  // Get API token from environment variable
  const tmdbApiToken = process.env.TMDB_API_TOKEN

  if (!tmdbApiToken) {
    return new Response(JSON.stringify({ error: 'API Token not configured' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    // Build the TMDb API URL with query parameters
    const url = new URL(`https://api.themoviedb.org/3/${endpoint}`)
    url.searchParams.append('language', language)
    url.searchParams.append('page', page)
    url.searchParams.append('sort_by', sort_by)
    url.searchParams.append('include_adult', include_adult)

    // Fetch data from TMDb API
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${tmdbApiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`TMDb API responded with status: ${response.status}`)
    }

    const data = await response.json()

    // Return the data
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error fetching from TMDb API:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch data from TMDb API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}