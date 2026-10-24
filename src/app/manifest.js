// Lets phones install the site to the home screen and open it full-screen like an app
export default function manifest() {
  return {
    name: 'Barakah Capital',
    short_name: 'Barakah',
    description: 'Track your investments, units, and NAV performance with Barakah Capital.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#07100E',
    theme_color: '#090c0c',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
