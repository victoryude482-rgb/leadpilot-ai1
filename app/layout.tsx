import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import QualityOverlay from '@/src/components/quality-overlay';

export const metadata: Metadata = {
  title: 'LeadPilot AI',
  description: 'Find, verify, score, and manage B2B prospects from one workspace.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><QualityOverlay />{children}</body>
    </html>
  );
}
