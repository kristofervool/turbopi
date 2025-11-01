import { useState, useEffect, useCallback } from 'react';
import { getPlaybackStatus, togglePause, seekPlayback, stopPlayback } from '../services/api.js';
import type { PlaybackStatus } from '../types/index.js';

export function usePlayback() {
  const [status, setStatus] = useState<PlaybackStatus>({ isActive: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const newStatus = await getPlaybackStatus();
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to fetch playback status:', error);
      // If we get an error, assume playback is not active
      setStatus({ isActive: false });
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds if playback is active
    const interval = setInterval(() => {
      if (status.isActive) {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [status.isActive, fetchStatus]);

  const handlePause = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await togglePause();
      // Immediately fetch new status
      await fetchStatus();
    } catch (error) {
      console.error('Failed to toggle pause:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeek = async (seconds: number) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await seekPlayback(seconds);
      // Immediately fetch new status
      await fetchStatus();
    } catch (error) {
      console.error('Failed to seek:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await stopPlayback();
      // Clear status immediately
      setStatus({ isActive: false });
    } catch (error) {
      console.error('Failed to stop playback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    isLoading,
    isInitialLoading,
    handlePause,
    handleSeek,
    handleStop,
    refresh: fetchStatus
  };
}
