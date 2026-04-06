import os from 'os';

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: (() => {
    const interfaces = os.networkInterfaces();
    const ips = ['localhost', '127.0.0.1'];
    
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] ?? []) {
        if (net.family === 'IPv4' && !net.internal && net.address) {
          ips.push(net.address);
        }
      }
    }
    return ips;
  })(),

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

export default nextConfig;
