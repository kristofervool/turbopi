import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import searchRouter from './routes/search.js';
import libraryRouter from './routes/library.js';
import downloadRouter from './routes/download.js';
import playbackRouter from './routes/playback.js';
import showsRouter from './routes/shows.js';
import libraryService from './services/libraryService.js';
import showLibraryService from './services/showLibraryService.js';
import { getLocalIpAddress } from './utils/network.js';
import { advertiseMdns } from './utils/mdns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/search', searchRouter);
app.use('/api/library', libraryRouter);
app.use('/api/download', downloadRouter);
app.use('/api/playback', playbackRouter);
app.use('/api/shows', showsRouter);

// Serve static files from React build
// In dev mode: __dirname is src/server, client build is at src/client/dist
// In production: __dirname is dist/server, client build is at src/client/dist
const clientBuildPath = config.NODE_ENV === 'production'
  ? path.join(__dirname, '../../src/client/dist')
  : path.join(__dirname, '../client/dist');

app.use(express.static(clientBuildPath));

// Handle client-side routing - serve index.html for all non-API routes
// This must be after all other routes so API routes are matched first
app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Initialize library on startup
(async () => {
  try {
    console.log('Scanning movie library...');
    await libraryService.scanLibrary();
    console.log('Movie library scan complete');

    console.log('Scanning TV shows library...');
    await showLibraryService.scanLibrary();
    console.log('TV shows library scan complete');
  } catch (error) {
    console.error('Error scanning library:', error);
  }
})();

app.listen(config.PORT, config.HOST, () => {
  console.log('\n🎬 TurboPi Server Started');
  console.log('─────────────────────────────────────');
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Movies directory: ${config.MOVIES_DIR}`);
  console.log(`TV Shows directory: ${config.TV_SHOWS_DIR}`);
  console.log('\n📡 Access URLs:');
  console.log(`   Local:   http://localhost:${config.PORT}`);

  const localIp = getLocalIpAddress();
  if (localIp) {
    console.log(`   Network: http://${localIp}:${config.PORT}`);
  }

  // Advertise mDNS service (will log its own status)
  advertiseMdns(config.PORT);

  console.log('\n💡 Tip: From your phone, use the mDNS URL or Network IP above');
  console.log('─────────────────────────────────────\n');
});
