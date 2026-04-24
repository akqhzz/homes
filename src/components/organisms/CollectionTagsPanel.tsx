'use client';
import { useMemo, useRef, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import AnchoredPopover from '@/components/molecules/AnchoredPopover';
import CreateInlineField from '@/components/molecules/CreateInlineField';
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
                'inline-flex select-none items-center gap-1 rounded-full border px-1.5 py-0.5 transition-colors',
                editingTag === tag
                  ? 'border-[#D1D5DB] bg-transparent text-[#0F1729]'
                  : selected
                  ? 'border-[#0F1729] bg-[#0F1729] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0F1729] hover:text-[#0F1729]'
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
                <div className="flex items-center gap-1 rounded-full border border-[#D1D5DB] bg-white pl-2 pr-1 text-[#0F1729]">
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
                    className="h-8 min-w-0 bg-transparent pr-1 text-sm outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => finishRenameTag(tag)}
                    className="flex h-7 w-7 items-center justify-center text-[#6B7280] transition-colors hover:text-[#0F1729]"
                    aria-label="Confirm tag rename"
                  >
                    <Check size={13} />
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
                    className="inline-flex min-h-6 items-center gap-1 rounded-full px-2.5 text-[0.74rem] font-medium"
                  >
                    {tag}
                    {selected && <Check size={12} />}
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
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#0F1729] hover:bg-[#F5F6F7]"
            >
              <Pencil size={14} />
              Rename
            </button>
          )}
          {onDeleteTag && menuTag && (
            <button
              type="button"
              onClick={() => {
                onDeleteTag(menuTag);
                setMenuTag(null);
                setMenuAnchor(null);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-[#EF4444] hover:bg-red-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </AnchoredPopover>
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
      <div className="w-[22rem] rounded-3xl bg-white p-4 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
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
