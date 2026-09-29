import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { CommandPalette } from '@/components/CommandPalette';
import { Player } from '@/components/Player';
import { Providers, Toasts } from '@/components/Shell';
import { Wallpaper } from '@/components/Wallpaper';

// SF Pro renders natively on Apple devices via the system stack; Inter is the fallback elsewhere.
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Lumière', template: '%s · Lumière' },
  description: 'Discover films and series, watch trailers, explore careers and find where to stream — powered by IMDb data.',
};

export const viewport: Viewport = { themeColor: '#000000', colorScheme: 'dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased pb-[92px] md:pb-0">
        <Wallpaper />
        <Providers>
          <Nav />
          <main className="relative isolate min-h-dvh">{children}</main>
          <Footer />
          <CommandPalette />
          <Player />
          <Toasts />
        </Providers>
      </body>
    </html>
  );
}
