# TurboPi 🎬

A full-stack TypeScript movie streaming application, built for Raspberry Pi 5.

## Features

- **Search YTS Movies** - Browse thousands of movies from the YTS API
- **Download Torrents** - Save movies to local storage with progress tracking
- **Movie Library** - Manage your downloaded movies with metadata
- **Stream & Play** - Play torrents instantly or from your library via VLC

## Tech Stack

- **Backend**: TypeScript, Node.js, Express, WebTorrent
- **Frontend**: React, TypeScript, Vite, React Router
- **Storage**: JSON file-based metadata
- **Playback**: VLC with ALSA audio output

## Prerequisites

- Raspberry Pi 5 (or compatible Linux system)
- Node.js 18+
- VLC media player: `sudo apt install vlc`
- X11 display server running

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.example .env
# Edit .env with your preferences
```

3. Start development servers:
```bash
npm run dev
```

## Configuration

Environment variables (`.env`):

```env
PORT=3000                                      # Backend server port
MOVIES_DIR=/home/kristofervool/movies          # Where to store movies
DISPLAY=:0                                     # X11 display for VLC
XAUTHORITY=/home/kristofervool/.Xauthority     # X11 auth file
NODE_ENV=development                           # development | production
```

## Usage

### Web Interface

1. **Search Movies**: Navigate to the search page and enter a movie title
2. **Download**: Click the download button to save a movie to your library
3. **View Library**: Check your downloaded movies in the Library tab
4. **Play Movies**: Click play on any movie to launch VLC in fullscreen
5. **Monitor Downloads**: Track active downloads in the Downloads tab

### API Endpoints

See [CLAUDE.md](./CLAUDE.md) for complete API documentation.
