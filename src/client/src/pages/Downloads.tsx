import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import DownloadProgress from '../components/DownloadProgress.tsx';
import type { DownloadProgress as DownloadProgressType } from '../types/index.js';
import { getAllDownloads } from '../services/api.js';

export default function Downloads() {
  const [downloads, setDownloads] = useState<DownloadProgressType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDownloads = async () => {
    try {
      const data = await getAllDownloads();
      setDownloads(data);
    } catch (err) {
      setError('Failed to load downloads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDownloads();

    // Poll for updates every 2 seconds
    const interval = setInterval(loadDownloads, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          {downloads.length} {downloads.length === 1 ? 'download' : 'downloads'} in progress
        </p>
      </div>

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

      {!loading && downloads.length > 0 && (
        <div className="space-y-4">
          {downloads.map((download) => (
            <DownloadProgress key={download.id} download={download} />
          ))}
        </div>
      )}
    </div>
  );
}
