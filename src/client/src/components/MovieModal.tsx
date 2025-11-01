import { useState } from 'react';
import type { YTSMovie, YTSTorrent } from '../types/index.js';

interface MovieModalProps {
  movie: YTSMovie;
  onClose: () => void;
  onPlay: (torrent: YTSTorrent) => void;
  onDownload: (torrent: YTSTorrent) => void;
}

export default function MovieModal({ movie, onClose, onPlay, onDownload }: MovieModalProps) {
  const [selectedTorrent, setSelectedTorrent] = useState<YTSTorrent>(movie.torrents[0]);

  const formatSize = (size: string) => {
    return size;
  };

  const formatQuality = (torrent: YTSTorrent) => {
    return `${torrent.quality} (${torrent.type})`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-body">
          <div className="modal-poster">
            <img src={movie.large_cover_image} alt={movie.title} />
          </div>

          <div className="modal-info">
            <h2>{movie.title} ({movie.year})</h2>

            <div className="movie-meta">
              <span className="rating">⭐ {movie.rating}/10</span>
              {movie.genres && movie.genres.length > 0 && (
                <span className="genres">{movie.genres.join(', ')}</span>
              )}
            </div>

            {movie.summary && (
              <p className="summary">{movie.summary}</p>
            )}

            <div className="torrent-selector">
              <h3>Select Quality</h3>
              <div className="torrent-options">
                {movie.torrents.map((torrent, index) => (
                  <label key={index} className="torrent-option">
                    <input
                      type="radio"
                      name="torrent"
                      value={index}
                      checked={selectedTorrent === torrent}
                      onChange={() => setSelectedTorrent(torrent)}
                    />
                    <div className="torrent-details">
                      <span className="torrent-quality">{formatQuality(torrent)}</span>
                      <span className="torrent-size">{formatSize(torrent.size)}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-play"
                onClick={() => onPlay(selectedTorrent)}
              >
                ▶ Play Now
              </button>
              <button
                className="btn-download"
                onClick={() => onDownload(selectedTorrent)}
              >
                ⬇ Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
