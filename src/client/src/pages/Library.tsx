import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import MovieCard from '../components/MovieCard';
import { Movie } from '../types';
import { getLibrary, searchLibrary, deleteMovie, playMovie, scanLibrary } from '../services/api';

export default function Library() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const loadLibrary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLibrary();
      setMovies(data);
    } catch (err) {
      setError('Failed to load library');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setError('');
    try {
      const results = await searchLibrary(query);
      setMovies(results);
    } catch (err) {
      setError('Failed to search library');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlay = async (movie: Movie) => {
    try {
      await playMovie({ movieId: movie.id });
      alert(`Starting playback for ${movie.title}`);
    } catch (err) {
      alert('Failed to start playback');
      console.error(err);
    }
  };

  const handleDelete = async (movie: Movie) => {
    if (!confirm(`Are you sure you want to delete ${movie.title}?`)) {
      return;
    }

    try {
      await deleteMovie(movie.id);
      setMovies(movies.filter(m => m.id !== movie.id));
    } catch (err) {
      alert('Failed to delete movie');
      console.error(err);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    try {
      const result = await scanLibrary();
      alert(`Scanned library: ${result.count} movies found`);
      await loadLibrary();
    } catch (err) {
      alert('Failed to scan library');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="library-header">
        <h1>My Library</h1>
        <button onClick={handleScan} className="btn-scan" disabled={loading}>
          🔄 Scan Library
        </button>
      </div>

      <SearchBar onSearch={handleSearch} placeholder="Search your library..." />

      {loading && <p className="loading">Loading library...</p>}
      {error && <p className="error">{error}</p>}

      <div className="movies-grid">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onPlay={() => handlePlay(movie)}
            onDelete={() => handleDelete(movie)}
            isLocal={true}
          />
        ))}
      </div>

      {!loading && movies.length === 0 && !error && (
        <p className="empty-state">No movies in your library yet</p>
      )}
    </div>
  );
}
