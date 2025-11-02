import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import SearchBar from '../components/SearchBar.tsx';
import MovieCard from '../components/MovieCard.tsx';
import type { Movie } from '../types/index.js';
import { getLibrary, searchLibrary, deleteMovie, playMovie, scanLibrary } from '../services/api.js';
import { Button } from '@/components/ui/button';

export default function Library() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

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
    setError('');
    try {
      const results = await searchLibrary(query);
      setMovies(results);
    } catch (err) {
      setError('Failed to search library');
      console.error(err);
    }
  };

  const handlePlay = async (movie: Movie) => {
    try {
      await playMovie({ movieId: movie.id });
      // Navigate to playback page
      navigate('/playback');
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
    setIsScanning(true);
    setScanMessage(null);
    try {
      const result = await scanLibrary();
      setScanMessage(`Scanned: ${result.count} ${result.count === 1 ? 'movie' : 'movies'} found`);
      await loadLibrary();

      // Clear message after 5 seconds
      setTimeout(() => setScanMessage(null), 5000);
    } catch (err) {
      setScanMessage('Failed to scan library');
      console.error(err);

      // Clear error message after 5 seconds
      setTimeout(() => setScanMessage(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground">
            {movies.length} {movies.length === 1 ? 'movie' : 'movies'} in your collection
          </p>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <Button onClick={handleScan} disabled={isScanning} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            Scan Library
          </Button>
          {scanMessage && (
            <p className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md whitespace-nowrap">
              {scanMessage}
            </p>
          )}
        </div>
      </div>

      <SearchBar onSearch={handleSearch} placeholder="Search your library..." />

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!loading && movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
      )}
    </div>
  );
}
