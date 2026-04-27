import type { Metadata, Viewport } from 'next';
import { DM_Sans, Lora, Newsreader } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-heading-source',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-currency',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Homes — Find Your Home in the GTA',
  description: 'Search homes, condos and townhouses in the Greater Toronto Area.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Homes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
  interactiveWidget: 'resizes-visual',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${newsreader.variable} ${lora.variable} h-full`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
