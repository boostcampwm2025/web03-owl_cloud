import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const suit = localFont({
  src: './fonts/SUIT-Variable.woff2',
  display: 'swap',
  variable: '--font-suit',
  weight: '100 900',
});

const cafe24 = localFont({
  src: [
    { path: './fonts/Cafe24PROSlimAir.woff2', weight: '400' },
    { path: './fonts/Cafe24PROSlimAir.woff', weight: '400' },
  ],
  display: 'swap',
  variable: '--font-cafe24',
});

export const metadata: Metadata = {
  title: '클로비 - Clobby',
  description: '취미, 취향으로 연결하고, 누군가의 시작이 되어보세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${suit.variable} ${cafe24.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
