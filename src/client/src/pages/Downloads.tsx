import { useState, useEffect } from 'react';
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
    <div className="page">
      <h1>Active Downloads</h1>

      {loading && <p className="loading">Loading downloads...</p>}
      {error && <p className="error">{error}</p>}

      <div className="downloads-list">
        {downloads.map((download) => (
          <DownloadProgress key={download.id} download={download} />
        ))}
      </div>

      {!loading && downloads.length === 0 && !error && (
        <p className="empty-state">No active downloads</p>
      )}
    </div>
  );
}
