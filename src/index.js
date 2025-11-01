// src/index.js
import express from 'express';
import axios from 'axios';
import WebTorrent from 'webtorrent';
import { spawn } from 'child_process';
import { pipeline } from 'stream';

const app = express();
app.use(express.json());

const PORT = 3000;
const YTS_API_URL = 'https://yts.mx/api/v2/list_movies.json';

const client = new WebTorrent();
let currentFile = null;

// ————————————————
// 1) STREAM ROUTE (with Range + safe pipeline)
// ————————————————
app.get('/stream', (req, res) => {
  if (!currentFile) {
    return res.status(404).send('No file is currently streaming');
  }

  const fileSize = currentFile.length;
  const range = req.headers.range;
  let start = 0, end = fileSize - 1;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    start = parseInt(startStr, 10) || start;
    end   = endStr ? parseInt(endStr, 10) : end;
    if (start > end || end >= fileSize) {
      return res.status(416).send('Requested Range Not Satisfiable');
    }
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': 'video/mp4',
    });
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Type': 'video/mp4',
    });
  }

  // pipe through Node's pipeline to catch errors instead of crashing
  const fileStream = currentFile.createReadStream({ start, end });
  pipeline(fileStream, res, err => {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      console.error('Stream pipeline error:', err.message);
    }
  });
});

// ————————————————
// 2) SEARCH → MAGNET LINK
// ————————————————
app.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).send('Query parameter is required');
  }

  try {
    const { data } = await axios.get(YTS_API_URL, { params: { query_term: query } });
    const movie = data.data.movies?.[0];
    if (!movie) return res.status(404).send('No movies found');

    const { hash, title } = movie.torrents[0];
    const magnetLink = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}`;
    res.json({ magnetLink });
  } catch (e) {
    console.error('YTS API error:', e.message);
    res.status(500).send('Internal Server Error');
  }
});

// ————————————————
// 3) PLAY: add torrent + spawn cvlc
// ————————————————
app.post('/play', (req, res) => {
  const { magnetUri } = req.body;
  if (!magnetUri) {
    return res.status(400).send('magnetUri is required in body');
  }

  // Always add; WebTorrent will reuse under the hood if already present
  const torrent = client.add(magnetUri, t => {
    const file = t.files.find(f => /\.(mp4|mkv)$/i.test(f.name));
    if (!file) {
      console.error('No playable file found in torrent');
      return;
    }

    currentFile = file;
    console.log(`Streaming now: ${file.name}`);

    spawn('vlc', [
      `http://localhost:${PORT}/stream`,
      '--fullscreen',
      '--no-video-title-show',
      '--avcodec-hw=none',
      '--aout=alsa',                         // use ALSA directly
      '--alsa-audio-device=hw:1,0',          // your Pi’s default card/device
      '--no-dbus',                           // skip D-Bus interface
      '--intf', 
      'qt'           // correct flag to disable hw decoding
    ], {
      stdio: 'inherit',
      env: { 
        DISPLAY: ':0',
        XAUTHORITY: '/home/kristofervool/.Xauthority'             // make sure VLC knows to open on HDMI’s X display
      }
    });
  });

  torrent.on('error', err => {
    console.error('Torrent error:', err.message);
  });

  res.status(202).send('Playback initiated — preparing stream…');
});

app.get('/', (req, res) => {
  res.send('Hello from Express 🚀');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
