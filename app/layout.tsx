import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import CommandDashboard from '@/src/components/command-dashboard';

export const metadata: Metadata = {
  title: 'Victory AI',
  description: 'AI command center for leads, trends, opportunities, tenders, products, competitors, outreach and content.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><CommandDashboard />{children}</body>
    </html>
  );
}
