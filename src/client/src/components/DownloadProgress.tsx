import { Download, Upload, Users } from 'lucide-react';
import type { DownloadProgress as DownloadProgressType } from '../types/index.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface DownloadProgressProps {
  download: DownloadProgressType;
}

export default function DownloadProgress({ download }: DownloadProgressProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec: number): string => {
    return `${formatBytes(bytesPerSec)}/s`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'downloading':
        return 'default';
      case 'seeding':
        return 'secondary';
      case 'complete':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg line-clamp-1">{download.title}</CardTitle>
          <Badge variant={getStatusVariant(download.status)}>
            {download.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{download.progress.toFixed(1)}%</span>
          </div>
          <Progress value={download.progress} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{formatSpeed(download.downloadSpeed)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{formatSpeed(download.uploadSpeed)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{download.numPeers} peers</span>
          </div>
          <div className="text-muted-foreground">
            {formatBytes(download.downloaded)} / {formatBytes(download.total)}
          </div>
        </div>

        {download.error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            Error: {download.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
