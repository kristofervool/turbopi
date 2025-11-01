import { Router, Request, Response } from 'express';
import { createReadStream, existsSync, statSync } from 'fs';
import { pipeline } from 'stream';
import torrentService from '../services/torrentService.js';
import libraryService from '../services/libraryService.js';
import vlcService from '../services/vlcService.js';
import metadataService from '../services/metadataService.js';
import subtitleService from '../services/subtitleService.js';
import { spawn } from 'child_process';
import config from '../config.js';

const router = Router();

// Stream endpoint for VLC
router.get('/stream', (req: Request, res: Response): void => {
  const currentFile = torrentService.getCurrentStreamingFile();

  if (!currentFile) {
    console.error('Stream request but no file is set. Current file:', currentFile);
    res.status(404).send('No file is currently streaming');
    return;
  }

  console.log('Streaming file:', currentFile.name, 'Size:', currentFile.length);

  const fileSize = currentFile.length;
  const range = req.headers.range;
  let start = 0;
  let end = fileSize - 1;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    start = parseInt(startStr, 10) || start;
    end = endStr ? parseInt(endStr, 10) : end;

    if (start > end || end >= fileSize) {
      res.status(416).send('Requested Range Not Satisfiable');
      return;
    }

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': 'video/mp4'
    });
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Type': 'video/mp4'
    });
  }

  torrentService.createStreamPipeline(start, end, res);
});

// Stream a local file
router.get('/stream-local/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const filePath = await libraryService.getMoviePath(id);

  if (!filePath || !existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }

  const stats = statSync(filePath);
  const fileSize = stats.size;
  const range = req.headers.range;
  let start = 0;
  let end = fileSize - 1;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    start = parseInt(startStr, 10) || start;
    end = endStr ? parseInt(endStr, 10) : end;

    if (start > end || end >= fileSize) {
      res.status(416).send('Requested Range Not Satisfiable');
      return;
    }

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': 'video/mp4'
    });
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Type': 'video/mp4'
    });
  }

  const fileStream = createReadStream(filePath, { start, end });
  pipeline(fileStream, res, err => {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      console.error('Stream pipeline error:', err.message);
    }
  });
});

// Helper function to get platform-specific VLC configuration
function getVLCConfig() {
  const platform = process.platform;

  if (platform === 'darwin') {
    // macOS
    return {
      path: '/Applications/VLC.app/Contents/MacOS/VLC',
      args: (url: string) => [
        url,
        '--fullscreen',
        '--no-video-title-show',
        '--http-host=0.0.0.0',
        '--http-port=8080',
        '--http-password=turbopi',
        '--extraintf=http'
      ]
    };
  } else {
    // Linux/Raspberry Pi
    return {
      path: 'vlc',
      args: (url: string) => [
        url,
        '--fullscreen',
        '--no-video-title-show',
        '--avcodec-hw=none',
        '--aout=alsa',
        '--alsa-audio-device=hw:1,0',
        '--no-dbus',
        '--http-host=0.0.0.0',
        '--http-port=8080',
        '--http-password=turbopi',
        '--extraintf=http'
      ]
    };
  }
}

// Play a movie (from torrent or local)
router.post('/play', async (req: Request, res: Response): Promise<void> => {
  const { magnetUri, movieId, title, thumbnail, imdbCode } = req.body;

  try {
    if (magnetUri) {
      // Stream from torrent
      console.log('Starting torrent stream for:', magnetUri);
      await torrentService.streamTorrent(magnetUri, title, thumbnail, imdbCode);
      console.log('Torrent ready, spawning VLC...');
      const vlcReady = await torrentService.spawnVLC();

      if (!vlcReady) {
        res.status(500).json({ error: 'VLC HTTP interface failed to start' });
        return;
      }

      res.status(202).json({ message: 'Playback initiated' });
    } else if (movieId) {
      // Play local file - get movie metadata
      const movie = await metadataService.getMovie(movieId);

      if (!movie) {
        res.status(404).json({ error: 'Movie not found' });
        return;
      }

      const vlcConfig = getVLCConfig();
      const streamUrl = `http://localhost:${config.PORT}/api/playback/stream-local/${movieId}`;

      const spawnOptions: any = {
        stdio: 'inherit'
      };

      // Only set display env vars on Linux
      if (process.platform !== 'darwin') {
        spawnOptions.env = {
          ...process.env,
          DISPLAY: config.VLC_DISPLAY,
          XAUTHORITY: config.VLC_XAUTHORITY
        };
      }

      const vlcProcess = spawn(vlcConfig.path, vlcConfig.args(streamUrl), spawnOptions);

      // Register session with VLC service
      vlcService.setSession(vlcProcess, movie.title, movie.thumbnail, movie.imdbCode);

      vlcProcess.on('error', (err) => {
        console.error('Failed to launch VLC:', err.message);
        console.error('Make sure VLC is installed:');
        if (process.platform === 'darwin') {
          console.error('  macOS: Download from https://www.videolan.org/vlc/');
        } else {
          console.error('  Linux: sudo apt install vlc');
        }
        vlcService.clearSession();
      });

      vlcProcess.on('exit', (code) => {
        console.log(`VLC exited with code ${code} (local playback)`);
        vlcService.clearSession();
      });

      // Wait for VLC HTTP interface to be ready
      console.log('Waiting for VLC HTTP interface...');
      const vlcReady = await vlcService.waitForVLC();

      if (!vlcReady) {
        res.status(500).json({ error: 'VLC HTTP interface failed to start' });
        return;
      }

      res.status(202).json({ message: 'Playback initiated' });
    } else {
      res.status(400).json({ error: 'Either magnetUri or movieId is required' });
    }
  } catch (error) {
    console.error('Playback error:', error);
    res.status(500).json({ error: 'Failed to start playback' });
  }
});

