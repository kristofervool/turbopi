import axios from 'axios';
import type {
  Movie,
  YTSMovie,
  DownloadProgress,
  PlaybackStatus,
  Subtitle,
  TVShow,
  ShowSearchResult,
  EZTVTorrent,
} from '../types/index.js';

const api = axios.create({
  baseURL: '/api',
});

export const searchYTS = async (query: string): Promise<YTSMovie[]> => {
  const response = await api.get<YTSMovie[]>('/search', { params: { query } });
  return response.data;
};

export const getLibrary = async (): Promise<Movie[]> => {
  const response = await api.get<Movie[]>('/library');
  return response.data;
};

export const searchLibrary = async (query: string): Promise<Movie[]> => {
  const response = await api.get<Movie[]>('/library/search', { params: { query } });
  return response.data;
};

export const scanLibrary = async (): Promise<{
  message: string;
  count: number;
  movies: Movie[];
}> => {
  const response = await api.post('/library/scan');
  return response.data;
};

export const deleteMovie = async (id: string): Promise<void> => {
  await api.delete(`/library/${id}`);
};

export const downloadTorrent = async (
  magnetUri: string,
  title?: string,
  thumbnail?: string,
  imdbCode?: string,
  rating?: number,
  genres?: string[]
): Promise<{ message: string; downloadId: string }> => {
  const response = await api.post('/download', {
    magnetUri,
    title,
    thumbnail,
    imdbCode,
    rating,
    genres,
  });
  return response.data;
};

export const getDownloadStatus = async (id: string): Promise<DownloadProgress> => {
  const response = await api.get<DownloadProgress>(`/download/status/${id}`);
  return response.data;
};

export const getAllDownloads = async (): Promise<DownloadProgress[]> => {
  const response = await api.get<DownloadProgress[]>('/download/all');
  return response.data;
};

export const playMovie = async (params: {
  magnetUri?: string;
  movieId?: string;
  title?: string;
  thumbnail?: string;
  imdbCode?: string;
}): Promise<void> => {
  await api.post('/playback/play', params);
};

export const getPlaybackStatus = async (): Promise<PlaybackStatus> => {
  const response = await api.get<PlaybackStatus>('/playback/status');
  return response.data;
};

export const togglePause = async (): Promise<void> => {
  await api.post('/playback/pause');
};

export const seekPlayback = async (seconds: number): Promise<void> => {
  await api.post('/playback/seek', { seconds });
};

export const stopPlayback = async (): Promise<void> => {
  await api.post('/playback/stop');
};

export const searchSubtitles = async (): Promise<Subtitle[]> => {
  const response = await api.get<Subtitle[]>('/playback/subtitles/search');
  return response.data;
};

export const loadSubtitle = async (fileId: number, fileName: string): Promise<void> => {
  await api.post('/playback/subtitles/load', { fileId, fileName });
};

export const getSubtitleTracks = async (): Promise<{ count: number; tracks: string[] }> => {
  const response = await api.get('/playback/subtitles/tracks');
  return response.data;
};

export const selectSubtitleTrack = async (trackId: number): Promise<void> => {
  await api.post('/playback/subtitles/select', { trackId });
};

// TV Shows API
export const searchShows = async (query: string): Promise<ShowSearchResult[]> => {
  const response = await api.get<ShowSearchResult[]>('/shows/search', {
    params: { query }
  });
  return response.data;
};

export const getShowTorrents = async (
  imdbId: string
): Promise<{
  imdbId: string;
  totalTorrents: number;
  episodes: Record<string, EZTVTorrent[]>;
}> => {
  const response = await api.get(`/shows/torrents/${imdbId}`);
  return response.data;
};

export const getShowsLibrary = async (): Promise<TVShow[]> => {
  const response = await api.get<TVShow[]>('/shows/library');
  return response.data;
};

export const searchShowsLibrary = async (query: string): Promise<TVShow[]> => {
  const response = await api.get<TVShow[]>('/shows/library/search', { params: { query } });
  return response.data;
};

export const scanShowsLibrary = async (): Promise<{ message: string; shows: TVShow[] }> => {
  const response = await api.post('/shows/library/scan');
  return response.data;
};

export const getShow = async (showId: string): Promise<TVShow> => {
  const response = await api.get<TVShow>(`/shows/library/${showId}`);
  return response.data;
};

export const deleteEpisode = async (episodeId: string): Promise<void> => {
  await api.delete(`/shows/episode/${episodeId}`);
};

export const updateShow = async (showId: string, updates: Partial<TVShow>): Promise<TVShow> => {
  const response = await api.patch<TVShow>(`/shows/library/${showId}`, updates);
  return response.data;
};

export const downloadEpisode = async (params: {
  magnetUri: string;
  showTitle: string;
  showImdbId: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  thumbnail?: string;
}): Promise<{ message: string; downloadId: string }> => {
  const response = await api.post('/shows/download', params);
  return response.data;
};

export const playEpisode = async (params: {
  episodeId?: string;
  magnetUri?: string;
  title?: string;
  thumbnail?: string;
  imdbCode?: string;
}): Promise<void> => {
  await api.post('/playback/play', params);
};
