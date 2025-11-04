import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { TVShow, ShowMetadata, Episode, Season } from '../types/index.js';
import config from '../config.js';

class ShowMetadataService {
  private metadataFile: string;
  private showsDir: string;

  constructor() {
    this.metadataFile = config.SHOWS_METADATA_FILE;
    this.showsDir = config.TV_SHOWS_DIR;
  }

  private async ensureMetadataFile(): Promise<void> {
    const dir = path.dirname(this.metadataFile);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }

    if (!existsSync(this.metadataFile)) {
      const initialData: ShowMetadata = { shows: [] };
      await fs.writeFile(this.metadataFile, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  private async readMetadata(): Promise<ShowMetadata> {
    await this.ensureMetadataFile();
    const data = await fs.readFile(this.metadataFile, 'utf-8');
    return JSON.parse(data) as ShowMetadata;
  }

  private async writeMetadata(metadata: ShowMetadata): Promise<void> {
    await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  async getAllShows(): Promise<TVShow[]> {
    const metadata = await this.readMetadata();
    return metadata.shows;
  }

  async getShow(showId: string): Promise<TVShow | undefined> {
    const metadata = await this.readMetadata();
    return metadata.shows.find(show => show.id === showId);
  }

  async getShowByImdb(imdbCode: string): Promise<TVShow | undefined> {
    const metadata = await this.readMetadata();
    return metadata.shows.find(show => show.imdbCode === imdbCode);
  }

  async addShow(show: TVShow): Promise<void> {
    const metadata = await this.readMetadata();
    metadata.shows.push(show);
    await this.writeMetadata(metadata);
  }

  async updateShow(showId: string, updates: Partial<TVShow>): Promise<void> {
    const metadata = await this.readMetadata();
    const index = metadata.shows.findIndex(show => show.id === showId);

    if (index !== -1) {
      metadata.shows[index] = { ...metadata.shows[index], ...updates };
      await this.writeMetadata(metadata);
    }
  }

  async deleteShow(showId: string): Promise<void> {
    const metadata = await this.readMetadata();
    metadata.shows = metadata.shows.filter(show => show.id !== showId);
    await this.writeMetadata(metadata);
  }

  async addEpisode(showId: string, episode: Episode): Promise<void> {
    const metadata = await this.readMetadata();
    const show = metadata.shows.find(s => s.id === showId);

    if (!show) {
      throw new Error(`Show with ID ${showId} not found`);
    }

    // Find or create season
    let season = show.seasons.find(s => s.seasonNumber === episode.seasonNumber);
    if (!season) {
      season = { seasonNumber: episode.seasonNumber, episodes: [] };
      show.seasons.push(season);
      // Sort seasons
      show.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
    }

    // Add episode if not already present
    const existingEpisode = season.episodes.find(e => e.id === episode.id);
    if (!existingEpisode) {
      season.episodes.push(episode);
      // Sort episodes
      season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    }

    await this.writeMetadata(metadata);
  }

  async getEpisode(episodeId: string): Promise<Episode | undefined> {
    const metadata = await this.readMetadata();

    for (const show of metadata.shows) {
      for (const season of show.seasons) {
        const episode = season.episodes.find(e => e.id === episodeId);
        if (episode) {
          return episode;
        }
      }
    }

    return undefined;
  }

  async deleteEpisode(episodeId: string): Promise<void> {
    const metadata = await this.readMetadata();

    for (const show of metadata.shows) {
      for (const season of show.seasons) {
        const episodeIndex = season.episodes.findIndex(e => e.id === episodeId);
        if (episodeIndex !== -1) {
          season.episodes.splice(episodeIndex, 1);

          // Remove season if empty
          if (season.episodes.length === 0) {
            const seasonIndex = show.seasons.findIndex(s => s.seasonNumber === season.seasonNumber);
            if (seasonIndex !== -1) {
              show.seasons.splice(seasonIndex, 1);
            }
          }

          // Remove show if no seasons left
          if (show.seasons.length === 0) {
            const showIndex = metadata.shows.findIndex(s => s.id === show.id);
            if (showIndex !== -1) {
              metadata.shows.splice(showIndex, 1);
            }
          }

          await this.writeMetadata(metadata);
          return;
        }
      }
    }
  }

  async searchShows(query: string): Promise<TVShow[]> {
    const metadata = await this.readMetadata();
    const lowerQuery = query.toLowerCase();

    return metadata.shows.filter(show =>
      show.title.toLowerCase().includes(lowerQuery)
    );
  }
}

export default new ShowMetadataService();
