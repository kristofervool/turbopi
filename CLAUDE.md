# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TurboPi is a Raspberry Pi-based torrent streaming server that fetches movie torrents from YTS and streams them directly through VLC. It uses WebTorrent for P2P streaming and Express for the HTTP API.

## Development Commands

- **Start server**: `npm start` - Runs the Express server on port 3000
- **Lint code**: `npx eslint .` - Run ESLint on the codebase

## Architecture

### Core Components

**src/index.js** - Single-file Express server with three main endpoints:

1. **GET /search?query=** - Searches YTS API for movies and returns magnet link
2. **POST /play** - Accepts `magnetUri` in body, adds torrent to WebTorrent client, spawns VLC player
3. **GET /stream** - Serves video file with HTTP range request support for seeking

### Key Flow

1. Client searches for movie via `/search?query=moviename`
2. Client posts magnet link to `/play` endpoint
3. Server adds torrent to WebTorrent client
4. Server spawns VLC pointing to local `/stream` endpoint
5. VLC requests video chunks via HTTP range requests from `/stream`

### Raspberry Pi Specifics

The VLC spawn in `/play` (src/index.js:102-118) includes Pi-specific configurations:
- `--avcodec-hw=none` - Disables hardware decoding
- `--aout=alsa --alsa-audio-device=hw:1,0` - Direct ALSA audio output
- `DISPLAY=:0` and `XAUTHORITY` env vars for X11 display on HDMI

### State Management

- `currentFile` global variable stores the currently streaming WebTorrent file
- WebTorrent client instance is shared across all requests
- Only one file can be streamed at a time

## Dependencies

- **express** (v5.1.0) - HTTP server
- **webtorrent** - P2P torrent client
- **axios** - YTS API requests
- **nodemon** - Development file watching (though not in scripts)

## Notes

- The server expects VLC to be installed and available in PATH
- Designed to run on Raspberry Pi with X11 display
- No authentication or multi-user support
- Range requests in /stream enable video seeking in VLC
