'use client';
import type { Receipt, Settings } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ReceiptActions, ReceiptView } from './Receipt';

export function ReceiptModal({ receipt, settings, onClose }: { receipt: Receipt | null; settings: Settings; onClose: () => void }) {
  return (
    <Modal isOpen={!!receipt} onClose={onClose} title="Payment complete" description="The order has been sent to the kitchen.">
      {receipt && (
        <>
          <div className="rounded-md border border-gray-200">
            <ReceiptView receipt={receipt} settings={settings} />
          </div>
          <ReceiptActions receipt={receipt} settings={settings}>
            <Button variant="secondary" onClick={onClose} className="sm:ml-auto">
              New order
            </Button>
          </ReceiptActions>
        </>
      )}
    </Modal>
  );
}
