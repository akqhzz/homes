'use client';
import { useMemo, useRef, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import AnchoredPopover from '@/components/molecules/AnchoredPopover';
import CreateInlineField from '@/components/molecules/CreateInlineField';
import RenameDeletePopover from '@/components/molecules/RenameDeletePopover';
import { cn } from '@/lib/utils/cn';

type PanelMode = 'assign' | 'filter';

interface CollectionTagsPanelProps {
  mode: PanelMode;
  title: string;
  open: boolean;
  availableTags: string[];
  selectedTags: string[];
  onClose: () => void;
  onToggleTag: (tag: string) => void;
  onCreateTag: (tag: string) => void;
  onRenameTag?: (oldTag: string, newTag: string) => void;
  onDeleteTag?: (tag: string) => void;
  desktop?: boolean;
}

function CollectionTagsPanelContent({
  availableTags,
  selectedTags,
  onToggleTag,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
}: Omit<CollectionTagsPanelProps, 'title' | 'open' | 'onClose' | 'desktop'>) {
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuTag, setMenuTag] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<string | null>(null);
  const [confirmDeletePosition, setConfirmDeletePosition] = useState<{ right: number; bottom: number } | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const uniqueTags = useMemo(
    () => Array.from(new Set(availableTags.map((tag) => tag.trim()).filter(Boolean))),
    [availableTags]
  );

  const handleCreateTag = () => {
    const tag = newTagName.trim();
    if (!tag) return;
    onCreateTag(tag);
    setNewTagName('');
    setCreating(false);
  };

  const finishRenameTag = (originalTag: string) => {
    const nextValue = editingValue.trim();
    if (onRenameTag && nextValue && nextValue !== originalTag) {
      onRenameTag(originalTag, nextValue);
    }
    setEditingTag(null);
    setEditingValue('');
  };

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const openTagMenu = (tag: string, anchorRect: DOMRect) => {
    setMenuTag(tag);
    setMenuAnchor(anchorRect);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {uniqueTags.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <div
              key={tag}
              className={cn(
                'inline-flex select-none items-center gap-1 rounded-full border px-1 py-0 transition-colors',
                editingTag === tag
                  ? 'border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-primary)]'
                  : selected
                  ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-text-inverse)]'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-brand-600)] hover:text-[var(--color-brand-600)]'
              )}
              style={{ WebkitTouchCallout: 'none' }}
              onContextMenu={(event) => {
                if (!onRenameTag && !onDeleteTag) return;
                event.preventDefault();
                event.stopPropagation();
                openTagMenu(tag, event.currentTarget.getBoundingClientRect());
              }}
              onTouchStart={(event) => {
                if (!onRenameTag && !onDeleteTag) return;
                clearLongPress();
                longPressTriggered.current = false;
                const anchorRect = event.currentTarget.getBoundingClientRect();
                longPressTimer.current = window.setTimeout(() => {
                  longPressTriggered.current = true;
                  openTagMenu(tag, anchorRect);
                }, 420);
              }}
              onTouchEnd={clearLongPress}
              onTouchMove={clearLongPress}
              onTouchCancel={clearLongPress}
            >
              {editingTag === tag ? (
                <div className="flex items-center gap-1 bg-white pl-2 pr-1 text-[var(--color-text-primary)]">
                  <input
                    value={editingValue}
                    onChange={(event) => setEditingValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && onRenameTag) {
                        finishRenameTag(tag);
                      }
                      if (event.key === 'Escape') {
                        setEditingTag(null);
                        setEditingValue('');
                      }
                    }}
                    onBlur={() => finishRenameTag(tag)}
                    className="type-caption h-6 min-w-0 bg-transparent pr-1 font-semibold text-[var(--color-text-primary)] outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => finishRenameTag(tag)}
                    className="flex h-6 w-6 items-center justify-center text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    aria-label="Confirm tag rename"
                  >
                    <Check size={11} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (longPressTriggered.current) {
                        longPressTriggered.current = false;
                        return;
                      }
                      onToggleTag(tag);
                    }}
                    className="type-caption inline-flex min-h-6 items-center gap-1 rounded-full px-2 font-semibold"
                  >
                    {tag}
                    {selected && <Check size={10} />}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <CreateInlineField
        open={creating}
        onOpenChange={setCreating}
        value={newTagName}
        onValueChange={setNewTagName}
        placeholder="Tag name..."
        collapsedLabel="Create new tag"
        onSubmit={handleCreateTag}
        autoFocus
        submitStyle="icon"
        submitIcon={<Plus size={16} />}
      />

      <AnchoredPopover
        open={!!menuTag && !!menuAnchor}
        anchorRect={menuAnchor}
        onClose={() => {
          setMenuTag(null);
          setMenuAnchor(null);
        }}
              className="fixed z-[70] w-36 rounded-2xl bg-white p-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,41,0.16)]"
      >
        <div>
          {onRenameTag && menuTag && (
            <button
              type="button"
              onClick={() => {
                setEditingTag(menuTag);
                setEditingValue(menuTag);
                setMenuTag(null);
                setMenuAnchor(null);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            >
              <Pencil size={14} />
              Rename
            </button>
          )}
          {onDeleteTag && menuTag && (
            <button
              type="button"
              onClick={() => {
                if (menuAnchor) {
                  setConfirmDeletePosition({
                    right: window.innerWidth - menuAnchor.right,
                    bottom: window.innerHeight - menuAnchor.top + 4,
                  });
                }
                setConfirmDeleteTag(menuTag);
                setMenuTag(null);
                setMenuAnchor(null);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[var(--color-accent)] hover:bg-[var(--color-brand-50)]"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </AnchoredPopover>
      {onDeleteTag && confirmDeleteTag && confirmDeletePosition && (
        <RenameDeletePopover
          open
          confirmOpen
          right={confirmDeletePosition.right}
          bottom={confirmDeletePosition.bottom}
          renameLabel="Rename"
          deleteLabel="Delete"
          deleteTitle="Delete tag?"
          deleteDescription={`This will remove "${confirmDeleteTag}" from this collection and its listings.`}
          onClose={() => {
            setConfirmDeleteTag(null);
            setConfirmDeletePosition(null);
          }}
          onRename={() => {}}
          onRequestDelete={() => {}}
          onCancelDelete={() => {
            setConfirmDeleteTag(null);
            setConfirmDeletePosition(null);
          }}
          onConfirmDelete={() => {
            onDeleteTag(confirmDeleteTag);
            setConfirmDeleteTag(null);
            setConfirmDeletePosition(null);
          }}
        />
      )}
    </div>
  );
}

export default function CollectionTagsPanel({
  title,
  open,
  onClose,
  desktop = false,
  ...props
}: CollectionTagsPanelProps) {
  if (!open) return null;

  if (desktop) {
    return (
      <div className="w-[18rem] rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
        <CollectionTagsPanelContent {...props} />
      </div>
    );
  }

  return (
    <MobileDrawer
      title={title}
      onClose={onClose}
      heightClassName="h-auto max-h-[78dvh]"
      contentClassName="px-4 pb-4"
    >
      <CollectionTagsPanelContent {...props} />
    </MobileDrawer>
  );
}
