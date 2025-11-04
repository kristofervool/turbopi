import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import SearchBar from '../components/SearchBar.tsx';
import ShowCard from '../components/ShowCard.tsx';
import ShowModal from '../components/ShowModal.tsx';
import type { ShowSearchResult, EZTVTorrent } from '../types/index.js';
import { searchShows, downloadEpisode, playEpisode } from '../services/api.js';

export default function ShowsSearch() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<ShowSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedShow, setSelectedShow] = useState<ShowSearchResult | null>(null);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const results = await searchShows(query);
      setShows(results);
      if (results.length === 0) {
        setError('No TV shows found with available episodes on EZTV');
      }
    } catch (err) {
      setError('Failed to search TV shows. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowClick = (show: ShowSearchResult) => {
    setSelectedShow(show);
  };

  const handleCloseModal = () => {
    setSelectedShow(null);
  };

  const handleDownload = async (
    torrent: EZTVTorrent,
    seasonNumber: number,
    episodeNumber: number
  ) => {
    if (!selectedShow) return;

    try {
      await downloadEpisode({
        magnetUri: torrent.magnet_url,
        showTitle: selectedShow.title,
        showImdbId: selectedShow.imdbId,
        seasonNumber,
        episodeNumber,
        thumbnail: selectedShow.thumbnail
      });

      alert(
        `Download started for ${selectedShow.title} S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`
      );
      handleCloseModal();
    } catch (err) {
      alert('Failed to start download');
      console.error(err);
    }
  };

  const handlePlay = async (
    torrent: EZTVTorrent,
    seasonNumber: number,
    episodeNumber: number
  ) => {
    if (!selectedShow) return;

    try {
      const title = `${selectedShow.title} S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`;

      await playEpisode({
        magnetUri: torrent.magnet_url,
        title,
        thumbnail: selectedShow.thumbnail,
        imdbCode: selectedShow.imdbId
      });

      handleCloseModal();
      navigate('/playback');
    } catch (err) {
      alert('Failed to start playback');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search TV Shows</h1>
        <p className="text-muted-foreground">
          Search for TV shows by title (e.g., "Breaking Bad", "Game of Thrones")
        </p>
      </div>

      <SearchBar onSearch={handleSearch} placeholder="Search TV shows..." />

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

      {!loading && shows.length > 0 && (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Found {shows.length} {shows.length === 1 ? 'show' : 'shows'}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {shows.map((show) => (
              <ShowCard key={show.imdbId} show={show} onClick={() => handleShowClick(show)} />
            ))}
          </div>
        </>
      )}

      {selectedShow && (
        <ShowModal
          show={selectedShow}
          open={!!selectedShow}
          onClose={handleCloseModal}
          onPlay={handlePlay}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
