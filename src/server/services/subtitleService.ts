// @ts-ignore - No type definitions available for opensubtitles.com
import OpenSubtitles from 'opensubtitles.com';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import axios from 'axios';
import { tmpdir } from 'os';
import { Subtitle } from '../types/index.js';

class SubtitleService {
  private client: OpenSubtitles | null = null;
  private subtitlesDir: string;
  private apiKey: string;
  private userAgent: string;
  private username: string;
  private password: string;
  private isLoggedIn: boolean = false;

  constructor() {
    this.apiKey = process.env.OPENSUBTITLES_API_KEY || '';
    this.userAgent = process.env.OPENSUBTITLES_USER_AGENT || 'TurboPi v1.0';
    this.username = process.env.OPENSUBTITLES_USERNAME || '';
    this.password = process.env.OPENSUBTITLES_PASSWORD || '';
    this.subtitlesDir = join(tmpdir(), 'turbopi-subtitles');

    // Create subtitles directory if it doesn't exist
    if (!existsSync(this.subtitlesDir)) {
      mkdirSync(this.subtitlesDir, { recursive: true });
    }

    // Initialize client if API key is provided
    if (this.apiKey) {
      this.client = new OpenSubtitles({
        apikey: this.apiKey,
        useragent: this.userAgent
      });
    }
  }

  /**
   * Login to OpenSubtitles (required for downloads)
   */
  private async ensureLoggedIn(): Promise<boolean> {
    if (!this.client) {
      console.warn('OpenSubtitles API key not configured');
      return false;
    }

    if (this.isLoggedIn) {
      return true;
    }

    if (!this.username || !this.password) {
      console.warn('OpenSubtitles username/password not configured');
      return false;
    }

    try {
      await this.client.login({
        username: this.username,
        password: this.password
      });
      this.isLoggedIn = true;
      console.log('Successfully logged in to OpenSubtitles');
      return true;
    } catch (error) {
      console.error('Failed to login to OpenSubtitles:', error);
      return false;
    }
  }

  /**
   * Search for English subtitles by IMDB code (preferred) or movie title
   */
  async searchSubtitles(imdbCode?: string, movieTitle?: string): Promise<Subtitle[]> {
    if (!this.client) {
      console.warn('OpenSubtitles API key not configured');
      return [];
    }

    if (!imdbCode && !movieTitle) {
      console.warn('Either IMDB code or movie title is required for subtitle search');
      return [];
    }

    try {
      const searchParams: any = {
        languages: 'en'
      };

      // Prioritize IMDB code for precise matching
      if (imdbCode) {
        // Remove 'tt' prefix if present
        searchParams.imdb_id = imdbCode.replace('tt', '');
        console.log('Searching subtitles by IMDB code:', searchParams.imdb_id);
      } else if (movieTitle) {
        // Only use title query if no IMDB code available
        searchParams.query = movieTitle;
        console.log('Searching subtitles by title:', movieTitle);
      }

      const response = await this.client.subtitles(searchParams);

      if (!response?.data || response.data.length === 0) {
        console.log('No subtitles found');
        return [];
      }

      // Map response to our Subtitle interface
      const subtitles: Subtitle[] = response.data
        .filter((sub: any) => sub.attributes?.language === 'en')
        .map((sub: any) => ({
          id: sub.id,
          language: sub.attributes.language,
          fileName: sub.attributes.files?.[0]?.file_name || 'subtitle.srt',
          downloadCount: sub.attributes.download_count || 0,
          rating: sub.attributes.ratings || 0,
          fileId: sub.attributes.files?.[0]?.file_id
        }))
        .sort((a: Subtitle, b: Subtitle) => b.downloadCount - a.downloadCount)
        .slice(0, 5); // Return top 5 most popular

      console.log(`Found ${subtitles.length} English subtitles`);
      return subtitles;
    } catch (error) {
      console.error('Error searching subtitles:', error);
      return [];
    }
  }

  /**
   * Download subtitle file and return local path
   */
  async downloadSubtitle(fileId: number, fileName: string): Promise<string | null> {
    if (!this.client) {
      console.warn('OpenSubtitles API key not configured');
      return null;
    }

    // Ensure we're logged in before downloading
    const loggedIn = await this.ensureLoggedIn();
    if (!loggedIn) {
      console.error('Cannot download subtitle: not logged in');
      return null;
    }

    try {
      console.log(`Downloading subtitle file ID: ${fileId}`);

      // Request download link
      const downloadResponse = await this.client.download({
        file_id: fileId
      });

      if (!downloadResponse?.link) {
        console.error('No download link received');
        return null;
      }

      // Download the file - ensure .srt extension
      let finalFileName = fileName;
      if (!finalFileName.endsWith('.srt')) {
        finalFileName = finalFileName + '.srt';
      }

      const localPath = join(this.subtitlesDir, finalFileName);
      const response = await axios.get(downloadResponse.link, {
        responseType: 'stream'
      });

      const fileStream = createWriteStream(localPath);
      await pipeline(response.data, fileStream);

      console.log(`Subtitle downloaded to: ${localPath}`);
      return localPath;
    } catch (error) {
      console.error('Error downloading subtitle:', error);
      return null;
    }
  }

  /**
   * Get the subtitles directory path
   */
  getSubtitlesDir(): string {
    return this.subtitlesDir;
  }
}

export default new SubtitleService();
