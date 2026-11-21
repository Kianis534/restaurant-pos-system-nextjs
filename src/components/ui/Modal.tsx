'use client';
import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

/** Accessible dialog (focus trap, Escape to close, labelled) built on Radix Dialog. */
export function Modal({ isOpen, onClose, title, description, className, children }: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="no-print fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className={cn(
            'modal-content fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-5 shadow-xl focus:outline-none sm:p-6',
            className,
          )}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="no-print mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-sm text-gray-500">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="rounded-full p-1 text-gray-700 hover:bg-gray-100" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
