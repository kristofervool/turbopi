import { Router, Request, Response } from 'express';
import eztvService from '../services/eztvService.js';
import showMetadataService from '../services/showMetadataService.js';
import showLibraryService from '../services/showLibraryService.js';
import torrentService from '../services/torrentService.js';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import type { TVShow, Episode } from '../types/index.js';

const router = Router();

// Search EZTV for shows (returns recent shows matching query)
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;

  try {
    if (query && typeof query === 'string') {
      // Search with query filter
      const results = await eztvService.searchShows(query);
      res.json(results);
    } else {
      // Return recent shows
      const results = await eztvService.searchShows('');
      res.json(results);
    }
  } catch (error) {
    console.error('Show search error:', error);
    res.status(500).json({ error: 'Failed to search shows' });
  }
});

// Get all torrents for a specific show by IMDB ID
router.get('/torrents/:imdbId', async (req: Request, res: Response): Promise<void> => {
  const { imdbId } = req.params;

  try {
    const torrents = await eztvService.getTorrentsByImdb(imdbId);
    const grouped = eztvService.groupTorrentsByEpisode(torrents);

    // Convert Map to object for JSON serialization
    const result = {
      imdbId,
      totalTorrents: torrents.length,
      episodes: Object.fromEntries(grouped)
    };

    res.json(result);
  } catch (error) {
    console.error(`Error fetching torrents for IMDB ${imdbId}:`, error);
    res.status(500).json({ error: 'Failed to fetch show torrents' });
  }
});

// Get local TV shows library
router.get('/library', async (_req: Request, res: Response): Promise<void> => {
  try {
    const shows = await showMetadataService.getAllShows();
    res.json(shows);
  } catch (error) {
    console.error('Error fetching TV shows library:', error);
    res.status(500).json({ error: 'Failed to fetch TV shows library' });
  }
});

// Search local TV shows library
router.get('/library/search', async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query parameter is required' });
    return;
  }

  try {
    const shows = await showMetadataService.searchShows(query);
    res.json(shows);
  } catch (error) {
    console.error('Error searching TV shows library:', error);
    res.status(500).json({ error: 'Failed to search TV shows library' });
  }
});

// Scan TV shows directory and update metadata
router.post('/library/scan', async (_req: Request, res: Response): Promise<void> => {
  try {
    const shows = await showLibraryService.scanLibrary();
    res.json({ message: 'Library scan completed', shows });
  } catch (error) {
    console.error('Error scanning TV shows library:', error);
    res.status(500).json({ error: 'Failed to scan TV shows library' });
  }
});

// Get specific show by ID
router.get('/library/:showId', async (req: Request, res: Response): Promise<void> => {
  const { showId } = req.params;

  try {
    const show = await showMetadataService.getShow(showId);
    if (!show) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }
    res.json(show);
  } catch (error) {
    console.error(`Error fetching show ${showId}:`, error);
    res.status(500).json({ error: 'Failed to fetch show' });
  }
});

// Delete episode by ID
router.delete('/episode/:episodeId', async (req: Request, res: Response): Promise<void> => {
  const { episodeId } = req.params;

  try {
    const episode = await showMetadataService.getEpisode(episodeId);
    if (!episode) {
      res.status(404).json({ error: 'Episode not found' });
      return;
    }

    // Delete file from disk
    if (existsSync(episode.filePath)) {
      await fs.unlink(episode.filePath);
    }

    // Delete from metadata
    await showMetadataService.deleteEpisode(episodeId);

    res.json({ message: 'Episode deleted successfully' });
  } catch (error) {
    console.error(`Error deleting episode ${episodeId}:`, error);
    res.status(500).json({ error: 'Failed to delete episode' });
  }
});

// Update show metadata (for setting IMDB code, poster, etc.)
router.patch('/library/:showId', async (req: Request, res: Response): Promise<void> => {
  const { showId } = req.params;
  const updates = req.body;

  try {
    await showMetadataService.updateShow(showId, updates);
    const updatedShow = await showMetadataService.getShow(showId);
    res.json(updatedShow);
  } catch (error) {
    console.error(`Error updating show ${showId}:`, error);
    res.status(500).json({ error: 'Failed to update show' });
  }
});

// Download episode
router.post('/download', async (req: Request, res: Response): Promise<void> => {
  const {
    magnetUri,
    showTitle,
    showImdbId,
    seasonNumber,
    episodeNumber,
    episodeTitle,
    thumbnail
  } = req.body;

  if (!magnetUri || !showTitle || !seasonNumber || !episodeNumber) {
    res.status(400).json({
      error: 'magnetUri, showTitle, seasonNumber, and episodeNumber are required'
    });
    return;
  }

  try {
    const downloadId = uuidv4();

    // Use the standard torrentService for the actual download
    // We'll override the destination path to go to TV shows directory
    const downloadPromise = torrentService.downloadTorrent(
      magnetUri,
      `${showTitle} S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`,
      thumbnail,
      showImdbId
    );

    // Wait for download to start (get ID) then respond
    downloadPromise.then(async (torrentDownloadId) => {
      // Monitor download completion to add to show metadata
      const checkInterval = setInterval(async () => {
        const progress = torrentService.getDownloadProgress(torrentDownloadId);

        if (progress && progress.status === 'complete') {
          clearInterval(checkInterval);

          // Move file to show/season directory structure
          // Note: This is a simplified version - in production you'd want more robust file handling
          try {
            // Get or create show
            let show = await showMetadataService.getShowByImdb(showImdbId || '');
            if (!show) {
              const newShow: TVShow = {
                id: uuidv4(),
                title: showTitle,
                imdbCode: showImdbId || '',
                thumbnail,
                seasons: [],
                addedAt: new Date().toISOString()
              };
              await showMetadataService.addShow(newShow);
              show = newShow;
            }

            // Create season directory
            const seasonDir = await showLibraryService.ensureSeasonDirectory(showTitle, seasonNumber);

            // Note: For now, torrentService downloads to MOVIES_DIR
            // A proper implementation would need to move the file to the show/season directory
            // or update torrentService to support custom download paths

            console.log(`Episode downloaded: ${showTitle} S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`);
          } catch (metadataError) {
            console.error('Error adding episode to metadata:', metadataError);
          }
        }
      }, 2000);
    }).catch(err => {
      console.error('Download failed:', err);
    });

    res.status(202).json({
      message: 'Episode download started',
      downloadId
    });
  } catch (error) {
    console.error('Error starting episode download:', error);
    res.status(500).json({ error: 'Failed to start episode download' });
  }
});

export default router;
