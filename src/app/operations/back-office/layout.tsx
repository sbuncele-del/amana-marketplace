import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata: Metadata = {
  manifest: '/operations/back-office/manifest.webmanifest',
  appleWebApp: {capable: true, title: 'Plentovo Office', statusBarStyle: 'default'},
  robots: {index: false, follow: false},
};

export default function BackOfficeLayout({children}: {children: ReactNode}) {
  return children;
}
