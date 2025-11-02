import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, X, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayback } from '../hooks/usePlayback';
import SubtitleSelector from '../components/SubtitleSelector';

export default function Playback() {
  const navigate = useNavigate();
  const { status, isInitialLoading, handlePause, handleSeek, handleStop } = usePlayback();

  // If no active playback after initial load, redirect to home
  useEffect(() => {
    if (!isInitialLoading && !status.isActive) {
      navigate('/');
    }
  }, [isInitialLoading, status.isActive, navigate]);

  // Show loading state while checking for active playback
  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!status.isActive) {
    return null;
  }

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

    handleSeek(Math.floor(newTime));
  };

  const skipBackward = () => {
    const newTime = Math.max(0, (status.currentTime || 0) - 10);
    handleSeek(newTime);
  };

  const skipForward = () => {
    const newTime = Math.min(status.duration || 0, (status.currentTime || 0) + 10);
    handleSeek(newTime);
  };

  const handleStopClick = async () => {
    await handleStop();
    navigate('/');
  };

  const progress = status.duration && status.currentTime
    ? (status.currentTime / status.duration) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
        onClick={handleStopClick}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Content Container */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4 md:gap-8 py-4">
        {/* Movie Poster/Thumbnail */}
        {status.thumbnail && (
          <div className="w-full max-w-[200px] md:max-w-md aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
            <img
              src={status.thumbnail}
              alt={status.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Movie Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl md:text-4xl font-bold">{status.title || 'Now Playing'}</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            {status.isPlaying ? 'Playing on TV' : 'Paused'}
          </p>
        </div>

        {/* Progress Section */}
        <div className="w-full space-y-2 md:space-y-4">
          {/* Time Display */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(status.currentTime || 0)}</span>
            <span>{formatTime(status.duration || 0)}</span>
          </div>

          {/* Progress Bar */}
          <div
            className="relative h-3 bg-secondary rounded-full cursor-pointer overflow-hidden group"
            onClick={handleProgressClick}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-secondary" />

            {/* Progress */}
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />

            {/* Hover indicator */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-y-0 bg-primary/30" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Skip Back */}
          <Button
            variant="outline"
            size="lg"
            onClick={skipBackward}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full"
          >
            <SkipBack className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          {/* Play/Pause */}
          <Button
            size="lg"
            onClick={handlePause}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full"
          >
            {status.isPlaying ? (
              <Pause className="h-6 w-6 md:h-8 md:w-8" />
            ) : (
              <Play className="h-6 w-6 md:h-8 md:w-8 ml-1" />
            )}
          </Button>

          {/* Skip Forward */}
          <Button
            variant="outline"
            size="lg"
            onClick={skipForward}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full"
          >
            <SkipForward className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          {/* Subtitle Selector */}
          <SubtitleSelector hasSubtitles={status.hasSubtitles || false} />
        </div>

        {/* Stop Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={handleStopClick}
          className="px-6 md:px-8"
        >
          <X className="h-5 w-5 mr-2" />
          Stop Playback
        </Button>
      </div>
    </div>
  );
}
