import { Router, Request, Response } from 'express';
import { createReadStream, existsSync, statSync } from 'fs';
import { pipeline } from 'stream';
import torrentService from '../services/torrentService.js';
import libraryService from '../services/libraryService.js';
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
      args: (url: string) => [url, '--fullscreen', '--no-video-title-show']
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
        '--intf',
        'qt'
      ]
    };
  }
}

// Play a movie (from torrent or local)
router.post('/play', async (req: Request, res: Response): Promise<void> => {
  const { magnetUri, movieId } = req.body;

  try {
    if (magnetUri) {
      // Stream from torrent
      console.log('Starting torrent stream for:', magnetUri);
      await torrentService.streamTorrent(magnetUri);
      console.log('Torrent ready, spawning VLC...');
      torrentService.spawnVLC();
      res.status(202).json({ message: 'Playback initiated — preparing stream…' });
    } else if (movieId) {
      // Play local file
      const filePath = await libraryService.getMoviePath(movieId);

      if (!filePath) {
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

      vlcProcess.on('error', (err) => {
        console.error('Failed to launch VLC:', err.message);
        console.error('Make sure VLC is installed:');
        if (process.platform === 'darwin') {
          console.error('  macOS: Download from https://www.videolan.org/vlc/');
        } else {
          console.error('  Linux: sudo apt install vlc');
        }
      });

      res.status(202).json({ message: 'Playback initiated' });
    } else {
      res.status(400).json({ error: 'Either magnetUri or movieId is required' });
    }
  } catch (error) {
    console.error('Playback error:', error);
    res.status(500).json({ error: 'Failed to start playback' });
  }
});

export default router;
