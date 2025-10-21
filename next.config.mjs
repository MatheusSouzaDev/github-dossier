/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      // sem extensão aqui; use o caminho lógico da rota
      'app/api/export/pdf/route': [
        'node_modules/@sparticuz/chromium/bin/**',
      ],
    },
  },
};

export default nextConfig;
