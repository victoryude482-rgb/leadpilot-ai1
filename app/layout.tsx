import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ConvexClientProvider } from './ConvexClientProvider';
import './leadpilot.css';

export const metadata: Metadata = {
  title: 'LeadPilot AI',
  description: 'Dynamic AI command center for leads, trends, jobs, websites, agents and client communication.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
