'use client';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import ActionRow from '@/components/ui/ActionRow';
import Button from '@/components/ui/Button';

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
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const menuRight = Math.min(Math.max(right, 16), Math.max(16, viewportWidth - 144 - 16));
  const menuBottom = Math.min(Math.max(bottom, 16), Math.max(16, viewportHeight - 112 - 16));
  const confirmRight = Math.min(Math.max(right, 16), Math.max(16, viewportWidth - 224 - 16));
  const confirmBottom = Math.min(Math.max(bottom, 16), Math.max(16, viewportHeight - 168 - 16));

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[95]"
        data-rename-delete-popover="true"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      />
      <AnimatePresence>
        {!confirmOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed z-[100] w-36 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]"
            style={{ bottom: menuBottom, right: menuRight }}
            data-rename-delete-popover="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <ActionRow
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRename();
              }}
            >
              <Pencil size={14} />
              {renameLabel}
            </ActionRow>
            <ActionRow
              tone="danger"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRequestDelete();
              }}
            >
              <Trash2 size={14} />
              {deleteLabel}
            </ActionRow>
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
            style={{ bottom: confirmBottom, right: confirmRight }}
            data-rename-delete-popover="true"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="type-heading-sm text-[#0F1729]">{deleteTitle}</p>
            <p className="mt-1 type-caption text-[#6B7280]">{deleteDescription}</p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-9 flex-1 type-caption font-semibold"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onCancelDelete();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="h-9 flex-1 type-caption font-semibold"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onConfirmDelete();
                }}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
