import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type WheelEvent,
} from 'react';
import { cn } from '@/lib/utils';

// 16px text on phones: iOS Safari zooms the whole page into any field smaller than that.
const fieldClasses =
  'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60 aria-invalid:border-red-500 sm:text-sm';

/**
 * Chrome and Edge change a focused number field when you scroll over it, which can silently
 * alter a price or the tax rate. Dropping focus first lets the page scroll instead.
 */
function blurNumberOnWheel(event: WheelEvent<HTMLInputElement>) {
  const field = event.currentTarget;
  if (field.type === 'number' && document.activeElement === field) field.blur();
}

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, onWheel, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(fieldClasses, 'h-10', className)}
    onWheel={(event) => {
      blurNumberOnWheel(event);
      onWheel?.(event);
    }}
    {...props}
  />
));
Input.displayName = 'Input';

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(fieldClasses, 'min-h-20', className)} {...props} />,
);
Textarea.displayName = 'Textarea';

/** A styled native <select>. Works with forms, `required` and mobile pickers out of the box. */
const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClasses, 'h-10 pr-8', className)} {...props} />
));
Select.displayName = 'Select';

export { Input, Textarea, Select };
