export interface Movie {
  id: string;
  title: string;
  year: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  thumbnail?: string;
  imdbCode?: string;
  rating?: number;
  genres?: string[];
  addedAt: string;
}

export interface MovieMetadata {
  movies: Movie[];
}

export interface YTSMovie {
  id: number;
  title: string;
  year: number;
  rating: number;
  genres: string[];
  summary: string;
  medium_cover_image: string;
  large_cover_image: string;
  imdb_code: string;
  torrents: YTSTorrent[];
}

export interface YTSTorrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  size: string;
}

export interface YTSResponse {
  status: string;
  data: {
    movie_count: number;
    limit: number;
    page_number: number;
    movies: YTSMovie[];
  };
}

export interface DownloadProgress {
  id: string;
  magnetUri: string;
  title: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  downloaded: number;
  total: number;
  status: 'downloading' | 'seeding' | 'complete' | 'error';
  error?: string;
}

export interface Config {
  HOST: string;
  PORT: number;
  MOVIES_DIR: string;
  TV_SHOWS_DIR: string;
  METADATA_FILE: string;
  SHOWS_METADATA_FILE: string;
  VLC_DISPLAY: string;
  VLC_XAUTHORITY: string;
  NODE_ENV: string;
}

export interface PlaybackStatus {
  isActive: boolean;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  title?: string;
  thumbnail?: string;
  imdbCode?: string;
  hasSubtitles?: boolean;
}

export interface Subtitle {
  id: string;
  language: string;
  fileName: string;
  downloadCount: number;
  rating: number;
  fileId: number;
}

// TV Show types
export interface Episode {
  id: string;
  showId: string;
  episodeNumber: number;
  seasonNumber: number;
  title?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  magnetUrl?: string;
  addedAt: string;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface TVShow {
  id: string;
  title: string;
  imdbCode: string;
  thumbnail?: string;
  year?: number;
  rating?: number;
  genres?: string[];
  seasons: Season[];
  addedAt: string;
}

export interface ShowMetadata {
  shows: TVShow[];
}

export interface EZTVTorrent {
  id: number;
  hash: string;
  filename: string;
  episode_url: string;
  torrent_url: string;
  magnet_url: string;
  title: string;
  imdb_id: string;
  season: number;
  episode: number;
  small_screenshot: string;
  large_screenshot: string;
  seeds: number;
  peers: number;
  date_released_unix: number;
  size_bytes: number;
}

export interface EZTVResponse {
  torrents_count: number;
  limit: number;
  page: number;
  torrents: EZTVTorrent[];
}

export interface ShowSearchResult {
  imdbId: string;
  title: string;
  thumbnail?: string;
  episodeCount: number;
  latestSeason: number;
  latestEpisode: number;
}
