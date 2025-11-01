import { ChildProcess } from 'child_process';
import axios from 'axios';

interface VLCStatus {
  state: 'playing' | 'paused' | 'stopped';
  position: number; // 0-1
  time: number; // seconds
  length: number; // seconds
  volume: number; // 0-256
}

interface PlaybackSession {
  vlcProcess: ChildProcess | null;
  title: string;
  thumbnail?: string;
  startTime: Date;
  imdbCode?: string;
  loadedSubtitles: string[];
}

class VLCService {
  private vlcPort = 8080;
  private vlcPassword = 'turbopi';
  private currentSession: PlaybackSession | null = null;

  private getVLCUrl(endpoint: string): string {
    return `http://localhost:${this.vlcPort}${endpoint}`;
  }

  private getAuthHeader() {
    const auth = Buffer.from(`:${this.vlcPassword}`).toString('base64');
    return { Authorization: `Basic ${auth}` };
  }

  setSession(vlcProcess: ChildProcess, title: string, thumbnail?: string, imdbCode?: string): void {
    this.currentSession = {
      vlcProcess,
      title,
      thumbnail,
      startTime: new Date(),
      imdbCode,
      loadedSubtitles: []
    };
  }

  getSession(): PlaybackSession | null {
    return this.currentSession;
  }

  clearSession(): void {
    this.currentSession = null;
  }

  async waitForVLC(maxRetries: number = 10, delayMs: number = 500): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(this.getVLCUrl('/requests/status.json'), {
          headers: this.getAuthHeader(),
          timeout: 1000
        });

        if (response.status === 200) {
          console.log('VLC HTTP interface ready');
          return true;
        }
      } catch {
        // VLC not ready yet, wait and retry
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    console.error('VLC HTTP interface failed to start');
    return false;
  }

  async getStatus(): Promise<VLCStatus | null> {
    if (!this.currentSession) {
      return null;
    }

    try {
      const response = await axios.get(this.getVLCUrl('/requests/status.json'), {
        headers: this.getAuthHeader(),
        timeout: 2000
      });

      const data = response.data;

      return {
        state: data.state as 'playing' | 'paused' | 'stopped',
        position: data.position || 0,
        time: data.time || 0,
        length: data.length || 0,
        volume: data.volume || 256
      };
    } catch {
      // Silently fail - this is polled frequently
      return null;
    }
  }

  async play(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      await axios.get(this.getVLCUrl('/requests/status.json?command=pl_play'), {
        headers: this.getAuthHeader(),
        timeout: 2000
      });
      return true;
    } catch (error) {
      console.error('Failed to play:', error);
      return false;
    }
  }

  async pause(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      await axios.get(this.getVLCUrl('/requests/status.json?command=pl_pause'), {
        headers: this.getAuthHeader(),
        timeout: 2000
      });
      return true;
    } catch (error) {
      console.error('Failed to pause:', error);
      return false;
    }
  }

  async seek(seconds: number): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      await axios.get(this.getVLCUrl(`/requests/status.json?command=seek&val=${seconds}`), {
        headers: this.getAuthHeader(),
        timeout: 2000
      });
      return true;
    } catch (error) {
      console.error('Failed to seek:', error);
      return false;
    }
  }

  async stop(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      // Stop VLC playback
      await axios.get(this.getVLCUrl('/requests/status.json?command=pl_stop'), {
        headers: this.getAuthHeader(),
        timeout: 2000
      });

      // Kill the VLC process
      if (this.currentSession.vlcProcess) {
        this.currentSession.vlcProcess.kill();
      }

      this.clearSession();
      return true;
    } catch (error) {
      console.error('Failed to stop:', error);

      // Try to kill process anyway
      if (this.currentSession?.vlcProcess) {
        this.currentSession.vlcProcess.kill();
      }
      this.clearSession();

      return false;
    }
  }

  async addSubtitle(subtitlePath: string): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      // VLC HTTP interface needs just the absolute path (no file:// scheme)
      // URL encoding is done by encodeURIComponent
      const encodedPath = encodeURIComponent(subtitlePath);

      await axios.get(this.getVLCUrl(`/requests/status.json?command=addsubtitle&val=${encodedPath}`), {
        headers: this.getAuthHeader(),
        timeout: 2000
      });

      // Track loaded subtitle
      this.currentSession.loadedSubtitles.push(subtitlePath);
      return true;
    } catch (error) {
      console.error('Failed to add subtitle:', error);
      return false;
    }
  }

  async getSubtitleTracks(): Promise<{ count: number; trackIds: number[] }> {
    if (!this.currentSession) {
      return { count: 0, trackIds: [] };
    }

    try {
      const response = await axios.get(this.getVLCUrl('/requests/status.json'), {
        headers: this.getAuthHeader(),
        timeout: 2000
      });

      // Parse streams from information.category
      const category = response.data?.information?.category || {};
      const subtitleStreams: number[] = [];

      // Find all subtitle streams
      Object.keys(category).forEach((key) => {
        if (key.startsWith('Stream ')) {
          const stream = category[key];
          if (stream.Type === 'Subtitle') {
            // Extract stream number from key like "Stream 2"
            const streamNum = parseInt(key.replace('Stream ', ''), 10);
            subtitleStreams.push(streamNum);
          }
        }
      });

      return {
        count: subtitleStreams.length,
        trackIds: subtitleStreams
      };
    } catch (error) {
      console.error('Failed to get subtitle tracks:', error);
      return { count: 0, trackIds: [] };
    }
  }

  async setSubtitleTrack(trackId: number): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      // trackId: -1 = disable, 0+ = subtitle track index
      await axios.get(this.getVLCUrl(`/requests/status.json?command=subtitle_track&val=${trackId}`), {
        headers: this.getAuthHeader(),
        timeout: 2000
      });
      return true;
    } catch (error) {
      console.error('Failed to set subtitle track:', error);
      return false;
    }
  }
}

export default new VLCService();
