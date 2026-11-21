'use client';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

const sheetVariants = cva('fixed z-50 flex flex-col gap-4 overflow-y-auto bg-white p-6 shadow-lg', {
  variants: {
    side: {
      left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-gray-200',
      right: 'inset-y-0 right-0 h-full w-full max-w-md border-l border-gray-200',
    },
  },
  defaultVariants: { side: 'right' },
});

interface SheetContentProps
  extends ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = forwardRef<ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} aria-describedby={undefined} {...props}>
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm p-1 text-gray-700 opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  ),
);
SheetContent.displayName = 'SheetContent';

function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2 pr-6 text-left', className)} {...props} />;
}

const SheetTitle = forwardRef<ElementRef<typeof SheetPrimitive.Title>, ComponentPropsWithoutRef<typeof SheetPrimitive.Title>>(
  ({ className, ...props }, ref) => (
    <SheetPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-gray-900', className)} {...props} />
  ),
);
SheetTitle.displayName = 'SheetTitle';

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle };
