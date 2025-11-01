# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TurboPi is a full-stack TypeScript application for Raspberry Pi 5 that enables searching, downloading, and streaming movies via torrents. It features a modern React frontend with shadcn/ui components, a Node.js/Express backend using ESM modules, WebTorrent for P2P downloads, and VLC with HTTP interface for remote playback control.

## Technology Stack

- **Backend**: TypeScript, Node.js, Express 5, ESM modules
- **Frontend**: React 19, TypeScript, Vite 7, React Router 7
- **UI Framework**: shadcn/ui (Radix UI primitives + Tailwind CSS 4)
- **Torrent**: WebTorrent
- **Storage**: JSON file-based metadata
- **Player**: VLC with HTTP interface for remote control
- **Network**: mDNS service discovery (Bonjour)

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
├── server/              # TypeScript backend (ESM)
│   ├── index.ts         # Express app entry point
│   ├── config.ts        # Environment configuration
│   ├── types/           # Shared TypeScript interfaces
│   ├── utils/           # Utility functions
│   │   ├── network.ts   # Network IP detection
│   │   └── mdns.ts      # mDNS service advertisement
│   ├── services/        # Business logic layer
│   │   ├── torrentService.ts    # WebTorrent management
│   │   ├── libraryService.ts    # File system scanning
│   │   ├── metadataService.ts   # JSON metadata CRUD
│   │   └── vlcService.ts        # VLC HTTP control
│   └── routes/          # API endpoints
│       ├── search.ts    # YTS movie search
│       ├── library.ts   # Local movie management
│       ├── download.ts  # Torrent downloads
│       └── playback.ts  # Streaming & VLC control
└── client/              # React frontend
    └── src/
        ├── pages/       # Route components
        │   ├── Search.tsx    # YTS search page
        │   ├── Library.tsx   # Local library
        │   ├── Downloads.tsx # Download progress
        │   └── Playback.tsx  # Remote control UI
        ├── components/  # Reusable UI components
        │   ├── ui/          # shadcn/ui primitives
        │   ├── MovieCard.tsx
        │   ├── MovieModal.tsx
        │   ├── SearchBar.tsx
        │   ├── DownloadProgress.tsx
        │   ├── PlaybackBar.tsx
        │   └── Layout.tsx
        ├── hooks/       # Custom React hooks
        │   └── usePlayback.ts
        ├── services/    # API client (axios)
        │   └── api.ts
        └── types/       # Frontend type definitions
