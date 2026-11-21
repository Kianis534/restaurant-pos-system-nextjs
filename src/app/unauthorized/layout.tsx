import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Access denied' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
