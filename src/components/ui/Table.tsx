import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto">
    <table ref={ref} className={cn('w-full caption-bottom text-sm text-gray-900', className)} {...props} />
  </div>
));
Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />,
);
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />,
);
TableBody.displayName = 'TableBody';

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('border-b border-gray-200 transition-colors hover:bg-gray-50', className)} {...props} />
));
TableRow.displayName = 'TableRow';

const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn('h-11 whitespace-nowrap px-3 text-left align-middle font-medium text-gray-600 sm:px-4', className)}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  // nowrap keeps short values ("Main Course", "$12.99") on one line; the table scrolls
  // sideways on small screens instead. Long text cells opt out with whitespace-normal.
  <td ref={ref} className={cn('whitespace-nowrap px-3 py-3 align-middle sm:px-4', className)} {...props} />
));
TableCell.displayName = 'TableCell';

/** Full-width row for "nothing here yet" messages. */
function TableEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-gray-500">
        {children}
      </td>
    </tr>
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty };
