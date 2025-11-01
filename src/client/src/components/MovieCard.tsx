import { Movie, YTSMovie } from '../types';

interface MovieCardProps {
  movie: Movie | YTSMovie;
  onPlay?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  isLocal?: boolean;
}

export default function MovieCard({ movie, onPlay, onDownload, onDelete, isLocal }: MovieCardProps) {
  const title = 'title' in movie ? movie.title : '';
  const year = 'year' in movie ? movie.year : 0;
  const thumbnail = 'thumbnail' in movie ? movie.thumbnail : 'medium_cover_image' in movie ? movie.medium_cover_image : undefined;
  const rating = 'rating' in movie ? movie.rating : undefined;
  const genres = 'genres' in movie ? movie.genres : undefined;

  return (
    <div className="movie-card">
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title}
          className="movie-poster"
        />
      )}
      <div className="movie-info">
        <h3>{title}</h3>
        <p className="year">{year}</p>
        {rating && <p className="rating">⭐ {rating}/10</p>}
        {genres && (
          <p className="genres">{genres.slice(0, 3).join(', ')}</p>
        )}
        <div className="actions">
          {onPlay && (
            <button onClick={onPlay} className="btn-play">
              ▶ Play
            </button>
          )}
          {onDownload && (
            <button onClick={onDownload} className="btn-download">
              ⬇ Download
            </button>
          )}
          {onDelete && isLocal && (
            <button onClick={onDelete} className="btn-delete">
              🗑 Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
