import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import SearchBar from '../components/SearchBar.tsx';
import MovieCard from '../components/MovieCard.tsx';
import MovieModal from '../components/MovieModal.tsx';
import type { YTSMovie, YTSTorrent } from '../types/index.js';
import { searchYTS, downloadTorrent, playMovie } from '../services/api.js';

export default function Search() {
  const navigate = useNavigate();
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

      await playMovie({
        magnetUri,
        title: selectedMovie.title,
        thumbnail: selectedMovie.medium_cover_image,
        imdbCode: selectedMovie.imdb_code
      });

      handleCloseModal();
      // Navigate to playback page
      navigate('/playback');
    } catch (err) {
      alert('Failed to start playback');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Search Movies</h1>
        <p className="text-muted-foreground">
          Search and stream movies instantly from YTS
        </p>
      </div>

      <SearchBar onSearch={handleSearch} placeholder="Search YTS movies..." />

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
            <div key={movie.id} onClick={() => handleMovieClick(movie)} className="cursor-pointer">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      )}

      {!loading && movies.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Search for movies to get started</p>
        </div>
      )}

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          open={!!selectedMovie}
          onClose={handleCloseModal}
          onPlay={handlePlay}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
