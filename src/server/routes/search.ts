import { Router, Request, Response } from 'express';
import axios from 'axios';
import { YTSResponse } from '../types/index.js';

const router = Router();
const YTS_API_URL = 'https://yts.mx/api/v2/list_movies.json';

// Search YTS for movies
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query parameter is required' });
    return;
  }

  try {
    const { data } = await axios.get<YTSResponse>(YTS_API_URL, {
      params: { query_term: query }
    });

    if (!data.data.movies || data.data.movies.length === 0) {
      res.status(404).json({ error: 'No movies found' });
      return;
    }

    res.json(data.data.movies);
  } catch (error) {
    console.error('YTS API error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