// Get current playback status
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = vlcService.getSession();

    if (!session) {
      res.json({ isActive: false });
      return;
    }

    const vlcStatus = await vlcService.getStatus();

    if (!vlcStatus) {
      res.json({ isActive: false });
      return;
    }

    res.json({
      isActive: true,
      isPlaying: vlcStatus.state === 'playing',
      currentTime: vlcStatus.time,
      duration: vlcStatus.length,
      title: session.title,
      thumbnail: session.thumbnail,
      imdbCode: session.imdbCode,
      hasSubtitles: session.loadedSubtitles.length > 0
    });
  } catch (error) {
    console.error('Error getting playback status:', error);
    res.status(500).json({ error: 'Failed to get playback status' });
  }
});

// Pause/resume playback
router.post('/pause', async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await vlcService.pause();

    if (success) {
      res.json({ message: 'Playback toggled' });
    } else {
      res.status(400).json({ error: 'No active playback' });
    }
  } catch (error) {
    console.error('Error toggling pause:', error);
    res.status(500).json({ error: 'Failed to toggle pause' });
  }
});

// Seek to position
router.post('/seek', async (req: Request, res: Response): Promise<void> => {
  const { seconds } = req.body;

  if (typeof seconds !== 'number') {
    res.status(400).json({ error: 'seconds parameter is required' });
    return;
  }

  try {
    const success = await vlcService.seek(seconds);

    if (success) {
      res.json({ message: 'Seeked successfully' });
    } else {
      res.status(400).json({ error: 'No active playback' });
    }
  } catch (error) {
    console.error('Error seeking:', error);
    res.status(500).json({ error: 'Failed to seek' });
  }
});

// Stop playback
router.post('/stop', async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await vlcService.stop();

    // Also cleanup torrent if streaming
    torrentService.cleanupStreamingTorrent();

    if (success) {
      res.json({ message: 'Playback stopped' });
    } else {
      res.status(400).json({ error: 'No active playback' });
    }
  } catch (error) {
    console.error('Error stopping playback:', error);
    res.status(500).json({ error: 'Failed to stop playback' });
  }
});

// Search for subtitles
router.get('/subtitles/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = vlcService.getSession();

    if (!session) {
      res.status(400).json({ error: 'No active playback session' });
      return;
    }

    // Only use IMDB code if available for precise matching, otherwise fall back to title
    const subtitles = await subtitleService.searchSubtitles(
      session.imdbCode,
      session.imdbCode ? undefined : session.title
    );
    res.json(subtitles);
  } catch (error) {
    console.error('Error searching subtitles:', error);
    res.status(500).json({ error: 'Failed to search subtitles' });
  }
});

// Load a subtitle
router.post('/subtitles/load', async (req: Request, res: Response): Promise<void> => {
  const { fileId, fileName } = req.body;

  if (!fileId || !fileName) {
    res.status(400).json({ error: 'fileId and fileName are required' });
    return;
  }

  try {
    const session = vlcService.getSession();

    if (!session) {
      res.status(400).json({ error: 'No active playback session' });
      return;
    }

    // Download subtitle
    const subtitlePath = await subtitleService.downloadSubtitle(fileId, fileName);

    if (!subtitlePath) {
      res.status(500).json({ error: 'Failed to download subtitle' });
      return;
    }

    // Load subtitle into VLC
    const loadSuccess = await vlcService.addSubtitle(subtitlePath);

    if (!loadSuccess) {
      res.status(500).json({ error: 'Failed to load subtitle into VLC' });
      return;
    }

    // Wait a moment for VLC to register the new track
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get current subtitle tracks to find the newly added one
    const tracks = await vlcService.getSubtitleTracks();

    if (tracks.count > 0 && tracks.trackIds.length > 0) {
      // Select the last track (the one we just added) using its actual stream ID
      const lastTrackId = tracks.trackIds[tracks.trackIds.length - 1];
      await vlcService.setSubtitleTrack(lastTrackId);
    }

    res.json({ message: 'Subtitle loaded successfully', path: subtitlePath });
  } catch (error) {
    console.error('Error loading subtitle:', error);
    res.status(500).json({ error: 'Failed to load subtitle' });
  }
});

// Get subtitle tracks
router.get('/subtitles/tracks', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = vlcService.getSession();

    if (!session) {
      res.status(400).json({ error: 'No active playback session' });
      return;
    }

    const trackCount = await vlcService.getSubtitleTracks();
    res.json({ count: trackCount, tracks: session.loadedSubtitles });
  } catch (error) {
    console.error('Error getting subtitle tracks:', error);
    res.status(500).json({ error: 'Failed to get subtitle tracks' });
  }
});

// Select subtitle track
router.post('/subtitles/select', async (req: Request, res: Response): Promise<void> => {
  const { trackId } = req.body;

  if (typeof trackId !== 'number') {
    res.status(400).json({ error: 'trackId is required and must be a number' });
    return;
  }

  try {
    const success = await vlcService.setSubtitleTrack(trackId);

    if (success) {
      res.json({ message: 'Subtitle track selected' });
    } else {
      res.status(400).json({ error: 'No active playback' });
    }
  } catch (error) {
    console.error('Error selecting subtitle track:', error);
    res.status(500).json({ error: 'Failed to select subtitle track' });
  }
});

export default router;
