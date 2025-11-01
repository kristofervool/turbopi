import { Play, Download, Trash2, Star } from 'lucide-react';
import type { Movie, YTSMovie } from '../types/index.js';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MovieCardProps {
  movie: Movie | YTSMovie;
  onPlay?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  isLocal?: boolean;
}

export default function MovieCard({ movie, onPlay, onDownload, onDelete, isLocal }: MovieCardProps) {
  const title = 'title' in movie ? movie.title : '';
  const year = 'year' in movie ? movie.year : 0;
  const thumbnail = 'thumbnail' in movie ? movie.thumbnail : 'medium_cover_image' in movie ? movie.medium_cover_image : undefined;
  const rating = 'rating' in movie ? movie.rating : undefined;
  const genres = 'genres' in movie ? movie.genres : undefined;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg group">
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {thumbnail && (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        )}
        {rating && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{year}</p>
        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {onPlay && (
          <Button onClick={onPlay} size="sm" className="flex-1">
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
        )}
        {onDownload && (
          <Button onClick={onDownload} variant="secondary" size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        )}
        {onDelete && isLocal && (
          <Button onClick={onDelete} variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
