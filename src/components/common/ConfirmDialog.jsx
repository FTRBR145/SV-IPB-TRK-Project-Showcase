import React, { useEffect, useState } from 'react';
import { TriangleAlert, Trash2, X } from 'lucide-react';
import ModalShell from './ModalShell';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal'
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) setIsConfirming(false);
  }, [isOpen]);

  const closeDialog = () => {
    if (!isConfirming) onClose?.();
  };

  const confirmAction = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      const result = await onConfirm?.();
      if (result !== false) onClose?.();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={closeDialog}
      ariaLabel={title}
      panelClassName="max-w-md overflow-hidden rounded-2xl"
    >
      <button
        type="button"
        onClick={closeDialog}
        disabled={isConfirming}
        aria-label="Tutup konfirmasi"
        className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:cursor-wait disabled:opacity-50"
      >
        <X size={19} aria-hidden="true" />
      </button>

      <div className="p-6 sm:p-7">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <TriangleAlert size={24} aria-hidden="true" />
        </div>
        <h2 className="pr-10 font-heading text-xl font-bold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 max-w-[65ch] text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeDialog}
            disabled={isConfirming}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={confirmAction}
            disabled={isConfirming}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            <Trash2 size={17} aria-hidden="true" />
            {isConfirming ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
