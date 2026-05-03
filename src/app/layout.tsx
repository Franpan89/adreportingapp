import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WMM Client Reporting',
  description: 'Reporte multicanal del rendimiento de cada cliente — Meta, Google Ads, GA4, Search Console y TikTok.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
