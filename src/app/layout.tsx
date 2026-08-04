import type { ReactNode } from 'react';

import './globals.css';
import { Providers } from './providers';

export default function WorkflowLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
