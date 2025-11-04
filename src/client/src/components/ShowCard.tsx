import { Tv } from 'lucide-react';
import type { TVShow, ShowSearchResult } from '../types/index.js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ShowCardProps {
  show: TVShow | ShowSearchResult;
  onClick?: () => void;
}

export default function ShowCard({ show, onClick }: ShowCardProps) {
  const title = show.title;
  const thumbnail = show.thumbnail;

  // For search results
  const episodeCount = 'episodeCount' in show ? show.episodeCount : undefined;
  const latestSeason = 'latestSeason' in show ? show.latestSeason : undefined;
  const latestEpisode = 'latestEpisode' in show ? show.latestEpisode : undefined;

  // For library items
  const seasons = 'seasons' in show ? show.seasons : undefined;
  const totalEpisodes = seasons?.reduce((sum, season) => sum + season.episodes.length, 0);

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-lg group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tv className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="gap-1">
            <Tv className="h-3 w-3" />
            TV
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>

        {/* Search result info */}
        {episodeCount !== undefined && (
          <p className="text-sm text-muted-foreground mt-1">
            {episodeCount} episodes available
          </p>
        )}
        {latestSeason !== undefined && latestEpisode !== undefined && (
          <p className="text-xs text-muted-foreground">
            Latest: S{String(latestSeason).padStart(2, '0')}E{String(latestEpisode).padStart(2, '0')}
          </p>
        )}

        {/* Library info */}
        {seasons && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              {seasons.length} {seasons.length === 1 ? 'season' : 'seasons'}
            </p>
            {totalEpisodes !== undefined && (
              <p className="text-xs text-muted-foreground">
                {totalEpisodes} episodes downloaded
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
