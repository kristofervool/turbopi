import WebTorrent, { Torrent, TorrentFile } from 'webtorrent';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DownloadProgress, Movie } from '../types/index.js';
import config from '../config.js';
import metadataService from './metadataService.js';
import { spawn } from 'child_process';
import { pipeline } from 'stream';

class TorrentService {
  private client: WebTorrent.Instance;
  private downloads: Map<string, DownloadProgress> = new Map();
  private currentStreamingFile: TorrentFile | null = null;

  constructor() {
    this.client = new WebTorrent();
  }

  async downloadTorrent(
    magnetUri: string,
    movieTitle?: string,
    thumbnail?: string,
    imdbCode?: string,
    rating?: number,
    genres?: string[]
  ): Promise<string> {
    const downloadId = uuidv4();

    return new Promise((resolve, reject) => {
      const torrent = this.client.add(magnetUri, {
        path: config.MOVIES_DIR
      });

      const progress: DownloadProgress = {
        id: downloadId,
        magnetUri,
        title: movieTitle || 'Unknown Movie',
        progress: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        numPeers: 0,
        downloaded: 0,
        total: 0,
        status: 'downloading'
      };

      this.downloads.set(downloadId, progress);

      torrent.on('error', (err) => {
        progress.status = 'error';
        progress.error = err.message;
        console.error('Torrent error:', err);
        reject(err);
      });

      torrent.on('download', () => {
        progress.progress = torrent.progress * 100;
        progress.downloadSpeed = torrent.downloadSpeed;
        progress.uploadSpeed = torrent.uploadSpeed;
        progress.numPeers = torrent.numPeers;
        progress.downloaded = torrent.downloaded;
        progress.total = torrent.length;
      });

      torrent.on('done', async () => {
        progress.status = 'complete';
        progress.progress = 100;

        // Find the video file
        const videoFile = torrent.files.find(f =>
          /\.(mp4|mkv|avi|mov|webm)$/i.test(f.name)
        );

        if (videoFile) {
          const filePath = path.join(config.MOVIES_DIR, videoFile.path);

          // Extract year from title or filename
          const yearMatch = (movieTitle || videoFile.name).match(/\(?(\d{4})\)?/);
          const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

          // Add to metadata
          const movie: Movie = {
            id: uuidv4(),
            title: movieTitle || videoFile.name.replace(/\.(mp4|mkv|avi|mov|webm)$/i, ''),
            year,
            fileName: videoFile.name,
            filePath,
            fileSize: videoFile.length,
            thumbnail,
            imdbCode,
            rating,
            genres,
            addedAt: new Date().toISOString()
          };

          await metadataService.addMovie(movie);
          console.log(`Downloaded and added to library: ${movie.title}`);
        }

        // Keep seeding for a while
        setTimeout(() => {
          torrent.destroy();
          this.downloads.delete(downloadId);
        }, 300000); // Seed for 5 minutes

        resolve(downloadId);
      });
    });
  }

  getDownloadProgress(id: string): DownloadProgress | null {
    return this.downloads.get(id) || null;
  }

  getAllDownloads(): DownloadProgress[] {
    return Array.from(this.downloads.values());
  }

  async streamTorrent(magnetUri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const torrent = this.client.add(magnetUri);

      torrent.on('ready', () => {
        const file = torrent.files.find(f =>
          /\.(mp4|mkv)$/i.test(f.name)
        );

        if (!file) {
          reject(new Error('No playable file found in torrent'));
          return;
        }

        this.currentStreamingFile = file;
        console.log(`Streaming now: ${file.name}`);
        resolve();
      });

      torrent.on('error', (err) => {
        console.error('Torrent error:', err.message);
        reject(err);
      });
    });
  }

  getCurrentStreamingFile(): TorrentFile | null {
    return this.currentStreamingFile;
  }

  setCurrentStreamingFile(file: TorrentFile | null): void {
    this.currentStreamingFile = file;
  }

  createStreamPipeline(
    start: number,
    end: number,
    res: any
  ): void {
    if (!this.currentStreamingFile) {
      throw new Error('No file is currently streaming');
    }

    const fileStream = this.currentStreamingFile.createReadStream({ start, end });
    pipeline(fileStream, res, err => {
      if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        console.error('Stream pipeline error:', err.message);
      }
    });
  }

  spawnVLC(): void {
    spawn('vlc', [
      `http://localhost:${config.PORT}/api/stream`,
      '--fullscreen',
      '--no-video-title-show',
      '--avcodec-hw=none',
      '--aout=alsa',
      '--alsa-audio-device=hw:1,0',
      '--no-dbus',
      '--intf',
      'qt'
    ], {
      stdio: 'inherit',
      env: {
        DISPLAY: config.VLC_DISPLAY,
        XAUTHORITY: config.VLC_XAUTHORITY
      }
    });
  }
}

export default new TorrentService();
