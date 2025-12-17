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
  src: [
    { path: './fonts/SUIT-Thin.woff2', weight: '100', style: 'normal' },
    { path: './fonts/SUIT-ExtraLight.woff2', weight: '200', style: 'normal' },
    { path: './fonts/SUIT-Light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/SUIT-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/SUIT-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/SUIT-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/SUIT-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/SUIT-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: './fonts/SUIT-Heavy.woff2', weight: '900', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-suit',
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
  title: '클로비',
  description: '취미, 취향으로 연결하고, 누군가의 시작이 되어보세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${suit.variable} ${cafe24.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
