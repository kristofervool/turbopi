import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Movie } from '../types/index.js';
import config from '../config.js';
import metadataService from './metadataService.js';
import { v4 as uuidv4 } from 'uuid';

class LibraryService {
  private moviesDir: string;

  constructor() {
    this.moviesDir = config.MOVIES_DIR;
  }

  async ensureMoviesDirectory(): Promise<void> {
    if (!existsSync(this.moviesDir)) {
      await fs.mkdir(this.moviesDir, { recursive: true });
    }
  }

  async scanLibrary(): Promise<Movie[]> {
    await this.ensureMoviesDirectory();

    try {
      const files = await fs.readdir(this.moviesDir);
      const videoFiles = files.filter(file =>
        /\.(mp4|mkv|avi|mov|webm)$/i.test(file)
      );

      const existingMovies = await metadataService.getAllMovies();
      const existingPaths = new Set(existingMovies.map(m => m.filePath));

      // Add new files to metadata
      for (const file of videoFiles) {
        const filePath = path.join(this.moviesDir, file);

        if (!existingPaths.has(filePath)) {
          const stats = await fs.stat(filePath);
          const movie: Movie = {
            id: uuidv4(),
            title: this.extractTitle(file),
            year: this.extractYear(file) || new Date().getFullYear(),
            fileName: file,
            filePath,
            fileSize: stats.size,
            addedAt: new Date().toISOString()
          };

          await metadataService.addMovie(movie);
        }
      }

      // Remove deleted files from metadata
      const currentFilePaths = new Set(
        videoFiles.map(file => path.join(this.moviesDir, file))
      );

      for (const movie of existingMovies) {
        if (!currentFilePaths.has(movie.filePath)) {
          await metadataService.deleteMovie(movie.id);
        }
      }

      return await metadataService.getAllMovies();
    } catch (error) {
      console.error('Error scanning library:', error);
      return [];
    }
  }

  private extractTitle(filename: string): string {
    // Remove extension
    let title = filename.replace(/\.(mp4|mkv|avi|mov|webm)$/i, '');

    // Remove common patterns like quality indicators
    title = title.replace(/\.(1080p|720p|480p|4k|2160p|HDTV|WEB|BluRay|BRRip|DVDRip)/gi, '');

    // Replace dots and underscores with spaces
    title = title.replace(/[._]/g, ' ');

    // Remove year from title (but keep it for extraction)
    title = title.replace(/\s*\(?\d{4}\)?/g, '');

    // Trim extra spaces
    title = title.trim().replace(/\s+/g, ' ');

    return title;
  }

  private extractYear(filename: string): number | null {
    const yearMatch = filename.match(/\(?(\d{4})\)?/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      if (year >= 1900 && year <= new Date().getFullYear() + 1) {
        return year;
      }
    }
    return null;
  }

  async getMoviePath(id: string): Promise<string | null> {
    const movie = await metadataService.getMovie(id);
    if (!movie || !existsSync(movie.filePath)) {
      return null;
    }
    return movie.filePath;
  }
}

export default new LibraryService();
