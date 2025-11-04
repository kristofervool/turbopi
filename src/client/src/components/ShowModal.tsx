import { useState, useEffect } from 'react';
import { Download, Play, Loader2, HardDrive, Users } from 'lucide-react';
import type { ShowSearchResult, EZTVTorrent } from '../types/index.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getShowTorrents } from '../services/api.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ShowModalProps {
  show: ShowSearchResult;
  open: boolean;
  onClose: () => void;
  onDownload: (torrent: EZTVTorrent, seasonNumber: number, episodeNumber: number) => void;
  onPlay: (torrent: EZTVTorrent, seasonNumber: number, episodeNumber: number) => void;
}

export default function ShowModal({ show, open, onClose, onDownload, onPlay }: ShowModalProps) {
  const [loading, setLoading] = useState(false);
  const [episodes, setEpisodes] = useState<Record<string, EZTVTorrent[]>>({});
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);

  useEffect(() => {
    if (open && show.imdbId) {
      loadEpisodes();
    }
  }, [open, show.imdbId]);

  const loadEpisodes = async () => {
    setLoading(true);
    try {
      const data = await getShowTorrents(show.imdbId);
      setEpisodes(data.episodes);
    } catch (error) {
      console.error('Failed to load episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupBySeason = () => {
    const seasons = new Map<number, Map<number, EZTVTorrent[]>>();

    Object.entries(episodes).forEach(([, torrents]) => {
      if (torrents.length === 0) return;
      const season = torrents[0].season;
      const episode = torrents[0].episode;

      if (!seasons.has(season)) {
        seasons.set(season, new Map());
      }
      seasons.get(season)!.set(episode, torrents);
    });

    return seasons;
  };

  const extractQuality = (title: string): string => {
    const match = title.match(/(2160p|1080p|720p|480p|4K)/i);
    return match ? match[0] : 'Unknown';
  };

  const extractCodec = (title: string): string => {
    const match = title.match(/(x265|x264|HEVC|H\.?264)/i);
    return match ? match[0].toUpperCase() : '';
  };

  const formatFileSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const seasons = groupBySeason();
  const sortedSeasons = Array.from(seasons.keys()).sort((a, b) => b - a); // Latest season first

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {show.thumbnail && (
              <img
                src={show.thumbnail}
                alt={show.title}
                className="w-24 h-36 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <DialogTitle className="text-2xl">{show.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {show.episodeCount} episodes available
              </p>
            </div>
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && sortedSeasons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No episodes found</p>
          </div>
        )}

        {!loading && sortedSeasons.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            {sortedSeasons.map((seasonNum) => {
              const seasonEpisodes = seasons.get(seasonNum)!;
              const episodeNumbers = Array.from(seasonEpisodes.keys()).sort((a, b) => b - a);

              return (
                <AccordionItem key={seasonNum} value={`season-${seasonNum}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Season {seasonNum}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {episodeNumbers.length} episodes
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {episodeNumbers.map((episodeNum) => {
                        const torrents = seasonEpisodes.get(episodeNum)!;
                        const episodeKey = `S${String(seasonNum).padStart(2, '0')}E${String(episodeNum).padStart(2, '0')}`;
                        const isExpanded = selectedEpisode === episodeKey;

                        return (
                          <div key={episodeKey} className="border rounded-lg p-3">
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => setSelectedEpisode(isExpanded ? null : episodeKey)}
                            >
                              <div className="flex items-center gap-2">
                                <Badge>{episodeKey}</Badge>
                                <span className="text-sm font-medium">
                                  {torrents.length} quality options
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEpisode(isExpanded ? null : episodeKey);
                                }}
                              >
                                {isExpanded ? 'Hide' : 'Show'} qualities
                              </Button>
                            </div>

                            {isExpanded && (
                              <div className="mt-3 space-y-2">
                                {torrents.map((torrent, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-muted rounded hover:bg-muted/80"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="flex gap-2">
                                        <Badge variant="secondary">
                                          {extractQuality(torrent.title)}
                                        </Badge>
                                        {extractCodec(torrent.title) && (
                                          <Badge variant="outline">
                                            {extractCodec(torrent.title)}
                                          </Badge>
                                        )}
                                        {torrent.title.includes('HEVC') && (
                                          <Badge variant="default" className="bg-green-600">
                                            HW Accel
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <HardDrive className="h-3 w-3" />
                                          {formatFileSize(torrent.size_bytes)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          {torrent.seeds}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onPlay(torrent, seasonNum, episodeNum)}
                                      >
                                        <Play className="h-4 w-4 mr-1" />
                                        Play
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => onDownload(torrent, seasonNum, episodeNum)}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
}
