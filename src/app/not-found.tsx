import { SearchX } from 'lucide-react';
import { LinkButton } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <SearchX className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-gray-600">That page doesn&apos;t exist or has moved.</p>
        <LinkButton href="/" className="mt-6">
          Back to the app
        </LinkButton>
      </div>
    </main>
  );
}
