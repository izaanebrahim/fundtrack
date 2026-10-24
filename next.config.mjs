/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pages merged into others when the menus were simplified
  async redirects() {
    return [
      { source: '/holdings', destination: '/portfolio', permanent: true },
      { source: '/nav-history', destination: '/fund-performance', permanent: true },
      { source: '/admin/nav-history', destination: '/fund-performance', permanent: true },
      { source: '/admin/fund', destination: '/fund-performance', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
