import { useState } from 'react';
import { Play, Download, Star, Zap } from 'lucide-react';
import type { YTSMovie, YTSTorrent } from '../types/index.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface MovieModalProps {
  movie: YTSMovie;
  open: boolean;
  onClose: () => void;
  onPlay: (torrent: YTSTorrent) => void;
  onDownload: (torrent: YTSTorrent) => void;
}

export default function MovieModal({ movie, open, onClose, onPlay, onDownload }: MovieModalProps) {
  const [selectedTorrent, setSelectedTorrent] = useState<YTSTorrent>(movie.torrents[0]);

  // Check if torrent uses HEVC (hardware accelerated on Raspberry Pi 5)
  const isHEVC = (torrent: YTSTorrent) => {
    const type = torrent.type.toLowerCase();
    return type.includes('x265') || type.includes('hevc') || type.includes('h265');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Poster */}
          <div className="hidden md:block">
            <img
              src={movie.large_cover_image}
              alt={movie.title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Info */}
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {movie.title} ({movie.year})
              </DialogTitle>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {movie.rating.toFixed(1)}/10
                </Badge>
                {movie.genres &&
                  movie.genres.map(genre => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
              </div>
            </DialogHeader>

            {movie.summary && (
              <DialogDescription className="text-base leading-relaxed">
                {movie.summary}
              </DialogDescription>
            )}

            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Quality</Label>
              <RadioGroup
                value={movie.torrents.indexOf(selectedTorrent).toString()}
                onValueChange={value => setSelectedTorrent(movie.torrents[parseInt(value)])}
              >
                {movie.torrents.map((torrent, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-accent cursor-pointer"
                  >
                    <RadioGroupItem value={index.toString()} id={`torrent-${index}`} />
                    <Label
                      htmlFor={`torrent-${index}`}
                      className="flex-1 cursor-pointer flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {torrent.quality} ({torrent.type})
                        </span>
                        {isHEVC(torrent) && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Zap className="h-3 w-3" />
                            HW Accel
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-sm">{torrent.size}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="default" onClick={() => onPlay(selectedTorrent)} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Play Now
              </Button>
              <Button
                variant="secondary"
                onClick={() => onDownload(selectedTorrent)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
