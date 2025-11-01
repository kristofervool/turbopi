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

export interface PlaybackStatus {
  isActive: boolean;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  title?: string;
  thumbnail?: string;
}
