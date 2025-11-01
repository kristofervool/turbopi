import { Router, Request, Response } from 'express';
import metadataService from '../services/metadataService.js';
import libraryService from '../services/libraryService.js';

const router = Router();

// Get all movies in library
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const movies = await metadataService.getAllMovies();
    res.json(movies);
  } catch (error) {
    console.error('Error getting library:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Search library
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query parameter is required' });
    return;
  }

  try {
    const movies = await metadataService.searchMovies(query);
    res.json(movies);
  } catch (error) {
    console.error('Error searching library:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Scan library for new files
router.post('/scan', async (req: Request, res: Response): Promise<void> => {
  try {
    const movies = await libraryService.scanLibrary();
    res.json({ message: 'Library scan complete', count: movies.length, movies });
  } catch (error) {
    console.error('Error scanning library:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a movie
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const deleted = await metadataService.deleteMovie(id);
    if (!deleted) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
