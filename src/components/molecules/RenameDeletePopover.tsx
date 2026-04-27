'use client';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';

interface RenameDeletePopoverProps {
  open: boolean;
  confirmOpen?: boolean;
  right: number;
  bottom: number;
  renameLabel?: string;
  deleteLabel?: string;
  deleteTitle: string;
  deleteDescription: string;
  onClose: () => void;
  onRename: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

// Shared overflow menu system for collection/search cards: same menu, same delete confirmation, same portal layering.
export default function RenameDeletePopover({
  open,
  confirmOpen = false,
  right,
  bottom,
  renameLabel = 'Rename',
  deleteLabel = 'Delete',
  deleteTitle,
  deleteDescription,
  onClose,
  onRename,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: RenameDeletePopoverProps) {
  if (typeof document === 'undefined' || !open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[95]"
        data-rename-delete-popover="true"
        onClick={onClose}
      />
      <AnimatePresence>
        {!confirmOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed z-[100] w-36 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]"
            style={{ bottom, right }}
            data-rename-delete-popover="true"
          >
            <button
              type="button"
              onClick={onRename}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#0F1729] hover:bg-[#F5F6F7]"
            >
              <Pencil size={14} />
              {renameLabel}
            </button>
            <button
              type="button"
              onClick={onRequestDelete}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#EF4444] hover:bg-red-50"
            >
              <Trash2 size={14} />
              {deleteLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed z-[100] w-56 rounded-2xl bg-white p-3 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]"
            style={{ bottom, right }}
            data-rename-delete-popover="true"
          >
            <p className="type-heading-sm text-[#0F1729]">{deleteTitle}</p>
            <p className="mt-1 type-caption text-[#6B7280]">{deleteDescription}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onCancelDelete}
                className="h-9 flex-1 rounded-full bg-[#F5F6F7] type-caption font-semibold text-[#0F1729]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                className="h-9 flex-1 rounded-full bg-[#EF4444] type-caption font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
