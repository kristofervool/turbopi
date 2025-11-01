import { Play, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { PlaybackStatus } from '../types/index.js';

interface PlaybackBarProps {
  status: PlaybackStatus;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onStop: () => void;
}

export default function PlaybackBar({ status, onPause, onSeek, onStop }: PlaybackBarProps) {
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!status.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * status.duration;

    onSeek(Math.floor(newTime));
  };

  const progress = status.duration && status.currentTime
    ? (status.currentTime / status.duration) * 100
    : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-0 bg-card border-t shadow-lg z-40 mb-16 md:mb-0">
      <div className="container max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          {status.thumbnail && (
            <div className="hidden sm:block w-12 h-12 rounded overflow-hidden flex-shrink-0">
              <img
                src={status.thumbnail}
                alt={status.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{status.title || 'Playing...'}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatTime(status.currentTime || 0)} / {formatTime(status.duration || 0)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPause}
              title={status.isPlaying ? 'Pause' : 'Play'}
            >
              {status.isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onStop}
              title="Stop"
              className="text-destructive hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="mt-2 cursor-pointer"
          onClick={handleProgressClick}
          title="Click to seek"
        >
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
    </div>
  );
}
