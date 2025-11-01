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

app.listen(config.PORT, () => {
  console.log(`Server listening on http://localhost:${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Movies directory: ${config.MOVIES_DIR}`);
});
