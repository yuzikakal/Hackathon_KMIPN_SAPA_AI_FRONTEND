'use client';

import React, { useEffect, useId, useRef } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface CrudModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'md' | '2xl' | '4xl';
  closeDisabled?: boolean;
}

const widthClasses = {
  md: 'max-w-md',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const CrudModal: React.FC<CrudModalProps> = ({
  open,
  title,
  onClose,
  children,
  maxWidth = '2xl',
  closeDisabled = false,
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [closeDisabled, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    const focusableElements = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(focusableSelector) || []
      ).filter((element) => element.offsetParent !== null);

    (focusableElements()[0] || dialog)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabledRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-slate-800 bg-[#111827] shadow-2xl ${widthClasses[maxWidth]}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#111827]/95 px-5 py-4 backdrop-blur">
          <h3 id={titleId} className="text-sm font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label={`Tutup ${title}`}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
          >
            <FiX />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

interface ConfirmDeleteModalProps {
  open: boolean;
  subject: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  subject,
  deleting,
  onCancel,
  onConfirm,
}) => (
  <CrudModal
    open={open}
    title="Konfirmasi hapus"
    onClose={onCancel}
    closeDisabled={deleting}
    maxWidth="md"
  >
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-rose-900/60 bg-rose-950/30 p-4">
        <FiAlertTriangle className="mt-0.5 shrink-0 text-rose-300" />
        <p className="text-xs leading-relaxed text-slate-300">
          Hapus <span className="font-semibold text-white">{subject}</span>? Tindakan ini tidak
          dapat dibatalkan.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={deleting}
          className="astryx-btn-secondary px-4 py-2 text-xs"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
        >
          {deleting ? 'Menghapus...' : 'Hapus'}
        </button>
      </div>
    </div>
  </CrudModal>
);
