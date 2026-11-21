import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const Label = forwardRef<HTMLLabelElement, ComponentPropsWithoutRef<'label'>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('text-sm font-medium text-gray-900', className)} {...props} />
));
Label.displayName = 'Label';

/** Label + control + optional hint or error, stacked. */
function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

export { Label, Field };
