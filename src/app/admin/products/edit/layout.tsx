import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit menu item' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