```

## Architecture

### Backend API Endpoints

**Search:**
- **GET /api/search?query=** - Search YTS for movies, returns array of YTSMovie

**Library:**
- **GET /api/library** - List all local movies with metadata
- **GET /api/library/search?query=** - Search local library
- **POST /api/library/scan** - Scan movies directory and update metadata
- **DELETE /api/library/:id** - Delete movie file and metadata

**Download:**
- **POST /api/download** - Download torrent to local storage
- **GET /api/download/status/:id** - Get download progress
- **GET /api/download/all** - List all active downloads

**Playback:**
- **POST /api/playback/play** - Play movie (accepts `magnetUri` or `movieId`)
- **GET /api/playback/status** - Get current playback status
- **POST /api/playback/pause** - Toggle pause/resume
- **POST /api/playback/seek** - Seek to position (seconds)
- **POST /api/playback/stop** - Stop playback
- **GET /api/playback/stream** - Stream torrent file (for VLC)
- **GET /api/playback/stream-local/:id** - Stream local file (for VLC)

### Data Flow

**Downloading from YTS:**
1. User searches via frontend → `/api/search`
2. User selects quality from modal and clicks download → `/api/download` with magnet URI and metadata
3. Backend downloads to `MOVIES_DIR`, tracks progress
4. On completion, adds to metadata.json
5. Frontend polls `/api/download/all` for progress updates (every 2s)

**Playing local movie:**
1. User views library → `/api/library` returns all movies
2. User clicks play → `/api/playback/play` with `movieId`
3. Backend spawns VLC with HTTP interface pointing to `/api/playback/stream-local/:id`
4. Backend waits for VLC HTTP interface to be ready
5. Frontend redirects to `/playback` page
6. VLC streams via HTTP range requests, frontend polls status for remote control

**Playing from torrent:**
1. User clicks play on search result → `/api/playback/play` with `magnetUri`
2. Backend starts torrent, sets `currentStreamingFile`
3. Backend spawns VLC with HTTP interface pointing to `/api/playback/stream`
4. Backend waits for VLC HTTP interface to be ready
5. Frontend redirects to `/playback` page
6. VLC streams chunks as torrent downloads, frontend provides remote control

### Services Layer

**torrentService.ts** - Manages WebTorrent client:
- `downloadTorrent()` - Download and persist torrent to disk
- `streamTorrent()` - Stream torrent for immediate playback
- `spawnVLC()` - Launch VLC with platform-specific settings and HTTP interface
- `getCurrentStreamingFile()` - Get currently streaming torrent file
- `createStreamPipeline()` - Create readable stream for HTTP range requests
- `cleanupStreamingTorrent()` - Cleanup after playback stops
- Tracks download progress in Map<id, DownloadProgress>

**vlcService.ts** - VLC HTTP interface control:
- `setSession()` - Register VLC process and playback metadata
- `getSession()` - Get current playback session
- `clearSession()` - Clear playback session
- `waitForVLC()` - Wait for VLC HTTP interface to be ready
- `getStatus()` - Get playback status (state, position, time, length)
- `play()` - Resume playback
- `pause()` - Toggle pause
- `seek(seconds)` - Seek to position
- `stop()` - Stop playback and kill VLC process
- VLC HTTP interface runs on port 8080 with password 'turbopi'

**libraryService.ts** - File system operations:
- `scanLibrary()` - Scan MOVIES_DIR, sync with metadata
- `extractTitle()` / `extractYear()` - Parse movie info from filename
- `getMoviePath(id)` - Get file path for movie by ID
- Supports .mp4, .mkv, .avi, .mov, .webm

**metadataService.ts** - JSON database operations:
- `getMovieById(id)` - Get movie metadata by ID
- CRUD operations for Movie records
- Stored in `metadata.json` at MOVIES_DIR
- Auto-creates file/directory structure on first run

### Frontend Architecture

**React Router 7** with four main pages:
- **Search** (`/`) - YTS search with MovieModal for quality selection, download/play buttons
- **Library** (`/library`) - Local movies with play/delete buttons, scan functionality
- **Downloads** (`/downloads`) - Real-time progress tracking with DownloadProgress components (polls every 2s)
- **Playback** (`/playback`) - Full-screen remote control UI with play/pause, seek, progress bar

**Key Components:**
- **MovieModal** - Modal dialog with quality selection using Radix UI Radio Group
- **MovieCard** - Displays movie poster, title, year, rating, genres
- **PlaybackBar** - Bottom bar showing current playback (when active)
- **DownloadProgress** - Progress bar with download stats
- **Layout** - Navigation wrapper with PlaybackBar (not used on /playback route)

**Hooks:**
- **usePlayback** - Manages playback state, polls `/api/playback/status` every 2s
  - Returns: `status`, `isLoading`, `isInitialLoading`, `handlePause`, `handleSeek`, `handleStop`, `refresh`
  - Automatically redirects to `/` if no active playback

**API Client** (src/client/src/services/api.ts):
- Axios instance with `/api` base URL
- Vite dev server proxies `/api` to backend (port 3000)
- Type-safe requests using shared TypeScript interfaces
- Functions: `searchMovies`, `getLibrary`, `scanLibrary`, `deleteMovie`, `downloadMovie`, `getDownloads`, `playMovie`, `getPlaybackStatus`, `togglePause`, `seekPlayback`, `stopPlayback`

**UI Components** (shadcn/ui):
- Button, Card, Input, Badge, Progress, Dialog, RadioGroup, Label
- All using Radix UI primitives + Tailwind CSS utility classes
- Located in `src/client/src/components/ui/`

### Configuration

Environment variables (create `.env` from `.env.example`):
- `HOST` - Server bind address (default: 0.0.0.0 for network access)
- `PORT` - Backend server port (default: 3000)
- `MOVIES_DIR` - Where to store downloaded movies
- `DISPLAY` - X11 display for VLC (default: :0) - Linux only
- `XAUTHORITY` - X11 auth file path - Linux only
- `NODE_ENV` - development | production

### Network Access

TurboPi supports mDNS (Bonjour) for easy network access:
- **From your phone/tablet**: Open `http://turbopi.local:3000`
- **From any device on the network**: Use the IP address shown on startup
- Server binds to `0.0.0.0` by default to accept network connections
- mDNS service is automatically advertised when server starts (via `bonjour-service`)

