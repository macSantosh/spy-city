import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'S&P 500 City — 3D Market Visualization',
  description:
    'An immersive 3D visualization that renders every S&P 500 company as a building in a procedurally generated night-time city. Building size is proportional to market capitalization.',
  keywords: ['S&P 500', '3D visualization', 'stock market', 'React Three Fiber', 'market cap'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
