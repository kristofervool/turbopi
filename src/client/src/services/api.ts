import axios from 'axios';
import type { Movie, YTSMovie, DownloadProgress, PlaybackStatus } from '../types/index.js';

const api = axios.create({
  baseURL: '/api'
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

export const scanLibrary = async (): Promise<{ message: string; count: number; movies: Movie[] }> => {
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
    genres
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
