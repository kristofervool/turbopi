import { Bonjour } from 'bonjour-service';

export function advertiseMdns(port: number, hostname: string = 'turbopi'): void {
  try {
    const bonjour = new Bonjour();

    const service = bonjour.publish({
      name: hostname,
      type: 'http',
      port: port,
      txt: {
        description: 'TurboPi - Raspberry Pi Torrent Streaming Server'
      }
    });

    service.on('up', () => {
      console.log(`   mDNS:    http://${hostname}.local:${port} ✓`);
    });

    service.on('error', (err: Error) => {
      console.error('❌ mDNS service error:', err.message);
      console.log('💡 Troubleshooting:');
      console.log('   - On Raspberry Pi: sudo apt-get install avahi-daemon');
      console.log('   - On macOS: mDNS (Bonjour) is built-in');
      console.log('   - Use IP address instead if mDNS is unavailable');
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to publish mDNS service:', errorMessage);
    console.log('💡 You can still access TurboPi via IP address');
  }
}
