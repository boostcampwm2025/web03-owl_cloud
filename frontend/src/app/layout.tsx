import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// SUIT 폰트 설정
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

// Cafe24 폰트 설정
const cafe24 = localFont({
  src: [
    { path: './fonts/Cafe24PROSlimAir.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Cafe24PROSlimAir.woff', weight: '400', style: 'normal' },
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
      <body
        className={`${suit.variable} ${cafe24.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