**Requirements for mDNS**:
- Raspberry Pi: Install Avahi daemon (`sudo apt-get install avahi-daemon`)
- iOS/Mac: Built-in support (Bonjour)
- Android: Install a Bonjour/mDNS service app
- Windows: Install Bonjour Print Services

### Platform-Specific Configuration

**VLC Configuration** is platform-aware (src/server/routes/playback.ts):

**macOS:**
- Path: `/Applications/VLC.app/Contents/MacOS/VLC`
- No ALSA audio output
- No DISPLAY/XAUTHORITY environment variables
- HTTP interface enabled on port 8080

**Linux/Raspberry Pi:**
- Path: `vlc` (system-installed)
- `--avcodec-hw=none` - Disable hardware decoding (better compatibility)
- `--aout=alsa --alsa-audio-device=hw:1,0` - Direct ALSA audio output
- `DISPLAY` and `XAUTHORITY` env vars for X11/HDMI display
- `--no-dbus` - Disable D-Bus integration
- HTTP interface enabled on port 8080

**Common VLC flags (all platforms):**
- `--fullscreen` - Start in fullscreen mode
- `--no-video-title-show` - Hide title overlay
- `--http-host=0.0.0.0` - Allow network access to HTTP interface
- `--http-port=8080` - HTTP interface port
- `--http-password=turbopi` - Authentication password
- `--extraintf=http` - Enable HTTP control interface

**Storage**:
- Movies stored at configurable path (default: ~/movies)
- JSON metadata file tracks all movies with thumbnails, ratings, genres
- File system is source of truth - scanning rebuilds metadata

### TypeScript Types

Key interfaces in `src/server/types/index.ts`:
- **Movie** - Local movie metadata record (id, title, year, fileName, filePath, fileSize, thumbnail, imdbCode, rating, genres, addedAt)
- **MovieMetadata** - Container for all movies
- **YTSMovie** - YTS API movie response
- **YTSTorrent** - Torrent quality/hash info
- **DownloadProgress** - Live download status (id, magnetUri, title, progress, downloadSpeed, uploadSpeed, numPeers, downloaded, total, status, error)
- **Config** - Environment configuration
- **PlaybackStatus** - Playback state (isActive, isPlaying, currentTime, duration, title, thumbnail)

Same types mirrored in frontend at `src/client/src/types/index.ts`

## Production Deployment

1. **On Raspberry Pi**, install Avahi for mDNS support:
   ```bash
   sudo apt-get update
   sudo apt-get install avahi-daemon
   sudo systemctl enable avahi-daemon
   sudo systemctl start avahi-daemon
   ```

2. **Install VLC**:
   ```bash
   sudo apt-get install vlc
   ```

3. Build both frontend and backend: `npm run build`
4. Backend compiles to `dist/server/`
5. Frontend builds to `src/client/dist/`
6. `npm start` serves React SPA from Express in production mode
7. Server displays network access URLs on startup
8. Access from phone: `http://turbopi.local:3000`

## Development Notes

- Backend uses ESM modules (`.js` imports in TypeScript)
- Backend watches for changes with `tsx watch`
- Frontend has hot module reloading via Vite
- CORS enabled in development for separate ports
- Production serves React build as static files from Express
- No database required - uses JSON file storage for simplicity on Pi
- VLC HTTP interface allows remote control from frontend
- Library is scanned automatically on server startup
- Playback page polls status every 2 seconds for real-time updates
- MovieModal uses Radix UI RadioGroup for quality selection
- All UI components follow shadcn/ui conventions
