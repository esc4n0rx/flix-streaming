// types/jellyfin.ts (atualizado)
export interface Item {
  Id: string
  Name: string
  Type: string
  Overview?: string
  PremiereDate?: string
  ProductionYear?: number
  RunTimeTicks?: number
  Genres?: string[]
  CommunityRating?: number
  OfficialRating?: string
  Container?: string
  MediaStreams?: {
    Type: string
    DisplayTitle: string
    Codec: string
    Language?: string
    IsDefault?: boolean
  }[]
  People?: {
    Id: string
    Name: string
    Role?: string
    Type?: string
    PrimaryImageTag?: string
  }[]
  Studios?: {
    Id: string
    Name: string
  }[]
  ImageTags?: {
    Primary?: string
    Backdrop?: string
  }
  BackdropImageTags?: string[]
  ServerId: string
  UserData?: {
    PlaybackPositionTicks: number
    PlayCount: number
    IsFavorite: boolean
    Played: boolean
  }
}

export interface Season {
  Id: string
  Name: string
  SeriesId: string
  IndexNumber?: number
  ImageTags?: {
    Primary?: string
  }
}

export interface Episode {
  Id: string
  Name: string
  SeriesId: string
  SeasonId: string
  IndexNumber?: number
  Overview?: string
  RunTimeTicks?: number
  ImageTags?: {
    Primary?: string
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
