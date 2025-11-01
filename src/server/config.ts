import { Config } from './types/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: Config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  MOVIES_DIR: process.env.MOVIES_DIR || path.join(process.env.HOME || '/home/kristofervool', 'movies'),
  METADATA_FILE: process.env.METADATA_FILE || path.join(process.env.HOME || '/home/kristofervool', 'movies', 'metadata.json'),
  VLC_DISPLAY: process.env.DISPLAY || ':0',
  VLC_XAUTHORITY: process.env.XAUTHORITY || '/home/kristofervool/.Xauthority',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export default config;
