import { useState } from 'react';
import SearchBar from '../components/SearchBar.tsx';
import MovieCard from '../components/MovieCard.tsx';
import type { YTSMovie } from '../types/index.js';
import { searchYTS, downloadTorrent, playMovie } from '../services/api.js';

export default function Search() {
  const [movies, setMovies] = useState<YTSMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const results = await searchYTS(query);
      setMovies(results);
    } catch (err) {
      setError('Failed to search movies. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (movie: YTSMovie) => {
    try {
      const torrent = movie.torrents[0]; // Get the first torrent (usually 720p or 1080p)
      const magnetUri = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title)}`;

      await downloadTorrent(
        magnetUri,
        movie.title,
        movie.medium_cover_image,
        movie.imdb_code,
        movie.rating,
        movie.genres
      );

      alert(`Download started for ${movie.title}`);
    } catch (err) {
      alert('Failed to start download');
      console.error(err);
    }
  };

  const handlePlay = async (movie: YTSMovie) => {
    try {
      const torrent = movie.torrents[0];
      const magnetUri = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title)}`;

      await playMovie({ magnetUri });
      alert(`Starting playback for ${movie.title}`);
    } catch (err) {
      alert('Failed to start playback');
      console.error(err);
    }
  };

  return (
    <div className="page">
      <h1>Search Movies</h1>
      <SearchBar onSearch={handleSearch} placeholder="Search YTS movies..." />

      {loading && <p className="loading">Searching...</p>}
      {error && <p className="error">{error}</p>}

      <div className="movies-grid">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onPlay={() => handlePlay(movie)}
            onDownload={() => handleDownload(movie)}
          />
        ))}
      </div>

      {!loading && movies.length === 0 && !error && (
        <p className="empty-state">Search for movies to get started</p>
      )}
    </div>
  );
}
