import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

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
  title: 'DEVMEET',
  description: '코드 에디터 화상통화',
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
