import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-hidden="true" className={cn('h-10 w-10 animate-spin text-blue-600', className)} />;
}

export function FullPageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100" role="status" aria-live="polite">
      <Spinner />
      <span className="sr-only">{label}</span>
    </div>
  );
}
