import type { Metadata } from 'next';
import "@/index.css";
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Shell } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'Alife',
  description: 'The digital home for Abundant Life Church.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <Shell>
              {children}
            </Shell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
