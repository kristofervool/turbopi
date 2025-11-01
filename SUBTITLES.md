# Subtitle Support in TurboPi

TurboPi now includes full English subtitle support powered by the OpenSubtitles.com API.

## Features

- **Automatic Subtitle Search**: Search for English subtitles using IMDB codes from movie metadata
- **Multiple Options**: Choose from the top 5 most popular subtitles ranked by download count
- **One-Click Loading**: Download and load subtitles directly into VLC with a single click
- **Track Management**: Switch between subtitles or disable them entirely
- **Works with Torrents**: Subtitles work for both local files and streaming torrents

## Setup

### 1. Get an OpenSubtitles API Key

1. Visit [OpenSubtitles.com](https://www.opensubtitles.com/en/consumers)
2. Create a free account or log in
3. Navigate to the API section to generate your API key
4. With a free account, you can download up to 20 subtitles per day

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
OPENSUBTITLES_API_KEY=your_api_key_here
OPENSUBTITLES_USER_AGENT=TurboPi v1.0
```

### 3. Restart the Server

```bash
npm run dev
```

## How to Use

### During Playback

1. While a movie is playing, navigate to the Playback page (`/playback`)
2. Look for the subtitle button (📝 icon) in the control section
3. Click the subtitle button to open the subtitle selector dialog

### Selecting Subtitles

1. The dialog will automatically search for English subtitles based on the movie's IMDB code
2. Browse the available subtitles, sorted by popularity (download count)
3. Each subtitle shows:
   - File name
   - Language badge (EN)
   - Number of downloads
   - Rating (if available)
4. Click on a subtitle to download and load it
5. The subtitle will be automatically applied to the video

### Disabling Subtitles

1. Open the subtitle selector dialog
2. Click the "No Subtitles" button at the top
3. Subtitles will be disabled

## Technical Details

### Backend

- **Subtitle Service** (`src/server/services/subtitleService.ts`): Handles OpenSubtitles API integration
- **VLC Service** (`src/server/services/vlcService.ts`): Controls subtitle loading via VLC HTTP interface
- **API Endpoints**:
  - `GET /api/playback/subtitles/search` - Search for subtitles
  - `POST /api/playback/subtitles/load` - Download and load subtitle
  - `GET /api/playback/subtitles/tracks` - Get loaded subtitle tracks
  - `POST /api/playback/subtitles/select` - Switch subtitle track

### Frontend

- **SubtitleSelector Component** (`src/client/src/components/SubtitleSelector.tsx`): UI for subtitle management
- **Playback Page** (`src/client/src/pages/Playback.tsx`): Integrated subtitle button

### VLC Integration

TurboPi uses VLC's HTTP interface to control subtitles:
- `addsubtitle` command: Load subtitle file
- `subtitle_track` command: Switch between tracks or disable

### Storage

Downloaded subtitles are stored in the system's temp directory:
- macOS/Linux: `/tmp/turbopi-subtitles/`
- Files are cleaned up when the system restarts

## Troubleshooting

### No Subtitles Found

- **Missing IMDB Code**: Some movies (especially from torrents) may not have IMDB metadata
- **No Matches**: Not all movies have English subtitles available
- **API Limit**: Free accounts are limited to 20 downloads per day

### Subtitle Won't Load

- **VLC HTTP Interface**: Ensure VLC's HTTP interface is running (automatic)
- **File Format**: Only SRT format is supported (automatic)
- **File Path**: Check server logs for download errors

### API Errors

- **Invalid API Key**: Verify your API key in `.env`
- **Rate Limiting**: Check if you've exceeded the daily download limit
- **Network Issues**: Ensure internet connectivity

## API Rate Limits

| Account Type | Daily Limit | Cost |
|--------------|-------------|------|
| No Account   | 5 downloads | Free |
| Free Account | 20 downloads | Free |
| VIP Account  | More downloads | Paid |
| Professional | Unlimited   | Paid |

## Future Enhancements

Potential improvements:
- Support for multiple languages
- Automatic subtitle loading based on preferences
- Subtitle offset adjustment
- Support for embedded subtitle tracks in video files
- Subtitle format conversion (ASS, VTT, etc.)

## Credits

Subtitle data provided by [OpenSubtitles.com](https://www.opensubtitles.com/)
