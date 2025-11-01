# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TurboPi is a full-stack TypeScript application for Raspberry Pi 5 that enables searching, downloading, and streaming movies via torrents. It features a React frontend with a Node.js/Express backend, using WebTorrent for P2P downloads and VLC for playback.

## Technology Stack

- **Backend**: TypeScript, Node.js, Express
- **Frontend**: React, TypeScript, Vite
- **Torrent**: WebTorrent
- **Storage**: JSON file-based metadata
- **Player**: VLC with ALSA audio output

## Development Commands

- **Start dev environment**: `npm run dev` - Runs both backend and frontend concurrently
- **Start backend only**: `npm run server:dev` - Backend on port 3000 with tsx watch
- **Start frontend only**: `npm run client:dev` - Frontend on port 5173 with Vite
- **Build for production**: `npm run build` - Compiles TypeScript and builds React app
- **Start production**: `npm start` - Runs compiled server (serves React build)
- **Type check**: `npm run typecheck` - Run TypeScript compiler without emitting files
- **Lint**: `npm run lint` - Run ESLint

## Project Structure

```
src/
├── server/              # TypeScript backend
│   ├── index.ts         # Express app entry point
│   ├── config.ts        # Environment configuration
│   ├── types/           # Shared TypeScript interfaces
│   ├── services/        # Business logic layer
│   │   ├── torrentService.ts    # WebTorrent management
│   │   ├── libraryService.ts    # File system scanning
│   │   └── metadataService.ts   # JSON metadata CRUD
│   └── routes/          # API endpoints
│       ├── search.ts    # YTS movie search
│       ├── library.ts   # Local movie management
│       ├── download.ts  # Torrent downloads
│       └── playback.ts  # Streaming & VLC control
└── client/              # React frontend
    └── src/
        ├── pages/       # Route components
        ├── components/  # Reusable UI components
        ├── services/    # API client (axios)
        └── types/       # Frontend type definitions
```

## Architecture

### Backend API Endpoints

- **GET /api/search?query=** - Search YTS for movies, returns array of YTSMovie
- **GET /api/library** - List all local movies with metadata
- **GET /api/library/search?query=** - Search local library
- **POST /api/library/scan** - Scan movies directory and update metadata
- **DELETE /api/library/:id** - Delete movie file and metadata
- **POST /api/download** - Download torrent to local storage
- **GET /api/download/status/:id** - Get download progress
- **GET /api/download/all** - List all active downloads
- **POST /api/playback/play** - Play movie (accepts `magnetUri` or `movieId`)
- **GET /api/playback/stream** - Stream torrent file (for VLC)
- **GET /api/playback/stream-local/:id** - Stream local file (for VLC)

### Data Flow

**Downloading from YTS:**
1. User searches via frontend → `/api/search`
2. User clicks download → `/api/download` with magnet URI and metadata
3. Backend downloads to `MOVIES_DIR`, tracks progress
4. On completion, adds to metadata.json
5. Frontend polls `/api/download/all` for progress updates

**Playing local movie:**
1. User views library → `/api/library` returns all movies
2. User clicks play → `/api/playback/play` with `movieId`
3. Backend spawns VLC pointing to `/api/playback/stream-local/:id`
4. VLC streams via HTTP range requests

**Playing from torrent:**
1. User clicks play on search result → `/api/playback/play` with `magnetUri`
2. Backend starts torrent, sets `currentStreamingFile`
3. Backend spawns VLC pointing to `/api/playback/stream`
4. VLC streams chunks as torrent downloads

### Services Layer

**torrentService.ts** - Manages WebTorrent client:
- `downloadTorrent()` - Download and persist torrent to disk
- `streamTorrent()` - Stream torrent for immediate playback
- `spawnVLC()` - Launch VLC with Pi-specific settings
- Tracks download progress in Map<id, DownloadProgress>

**libraryService.ts** - File system operations:
- `scanLibrary()` - Scan MOVIES_DIR, sync with metadata
- `extractTitle()` / `extractYear()` - Parse movie info from filename
- Supports .mp4, .mkv, .avi, .mov, .webm

**metadataService.ts** - JSON database operations:
- CRUD operations for Movie records
- Stored in `metadata.json` at MOVIES_DIR
- Auto-creates file/directory structure on first run

### Frontend Architecture

**React Router** with three main pages:
- **Search** - YTS search with download/play buttons
- **Library** - Local movies with play/delete buttons, scan functionality
- **Downloads** - Real-time progress tracking (polls every 2s)

**API Client** (src/client/src/services/api.ts):
- Axios instance with `/api` base URL
- Vite dev server proxies `/api` to backend (port 3000)
- Type-safe requests using shared TypeScript interfaces

### Configuration

Environment variables (create `.env` from `.env.example`):
- `PORT` - Backend server port (default: 3000)
- `MOVIES_DIR` - Where to store downloaded movies
- `DISPLAY` - X11 display for VLC (default: :0)
- `XAUTHORITY` - X11 auth file path
- `NODE_ENV` - development | production

### Raspberry Pi Specifics

**VLC Configuration** (playback routes):
- `--avcodec-hw=none` - Disable hardware decoding (better compatibility)
- `--aout=alsa --alsa-audio-device=hw:1,0` - Direct ALSA audio output
- `DISPLAY` and `XAUTHORITY` env vars for X11/HDMI display
- Fullscreen mode, no title overlays

**Storage**:
- Movies stored at configurable path (default: ~/movies)
- JSON metadata file tracks all movies with thumbnails, ratings, genres
- File system is source of truth - scanning rebuilds metadata

### TypeScript Types

Key interfaces in `src/server/types/index.ts`:
- **Movie** - Local movie metadata record
- **YTSMovie** - YTS API movie response
- **YTSTorrent** - Torrent quality/hash info
- **DownloadProgress** - Live download status
- **Config** - Environment configuration

Same types mirrored in frontend at `src/client/src/types/index.ts`

## Production Deployment

1. Build both frontend and backend: `npm run build`
2. Backend compiles to `dist/server/`
3. Frontend builds to `src/client/dist/`
4. `npm start` serves React SPA from Express in production mode
5. All routes serve index.html for client-side routing

## Development Notes

- Backend watches for changes with `tsx watch`
- Frontend has hot module reloading via Vite
- CORS enabled in development for separate ports
- Production serves React build as static files from Express
- No database required - uses JSON file storage for simplicity on Pi
