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
    res.status(404).send('No file is currently streaming');
    return;
  }

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

// Play a movie (from torrent or local)
router.post('/play', async (req: Request, res: Response): Promise<void> => {
  const { magnetUri, movieId } = req.body;

  try {
    if (magnetUri) {
      // Stream from torrent
      await torrentService.streamTorrent(magnetUri);
      torrentService.spawnVLC();
      res.status(202).json({ message: 'Playback initiated — preparing stream…' });
    } else if (movieId) {
      // Play local file
      const filePath = await libraryService.getMoviePath(movieId);

      if (!filePath) {
        res.status(404).json({ error: 'Movie not found' });
        return;
      }

      spawn('vlc', [
        `http://localhost:${config.PORT}/api/playback/stream-local/${movieId}`,
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
