import { Router, Request, Response } from 'express';
import torrentService from '../services/torrentService.js';

const router = Router();

// Download a torrent
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { magnetUri, title, thumbnail, imdbCode, rating, genres } = req.body;

  if (!magnetUri) {
    res.status(400).json({ error: 'magnetUri is required in body' });
    return;
  }

  try {
    const downloadId = await torrentService.downloadTorrent(
      magnetUri,
      title,
      thumbnail,
      imdbCode,
      rating,
      genres
    );

    res.status(202).json({
      message: 'Download started',
      downloadId
    });
  } catch (error) {
    console.error('Error starting download:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
});

// Get download status
router.get('/status/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const progress = torrentService.getDownloadProgress(id);

  if (!progress) {
    res.status(404).json({ error: 'Download not found' });
    return;
  }

  res.json(progress);
});

// Get all downloads
router.get('/all', (req: Request, res: Response): void => {
  const downloads = torrentService.getAllDownloads();
  res.json(downloads);
});

export default router;
