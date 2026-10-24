import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Barakha Capital - Client Portfolio & Fund NAV Dashboard',
  description: 'Track your investments, units, and NAV performance with Barakha Capital.',
  applicationName: 'Barakah Capital',
  appleWebApp: {
    capable: true,
    title: 'Barakah',
    statusBarStyle: 'black',
  },
  formatDetection: { telephone: false },
  // Older iPhones only honour the legacy tag for full-screen home-screen launches
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export const viewport = {
  themeColor: '#090c0c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100`}>
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
