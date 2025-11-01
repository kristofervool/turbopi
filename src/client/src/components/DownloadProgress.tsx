import type { DownloadProgress as DownloadProgressType } from '../types/index.js';

interface DownloadProgressProps {
  download: DownloadProgressType;
}

export default function DownloadProgress({ download }: DownloadProgressProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec: number): string => {
    return `${formatBytes(bytesPerSec)}/s`;
  };

  return (
    <div className="download-item">
      <div className="download-header">
        <h3>{download.title}</h3>
        <span className={`status status-${download.status}`}>
          {download.status}
        </span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${download.progress}%` }}
        />
      </div>

      <div className="download-stats">
        <span>{download.progress.toFixed(1)}%</span>
        <span>↓ {formatSpeed(download.downloadSpeed)}</span>
        <span>↑ {formatSpeed(download.uploadSpeed)}</span>
        <span>👥 {download.numPeers}</span>
        <span>{formatBytes(download.downloaded)} / {formatBytes(download.total)}</span>
      </div>

      {download.error && (
        <div className="error-message">
          Error: {download.error}
        </div>
      )}
    </div>
  );
}
