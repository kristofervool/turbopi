import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Movie, MovieMetadata } from '../types/index.js';
import config from '../config.js';

class MetadataService {
  private metadataPath: string;
  private cache: MovieMetadata | null = null;

  constructor() {
    this.metadataPath = config.METADATA_FILE;
  }

  async ensureMetadataFile(): Promise<void> {
    const dir = path.dirname(this.metadataPath);

    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }

    if (!existsSync(this.metadataPath)) {
      await fs.writeFile(this.metadataPath, JSON.stringify({ movies: [] }, null, 2));
    }
  }

  async loadMetadata(): Promise<MovieMetadata> {
    await this.ensureMetadataFile();

    try {
      const data = await fs.readFile(this.metadataPath, 'utf-8');
      this.cache = JSON.parse(data);
      return this.cache!;
    } catch (error) {
      console.error('Error loading metadata:', error);
      return { movies: [] };
    }
  }

  async saveMetadata(metadata: MovieMetadata): Promise<void> {
    await this.ensureMetadataFile();
    await fs.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
    this.cache = metadata;
  }

  async addMovie(movie: Movie): Promise<void> {
    const metadata = await this.loadMetadata();
    metadata.movies.push(movie);
    await this.saveMetadata(metadata);
  }

  async updateMovie(id: string, updates: Partial<Movie>): Promise<Movie | null> {
    const metadata = await this.loadMetadata();
    const index = metadata.movies.findIndex(m => m.id === id);

    if (index === -1) return null;

    metadata.movies[index] = { ...metadata.movies[index], ...updates };
    await this.saveMetadata(metadata);
    return metadata.movies[index];
  }

  async deleteMovie(id: string): Promise<boolean> {
    const metadata = await this.loadMetadata();
    const index = metadata.movies.findIndex(m => m.id === id);

    if (index === -1) return false;

    const movie = metadata.movies[index];

    // Delete the actual file
    try {
      if (existsSync(movie.filePath)) {
        await fs.unlink(movie.filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    metadata.movies.splice(index, 1);
    await this.saveMetadata(metadata);
    return true;
  }

  async getMovie(id: string): Promise<Movie | null> {
    const metadata = await this.loadMetadata();
    return metadata.movies.find(m => m.id === id) || null;
  }

  async getAllMovies(): Promise<Movie[]> {
    const metadata = await this.loadMetadata();
    return metadata.movies;
  }

  async searchMovies(query: string): Promise<Movie[]> {
    const metadata = await this.loadMetadata();
    const lowerQuery = query.toLowerCase();
    return metadata.movies.filter(m =>
      m.title.toLowerCase().includes(lowerQuery)
    );
  }
}

export default new MetadataService();
