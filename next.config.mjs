/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // garante que os .br do @sparticuz/chromium vão para o bundle da função
    outputFileTracingIncludes: {
      'app/api/export/pdf/route': [
        'node_modules/@sparticuz/chromium/bin/**',
      ],
    },
  },
};
module.exports = nextConfig;
