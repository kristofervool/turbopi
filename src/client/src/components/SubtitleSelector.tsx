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
          className="w-16 h-16 rounded-full"
        >
          <Subtitles className={`h-6 w-6 ${hasSubtitles ? 'text-primary' : ''}`} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Subtitles</DialogTitle>
          <DialogDescription>
            Select subtitles for this movie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Disable subtitles option */}
          {(hasSubtitles || loadedSubtitleId) && (
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={handleDisableSubtitles}
              disabled={isLoading}
            >
              <span>No Subtitles</span>
              {!loadedSubtitleId && <Check className="h-4 w-4" />}
            </Button>
          )}

          {/* Loading state */}
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <X className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Subtitle list */}
          {!isSearching && subtitles.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {subtitles.map((subtitle) => {
                const isLoaded = loadedSubtitleId === subtitle.id;
                return (
                  <button
                    key={subtitle.id}
                    className={`py-3 px-4 border rounded-lg hover:bg-accent transition-colors text-left ${
                      isLoaded ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => handleLoadSubtitle(subtitle)}
                    disabled={loadingSubId !== null}
                    style={{ display: 'block', width: '100%', maxWidth: '100%' }}
                  >
                    {loadingSubId === subtitle.id ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <>
                        <div
                          className="font-medium"
                          title={subtitle.fileName}
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isLoaded && <Check className="h-4 w-4 text-primary inline mr-2" />}
                          {subtitle.fileName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
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
            <div className="text-center py-8 text-muted-foreground">
              <p>No subtitles available</p>
              <Button
                variant="link"
                onClick={handleSearch}
                className="mt-2"
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
