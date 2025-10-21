/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      // caminho do arquivo da rota, sem a extensão compilada
      "app/api/export/pdf/route": ["node_modules/@sparticuz/chromium/bin/**"],
    },
  },
};

export default nextConfig;
