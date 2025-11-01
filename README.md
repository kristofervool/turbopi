# TurboPi 🎬

A full-stack TypeScript movie streaming application for Raspberry Pi 5. Search, download, and stream movies via torrents with a sleek React interface.

## Features

- 🔍 **Search YTS Movies** - Browse thousands of movies from the YTS API
- ⬇️ **Download Torrents** - Save movies to local storage with progress tracking
- 📚 **Movie Library** - Manage your downloaded movies with metadata
- ▶️ **Stream & Play** - Play torrents instantly or from your library via VLC
- 🎨 **Modern UI** - Clean, dark-themed React interface optimized for Pi display
- 🚀 **Fast Development** - Hot reloading for both frontend and backend

## Tech Stack

- **Backend**: TypeScript, Node.js, Express, WebTorrent
- **Frontend**: React, TypeScript, Vite, React Router
- **Storage**: JSON file-based metadata
- **Playback**: VLC with ALSA audio output

## Prerequisites

- Raspberry Pi 5 (or compatible Linux system)
- Node.js 18+ and npm
- VLC media player: `sudo apt install vlc`
- X11 display server running

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd turbopi
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
# Edit .env with your preferences
```

4. Start development servers:
```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:3000`
- Frontend dev server on `http://localhost:5173`

## Development

```bash
# Run both frontend and backend with hot reload
npm run dev

# Run backend only
npm run server:dev

# Run frontend only
npm run client:dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

The production server serves the React app from Express and runs on port 3000.

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

## Project Structure

```
turbopi/
├── src/
│   ├── server/              # TypeScript backend
│   │   ├── index.ts         # Express app
│   │   ├── config.ts        # Configuration
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── types/           # TypeScript types
│   └── client/              # React frontend
│       └── src/
│           ├── pages/       # Route components
│           ├── components/  # UI components
│           ├── services/    # API client
│           └── types/       # Frontend types
├── package.json
├── tsconfig.json
└── .env.example
```

## Troubleshooting

**VLC won't launch:**
- Ensure VLC is installed: `vlc --version`
- Check X11 display is running: `echo $DISPLAY`
- Verify XAUTHORITY path in `.env`

**Downloads not saving:**
- Check MOVIES_DIR exists and is writable
- Verify disk space: `df -h`

**Frontend can't connect to backend:**
- Ensure backend is running on port 3000
- Check CORS is enabled in development

## License

ISC

## Contributing

Pull requests welcome! Please ensure TypeScript compilation passes (`npm run typecheck`) before submitting.
