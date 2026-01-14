import Header from '@/components/layout/Header';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="flex-1">{children}</main>
    </div>
  );
}
