import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { TVShow, Episode } from '../types/index.js';
import config from '../config.js';
import showMetadataService from './showMetadataService.js';
import { v4 as uuidv4 } from 'uuid';

class ShowLibraryService {
  private showsDir: string;

  constructor() {
    this.showsDir = config.TV_SHOWS_DIR;
  }

  async ensureShowsDirectory(): Promise<void> {
    if (!existsSync(this.showsDir)) {
      await fs.mkdir(this.showsDir, { recursive: true });
    }
  }

  async scanLibrary(): Promise<TVShow[]> {
    await this.ensureShowsDirectory();

    try {
      const showDirs = await fs.readdir(this.showsDir);

      for (const showDir of showDirs) {
        const showPath = path.join(this.showsDir, showDir);
        const stats = await fs.stat(showPath);

        if (!stats.isDirectory()) continue;

        // Scan seasons in this show directory
        await this.scanShow(showDir, showPath);
      }

      return await showMetadataService.getAllShows();
    } catch (error) {
      console.error('Error scanning TV shows library:', error);
      return [];
    }
  }

  private async scanShow(showDirName: string, showPath: string): Promise<void> {
    try {
      const seasonDirs = await fs.readdir(showPath);

      for (const seasonDir of seasonDirs) {
        const seasonPath = path.join(showPath, seasonDir);
        const stats = await fs.stat(seasonPath);

        if (!stats.isDirectory()) continue;

        // Parse season number from directory name (e.g., "Season 1", "Season 01", "S01")
        const seasonNumber = this.extractSeasonNumber(seasonDir);
        if (seasonNumber === null) continue;

        // Scan episodes in this season
        await this.scanSeason(showDirName, seasonPath, seasonNumber);
      }
    } catch (error) {
      console.error(`Error scanning show ${showDirName}:`, error);
    }
  }

  private async scanSeason(showTitle: string, seasonPath: string, seasonNumber: number): Promise<void> {
    try {
      const files = await fs.readdir(seasonPath);
      const videoFiles = files.filter(file =>
        /\.(mp4|mkv|avi|mov|webm)$/i.test(file)
      );

      for (const file of videoFiles) {
        const filePath = path.join(seasonPath, file);

        // Check if episode already exists in metadata
        const allShows = await showMetadataService.getAllShows();
        let showInMetadata: TVShow | undefined;

        for (const show of allShows) {
          for (const season of show.seasons) {
            if (season.episodes.some(e => e.filePath === filePath)) {
              return; // Episode already exists
            }
          }
          if (show.title === showTitle) {
            showInMetadata = show;
          }
        }

        // Extract episode info
        const episodeNumber = this.extractEpisodeNumber(file);
        if (episodeNumber === null) continue;

        const stats = await fs.stat(filePath);

        const episode: Episode = {
          id: uuidv4(),
          showId: showInMetadata?.id || uuidv4(),
          episodeNumber,
          seasonNumber,
          title: this.extractEpisodeTitle(file),
          fileName: file,
          filePath,
          fileSize: stats.size,
          addedAt: new Date().toISOString()
        };

        // Create show if it doesn't exist
        if (!showInMetadata) {
          const newShow: TVShow = {
            id: episode.showId,
            title: showTitle,
            imdbCode: '', // Will be updated when user searches/identifies
            seasons: [],
            addedAt: new Date().toISOString()
          };
          await showMetadataService.addShow(newShow);
          showInMetadata = newShow;
        }

        // Add episode to show
        await showMetadataService.addEpisode(showInMetadata.id, episode);
      }
    } catch (error) {
      console.error(`Error scanning season ${seasonNumber} of ${showTitle}:`, error);
    }
  }

  private extractSeasonNumber(dirName: string): number | null {
    // Match "Season 1", "Season 01", "S01", "s1", etc.
    const match = dirName.match(/[Ss](?:eason)?\s*(\d{1,2})/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  private extractEpisodeNumber(filename: string): number | null {
    // Match patterns like S01E01, s01e01, 1x01, etc.
    const patterns = [
      /[Ss]\d{1,2}[Ee](\d{1,2})/,  // S01E01
      /\d{1,2}x(\d{1,2})/i          // 1x01
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return null;
  }

  private extractEpisodeTitle(filename: string): string {
    // Remove extension
    let title = filename.replace(/\.(mp4|mkv|avi|mov|webm)$/i, '');

    // Remove episode pattern
    title = title.replace(/[Ss]\d{1,2}[Ee]\d{1,2}/g, '');
    title = title.replace(/\d{1,2}x\d{1,2}/gi, '');

    // Remove quality indicators
    title = title.replace(/\.(1080p|720p|480p|4k|2160p|HDTV|WEB|BluRay|BRRip|DVDRip|x264|x265|HEVC|H\.?264)/gi, '');

    // Remove release group
    title = title.replace(/-[A-Z0-9]+$/i, '');

    // Replace dots and underscores with spaces
    title = title.replace(/[._]/g, ' ');

    // Trim extra spaces
    title = title.trim().replace(/\s+/g, ' ');

    return title || 'Episode';
  }

  async getEpisodePath(episodeId: string): Promise<string | null> {
    const episode = await showMetadataService.getEpisode(episodeId);
    if (!episode || !existsSync(episode.filePath)) {
      return null;
    }
    return episode.filePath;
  }

  async getShowDirectory(showTitle: string): Promise<string> {
    // Sanitize show title for directory name
    const sanitized = showTitle.replace(/[<>:"/\\|?*]/g, '').trim();
    return path.join(this.showsDir, sanitized);
  }

  async getSeasonDirectory(showTitle: string, seasonNumber: number): Promise<string> {
    const showDir = await this.getShowDirectory(showTitle);
    return path.join(showDir, `Season ${String(seasonNumber).padStart(2, '0')}`);
  }

  async ensureSeasonDirectory(showTitle: string, seasonNumber: number): Promise<string> {
    const seasonDir = await this.getSeasonDirectory(showTitle, seasonNumber);
    if (!existsSync(seasonDir)) {
      await fs.mkdir(seasonDir, { recursive: true });
    }
    return seasonDir;
  }
}

export default new ShowLibraryService();
