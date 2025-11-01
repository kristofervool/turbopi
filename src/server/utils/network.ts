import { networkInterfaces } from 'os';

export function getLocalIpAddress(): string | null {
  const interfaces = networkInterfaces();

  for (const interfaceName of Object.keys(interfaces)) {
    const addresses = interfaces[interfaceName];
    if (!addresses) continue;

    for (const address of addresses) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return null;
}
