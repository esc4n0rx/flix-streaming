export interface Item {
  id: string
  name: string
  type: string
  overview?: string
  productionYear?: number
  runTimeTicks?: number
  genres?: string[]
  communityRating?: number
  imageTags?: {
    Primary?: string
    Backdrop?: string
  }
}

export interface ItemDetails extends Item {
  primaryImageUrl: string
  backdropImageUrl: string
}

export interface PlaybackInfo {
  mediaSources: MediaSource[]
}

export interface MediaSource {
  id: string
  name: string
  path: string
  protocol: string
  mediaStreams: MediaStream[]
}

export interface MediaStream {
  codec: string
  type: string
  index: number
  isDefault: boolean
}
