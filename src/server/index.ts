import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import searchRouter from './routes/search.js';
import libraryRouter from './routes/library.js';
import downloadRouter from './routes/download.js';
import playbackRouter from './routes/playback.js';
import libraryService from './services/libraryService.js';
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

// Serve static files from React build in production
if (config.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'TurboPi API Server' });
  });
}

// Initialize library on startup
(async () => {
  try {
    console.log('Scanning library...');
    await libraryService.scanLibrary();
    console.log('Library scan complete');
  } catch (error) {
    console.error('Error scanning library:', error);
  }
})();

app.listen(config.PORT, config.HOST, () => {
  console.log('\n🎬 TurboPi Server Started');
  console.log('─────────────────────────────────────');
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Movies directory: ${config.MOVIES_DIR}`);
  console.log('\n📡 Access URLs:');
  console.log(`   Local:   http://localhost:${config.PORT}`);

  const localIp = getLocalIpAddress();
  if (localIp) {
    console.log(`   Network: http://${localIp}:${config.PORT}`);
  }

  // Advertise mDNS service
  advertiseMdns(config.PORT);

  console.log(`\n💡 From your phone, open: http://turbopi.local:${config.PORT}`);
  console.log('─────────────────────────────────────\n');
});
