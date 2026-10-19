import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NitePlay - Premium Adult Video Streaming',
  description: 'Modern, premium adult video streaming platform featuring trending videos, responsive player, categories, search, and private local library.',
  openGraph: {
    title: 'NitePlay - Premium Adult Video Streaming',
    description: 'Modern, premium adult video streaming platform featuring trending videos, responsive player, categories, search, and private local library.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NitePlay - Premium Adult Video Streaming',
    description: 'Modern, premium adult video streaming platform featuring trending videos, responsive player, categories, search, and private local library.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0B0F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="bg-[#0B0B0F] text-slate-100 min-h-screen antialiased selection:bg-[#E50914] selection:text-white pb-20 md:pb-0" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
