import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Play, Trash2, Tv } from 'lucide-react';
import SearchBar from '../components/SearchBar.tsx';
import type { TVShow, Episode } from '../types/index.js';
import { getShowsLibrary, searchShowsLibrary, deleteEpisode, playEpisode, scanShowsLibrary } from '../services/api.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';

export default function ShowsLibrary() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const loadLibrary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getShowsLibrary();
      setShows(data);
    } catch (err) {
      setError('Failed to load TV shows library');
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
      const results = await searchShowsLibrary(query);
      setShows(results);
    } catch (err) {
      setError('Failed to search library');
      console.error(err);
    }
  };

  const handlePlayEpisode = async (show: TVShow, episode: Episode) => {
    try {
      const title = `${show.title} S${String(episode.seasonNumber).padStart(2, '0')}E${String(episode.episodeNumber).padStart(2, '0')}`;

      await playEpisode({
        episodeId: episode.id,
        title,
        thumbnail: show.thumbnail,
        imdbCode: show.imdbCode
      });

      navigate('/playback');
    } catch (err) {
      alert('Failed to start playback');
      console.error(err);
    }
  };

  const handleDeleteEpisode = async (show: TVShow, episode: Episode) => {
    const episodeLabel = `${show.title} S${String(episode.seasonNumber).padStart(2, '0')}E${String(episode.episodeNumber).padStart(2, '0')}`;

    if (!confirm(`Are you sure you want to delete ${episodeLabel}?`)) {
      return;
    }

    try {
      await deleteEpisode(episode.id);
      await loadLibrary();
    } catch (err) {
      alert('Failed to delete episode');
      console.error(err);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const result = await scanShowsLibrary();
      const totalEpisodes = result.shows.reduce(
        (sum, show) => sum + show.seasons.reduce((s, season) => s + season.episodes.length, 0),
        0
      );
      setScanMessage(`Scanned: ${result.shows.length} shows, ${totalEpisodes} episodes found`);
      await loadLibrary();

      setTimeout(() => setScanMessage(null), 5000);
    } catch (err) {
      setScanMessage('Failed to scan library');
      console.error(err);
      setTimeout(() => setScanMessage(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const totalEpisodes = shows.reduce(
    (sum, show) => sum + show.seasons.reduce((s, season) => s + season.episodes.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">TV Shows Library</h1>
          <p className="text-muted-foreground">
            {shows.length} {shows.length === 1 ? 'show' : 'shows'}, {totalEpisodes} episodes
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

      <SearchBar onSearch={handleSearch} placeholder="Search your TV shows..." />

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

      {!loading && shows.length === 0 && (
        <div className="text-center py-12">
          <Tv className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No TV shows in your library yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Search for shows and download episodes to get started
          </p>
        </div>
      )}

      {!loading && shows.length > 0 && (
        <Accordion type="multiple" className="w-full space-y-4">
          {shows.map((show) => {
            const totalShowEpisodes = show.seasons.reduce((sum, s) => sum + s.episodes.length, 0);

            return (
              <AccordionItem key={show.id} value={show.id} className="border rounded-lg">
                <AccordionTrigger className="hover:no-underline px-4">
                  <div className="flex items-center gap-4">
                    {show.thumbnail && (
                      <img
                        src={show.thumbnail}
                        alt={show.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{show.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {show.seasons.length} {show.seasons.length === 1 ? 'season' : 'seasons'} • {totalShowEpisodes} episodes
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4">
                    <Accordion type="multiple" className="w-full">
                      {show.seasons
                        .sort((a, b) => b.seasonNumber - a.seasonNumber)
                        .map((season) => (
                          <AccordionItem
                            key={`${show.id}-s${season.seasonNumber}`}
                            value={`${show.id}-s${season.seasonNumber}`}
                            className="border-l-2 pl-4"
                          >
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Season {season.seasonNumber}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {season.episodes.length} episodes
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pt-2">
                                {season.episodes
                                  .sort((a, b) => b.episodeNumber - a.episodeNumber)
                                  .map((episode) => (
                                    <Card key={episode.id}>
                                      <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 flex-1">
                                            <Badge>
                                              S{String(episode.seasonNumber).padStart(2, '0')}E
                                              {String(episode.episodeNumber).padStart(2, '0')}
                                            </Badge>
                                            <div className="flex-1">
                                              <p className="font-medium text-sm">
                                                {episode.title || episode.fileName}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {formatFileSize(episode.fileSize)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              onClick={() => handlePlayEpisode(show, episode)}
                                            >
                                              <Play className="h-4 w-4 mr-1" />
                                              Play
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="destructive"
                                              onClick={() => handleDeleteEpisode(show, episode)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
