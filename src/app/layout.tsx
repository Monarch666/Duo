import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Duo — Private Space for Two',
  description: 'An intimate, private sanctuary designed exclusively for you and your partner.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#FAF6EF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden w-full max-w-full">
      <body className="antialiased selection:bg-rosewood-200 selection:text-rosewood-900 bg-warmth-100 text-warmth-900 min-h-screen overflow-x-hidden w-full max-w-full m-0 p-0 relative">
        {children}
      </body>
    </html>
  );
}
