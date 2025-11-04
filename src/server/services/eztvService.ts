import axios from 'axios';
import { EZTVResponse, EZTVTorrent, ShowSearchResult } from '../types/index.js';

const EZTV_API_URL = 'https://eztv.re/api/get-torrents';

class EztvService {
  /**
   * Get all recent torrents (no filter)
   * Useful for discovering available shows
   */
  async getRecentTorrents(limit: number = 50): Promise<EZTVTorrent[]> {
    try {
      const { data } = await axios.get<EZTVResponse>(EZTV_API_URL, {
        params: { limit, page: 1 }
      });
      return data.torrents || [];
    } catch (error) {
      console.error('EZTV API error (recent torrents):', error);
      throw new Error('Failed to fetch recent torrents from EZTV');
    }
  }

  /**
   * Get all torrents for a specific show by IMDB ID
   * @param imdbId - IMDB ID without 'tt' prefix (e.g., '0944947' for Game of Thrones)
   * @param limit - Maximum number of torrents to fetch
   */
  async getTorrentsByImdb(imdbId: string, limit: number = 100): Promise<EZTVTorrent[]> {
    try {
      // Remove 'tt' prefix if present
      const cleanImdbId = imdbId.replace(/^tt/, '');

      const { data } = await axios.get<EZTVResponse>(EZTV_API_URL, {
        params: {
          imdb_id: cleanImdbId,
          limit,
          page: 1
        }
      });

      return data.torrents || [];
    } catch (error) {
      console.error(`EZTV API error (IMDB ${imdbId}):`, error);
      throw new Error(`Failed to fetch torrents for IMDB ${imdbId}`);
    }
  }

  /**
   * Search for shows by extracting unique shows from recent torrents
   * This is a workaround since EZTV doesn't have a dedicated show search endpoint
   * @param query - Search query (show title)
   */
  async searchShows(query: string): Promise<ShowSearchResult[]> {
    try {
      // Get a larger batch of recent torrents to find matches
      const torrents = await this.getRecentTorrents(100);

      // Group torrents by IMDB ID to get unique shows
      const showsMap = new Map<string, ShowSearchResult>();

      torrents.forEach(torrent => {
        const imdbId = torrent.imdb_id;
        const title = this.extractShowTitle(torrent.title);

        // Filter by query if provided
        if (query && !title.toLowerCase().includes(query.toLowerCase())) {
          return;
        }

        if (!showsMap.has(imdbId)) {
          showsMap.set(imdbId, {
            imdbId,
            title,
            thumbnail: torrent.small_screenshot,
            episodeCount: 1,
            latestSeason: torrent.season,
            latestEpisode: torrent.episode
          });
        } else {
          const show = showsMap.get(imdbId)!;
          show.episodeCount++;
          if (torrent.season > show.latestSeason ||
              (torrent.season === show.latestSeason && torrent.episode > show.latestEpisode)) {
            show.latestSeason = torrent.season;
            show.latestEpisode = torrent.episode;
          }
        }
      });

      return Array.from(showsMap.values())
        .sort((a, b) => b.episodeCount - a.episodeCount); // Sort by episode count
    } catch (error) {
      console.error('EZTV search error:', error);
      throw new Error('Failed to search shows');
    }
  }

  /**
   * Extract show title from torrent filename
   * Removes episode info, quality markers, release group, etc.
   */
  private extractShowTitle(filename: string): string {
    // Remove episode patterns (S01E01, 1x01, etc.)
    let title = filename.replace(/[Ss]\d{1,2}[Ee]\d{1,2}/g, '');
    title = title.replace(/\d{1,2}x\d{1,2}/g, '');

    // Remove quality markers
    title = title.replace(/\b(1080p|720p|480p|2160p|4K|WEB|HDTV|BluRay|BRRip|DVDRip|x264|x265|HEVC|H\.?264)\b/gi, '');

    // Remove release group and EZTV tag
    title = title.replace(/\s*-\s*[A-Z0-9]+\s*(EZTV)?$/i, '');

    // Replace dots, underscores with spaces
    title = title.replace(/[._]/g, ' ');

    // Clean up extra spaces
    title = title.trim().replace(/\s+/g, ' ');

    return title;
  }

  /**
   * Group torrents by season and episode
   * Returns a map of S01E01 -> array of torrents with different qualities
   */
  groupTorrentsByEpisode(torrents: EZTVTorrent[]): Map<string, EZTVTorrent[]> {
    const episodesMap = new Map<string, EZTVTorrent[]>();

    torrents.forEach(torrent => {
      const key = `S${String(torrent.season).padStart(2, '0')}E${String(torrent.episode).padStart(2, '0')}`;

      if (!episodesMap.has(key)) {
        episodesMap.set(key, []);
      }

      episodesMap.get(key)!.push(torrent);
    });

    // Sort torrents within each episode by quality preference (1080p > 720p > 480p)
    episodesMap.forEach((torrents, key) => {
      torrents.sort((a, b) => {
        const qualityA = this.getQualityScore(a.title);
        const qualityB = this.getQualityScore(b.title);
        return qualityB - qualityA;
      });
    });

    return episodesMap;
  }

  /**
   * Get quality score for sorting (higher is better)
   */
  private getQualityScore(title: string): number {
    if (title.includes('2160p') || title.includes('4K')) return 4;
    if (title.includes('1080p')) return 3;
    if (title.includes('720p')) return 2;
    if (title.includes('480p')) return 1;
    return 0;
  }

  /**
   * Extract quality and codec information from torrent title
   */
  extractTorrentInfo(title: string): { quality: string; codec: string; size?: string } {
    const qualityMatch = title.match(/(2160p|1080p|720p|480p|4K)/i);
    const codecMatch = title.match(/(x265|x264|HEVC|H\.?264)/i);

    return {
      quality: qualityMatch?.[0] || 'Unknown',
      codec: codecMatch?.[0]?.toUpperCase() || 'Unknown'
    };
  }
}

export default new EztvService();
