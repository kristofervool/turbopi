import { Config } from './types/index.js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const config: Config = {
  HOST: process.env.HOST || '0.0.0.0',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MOVIES_DIR: process.env.MOVIES_DIR || path.join(process.env.HOME || '/home/kristofervool', 'movies'),
  TV_SHOWS_DIR: process.env.TV_SHOWS_DIR || path.join(process.env.HOME || '/home/kristofervool', 'tv-shows'),
  METADATA_FILE: process.env.METADATA_FILE || path.join(process.env.HOME || '/home/kristofervool', 'movies', 'metadata.json'),
  SHOWS_METADATA_FILE: process.env.SHOWS_METADATA_FILE || path.join(process.env.HOME || '/home/kristofervool', 'tv-shows', 'shows-metadata.json'),
  VLC_DISPLAY: process.env.DISPLAY || ':0',
  VLC_XAUTHORITY: process.env.XAUTHORITY || '/home/kristofervool/.Xauthority',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export default config;
