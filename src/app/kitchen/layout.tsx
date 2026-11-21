import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Kitchen display' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
