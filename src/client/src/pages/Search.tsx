import { useState } from 'react';
import SearchBar from '../components/SearchBar.tsx';
import MovieCard from '../components/MovieCard.tsx';
import MovieModal from '../components/MovieModal.tsx';
import type { YTSMovie, YTSTorrent } from '../types/index.js';
import { searchYTS, downloadTorrent, playMovie } from '../services/api.js';

export default function Search() {
  const [movies, setMovies] = useState<YTSMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<YTSMovie | null>(null);

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

  const handleMovieClick = (movie: YTSMovie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const handleDownload = async (torrent: YTSTorrent) => {
    if (!selectedMovie) return;

    try {
      const magnetUri = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(selectedMovie.title)}`;

      await downloadTorrent(
        magnetUri,
        selectedMovie.title,
        selectedMovie.medium_cover_image,
        selectedMovie.imdb_code,
        selectedMovie.rating,
        selectedMovie.genres
      );

      alert(`Download started for ${selectedMovie.title} (${torrent.quality})`);
      handleCloseModal();
    } catch (err) {
      alert('Failed to start download');
      console.error(err);
    }
  };

  const handlePlay = async (torrent: YTSTorrent) => {
    if (!selectedMovie) return;

    try {
      const magnetUri = `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(selectedMovie.title)}`;

      await playMovie({ magnetUri });
      alert(`Starting playback for ${selectedMovie.title} (${torrent.quality})`);
      handleCloseModal();
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
          <div key={movie.id} onClick={() => handleMovieClick(movie)}>
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>

      {!loading && movies.length === 0 && !error && (
        <p className="empty-state">Search for movies to get started</p>
      )}

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={handleCloseModal}
          onPlay={handlePlay}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
