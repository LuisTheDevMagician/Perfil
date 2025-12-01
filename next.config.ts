import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para permitir requisições cross-origin durante desenvolvimento
  // Ignora o aviso de cross-origin de dispositivos na mesma rede local
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
