import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GitView',
  description: 'Dynamic SVG contribution graphs for your GitHub profile README.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-zinc-700/50">
        {children}
      </body>
    </html>
  );
}
