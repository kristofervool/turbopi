import { useState, useEffect } from 'react';
import { Subtitles, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { searchSubtitles, loadSubtitle, selectSubtitleTrack } from '../services/api';
import type { Subtitle } from '../types/index';

interface SubtitleSelectorProps {
  hasSubtitles: boolean;
}

export default function SubtitleSelector({ hasSubtitles }: SubtitleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingSubId, setLoadingSubId] = useState<string | null>(null);
  const [loadedSubtitleId, setLoadedSubtitleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search for subtitles when dialog opens
  useEffect(() => {
    if (isOpen && subtitles.length === 0) {
      handleSearch();
    }
  }, [isOpen]);

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);

    try {
      const results = await searchSubtitles();
      setSubtitles(results);

      if (results.length === 0) {
        setError('No English subtitles found for this movie');
      }
    } catch (err) {
      console.error('Failed to search subtitles:', err);
      setError('Failed to search for subtitles. Make sure OpenSubtitles API is configured.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadSubtitle = async (subtitle: Subtitle) => {
    setLoadingSubId(subtitle.id);
    setError(null);

    try {
      // Backend now handles selecting the correct track automatically
      await loadSubtitle(subtitle.fileId, subtitle.fileName);

      setLoadedSubtitleId(subtitle.id);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to load subtitle:', err);
      setError('Failed to load subtitle. Please try again.');
    } finally {
      setLoadingSubId(null);
    }
  };

  const handleDisableSubtitles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await selectSubtitleTrack(-1);
      setLoadedSubtitleId(null);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to disable subtitles:', err);
      setError('Failed to disable subtitles');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="w-14 h-14 md:w-16 md:h-16 rounded-full"
        >
          <Subtitles className={`h-5 w-5 md:h-6 md:w-6 ${hasSubtitles ? 'text-primary' : ''}`} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg md:text-xl">Subtitles</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Select subtitles for this movie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto flex-1">
          {/* Disable subtitles option */}
          {(hasSubtitles || loadedSubtitleId) && (
            <Button
              variant="outline"
              className="w-full justify-between text-sm md:text-base h-9 md:h-10"
              onClick={handleDisableSubtitles}
              disabled={isLoading}
            >
              <span>No Subtitles</span>
              {!loadedSubtitleId && <Check className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
          )}

          {/* Loading state */}
          {isSearching && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-2 md:p-3 rounded-lg bg-destructive/10 text-destructive">
              <X className="h-4 w-4 md:h-5 md:w-5 mt-0.5 flex-shrink-0" />
              <p className="text-xs md:text-sm">{error}</p>
            </div>
          )}

          {/* Subtitle list */}
          {!isSearching && subtitles.length > 0 && (
            <div className="space-y-2">
              {subtitles.map((subtitle) => {
                const isLoaded = loadedSubtitleId === subtitle.id;
                return (
                  <button
                    key={subtitle.id}
                    className={`py-2 px-3 md:py-3 md:px-4 border rounded-lg hover:bg-accent transition-colors text-left w-full ${
                      isLoaded ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => handleLoadSubtitle(subtitle)}
                    disabled={loadingSubId !== null}
                  >
                    {loadingSubId === subtitle.id ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                        <span className="text-xs md:text-sm">Loading...</span>
                      </div>
                    ) : (
                      <>
                        <div
                          className="text-xs md:text-sm font-medium break-words line-clamp-2"
                          title={subtitle.fileName}
                        >
                          {isLoaded && <Check className="h-3 w-3 md:h-4 md:w-4 text-primary inline mr-1 md:mr-2 flex-shrink-0" />}
                          {subtitle.fileName}
                        </div>
                        <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                          {subtitle.downloadCount.toLocaleString()} downloads
                          {subtitle.rating > 0 && ` • ⭐ ${subtitle.rating.toFixed(1)}`}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!isSearching && subtitles.length === 0 && !error && (
            <div className="text-center py-6 md:py-8 text-muted-foreground">
              <p className="text-sm md:text-base">No subtitles available</p>
              <Button
                variant="link"
                onClick={handleSearch}
                className="mt-2 text-xs md:text-sm"
              >
                Try searching again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
