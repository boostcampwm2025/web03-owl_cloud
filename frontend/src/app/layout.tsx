import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// SUIT 폰트 설정
const suit = localFont({
  src: './fonts/SUIT-Variable.woff2',
  display: 'swap',
  variable: '--font-suit',
  weight: '100 900',
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
      <body className={`${suit.variable} ${cafe24.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
