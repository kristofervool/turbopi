import axios from 'axios';

const OMDB_API_URL = 'https://www.omdbapi.com/';
const API_KEY = process.env.OMDB_API_KEY;

interface OMDBSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

interface OMDBSearchResponse {
  Search?: OMDBSearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

export interface TVShowSearchResult {
  title: string;
  year: string;
  imdbId: string;
  poster: string;
}

class OmdbService {
  /**
   * Search for TV shows by title
   * @param query - Search query (show title)
   * @returns Array of TV show search results
   */
  async searchTVShows(query: string): Promise<TVShowSearchResult[]> {
    if (!API_KEY) {
      console.warn('OMDB API key not configured. Please set OMDB_API_KEY in .env file.');
      return [];
    }

    try {
      const { data } = await axios.get<OMDBSearchResponse>(OMDB_API_URL, {
        params: {
          apikey: API_KEY,
          s: query,
          type: 'series'
        }
      });

      if (data.Response === 'False') {
        console.log(`OMDB search for "${query}": ${data.Error || 'No results'}`);
        return [];
      }

      if (!data.Search) {
        return [];
      }

      // Convert OMDB results to our format
      return data.Search.map(result => ({
        title: result.Title,
        year: result.Year,
        imdbId: result.imdbID.replace(/^tt/, ''), // Remove 'tt' prefix
        poster: result.Poster !== 'N/A' ? result.Poster : ''
      }));
    } catch (error) {
      console.error('OMDB API error:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a TV show by IMDB ID
   * @param imdbId - IMDB ID (with or without 'tt' prefix)
   * @returns TV show details or null if not found
   */
  async getShowDetails(imdbId: string): Promise<TVShowSearchResult | null> {
    if (!API_KEY) {
      return null;
    }

    try {
      // Ensure imdbId has 'tt' prefix for OMDB
      const fullImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;

      const { data } = await axios.get(OMDB_API_URL, {
        params: {
          apikey: API_KEY,
          i: fullImdbId,
          type: 'series'
        }
      });

      if (data.Response === 'False') {
        return null;
      }

      return {
        title: data.Title,
        year: data.Year,
        imdbId: data.imdbID.replace(/^tt/, ''),
        poster: data.Poster !== 'N/A' ? data.Poster : ''
      };
    } catch (error) {
      console.error('OMDB API error:', error);
      return null;
    }
  }
}

export default new OmdbService();
