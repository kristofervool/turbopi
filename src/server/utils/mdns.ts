import { Bonjour } from 'bonjour-service';

export function advertiseMdns(port: number, hostname: string = 'turbopi'): void {
  try {
    const bonjour = new Bonjour();

    bonjour.publish({
      name: hostname,
      type: 'http',
      port: port,
      txt: {
        description: 'TurboPi - Raspberry Pi Torrent Streaming Server'
      }
    });

    console.log(`mDNS service published: http://${hostname}.local:${port}`);
  } catch (error) {
    console.error('Failed to publish mDNS service:', error);
    console.log('You can still access via IP address');
  }
}
