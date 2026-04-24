'use client';
import { useMemo, useState } from 'react';
import { Check, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import MobileDrawer from '@/components/molecules/MobileDrawer';
import AnchoredPopover from '@/components/molecules/AnchoredPopover';
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {uniqueTags.length === 0 && (
          <p className="font-heading text-base text-[#0F1729]">No tags available</p>
        )}

        {uniqueTags.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <div
              key={tag}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-1.5 py-1 transition-colors',
                selected
                  ? 'border-[#0F1729] bg-[#0F1729] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0F1729] hover:text-[#0F1729]'
              )}
            >
              {editingTag === tag ? (
                <div className="flex items-center gap-2 pl-2">
                  <input
                    value={editingValue}
                    onChange={(event) => setEditingValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && onRenameTag) {
                        onRenameTag(tag, editingValue);
                        setEditingTag(null);
                        setEditingValue('');
                      }
                      if (event.key === 'Escape') {
                        setEditingTag(null);
                        setEditingValue('');
                      }
                    }}
                    className="h-8 min-w-0 rounded-full bg-transparent px-2 text-sm outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    className="inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 text-[0.8rem] font-medium"
                  >
                    {tag}
                    {selected && <Check size={12} />}
                  </button>
                  {(onRenameTag || onDeleteTag) && (
                    <button
                      type="button"
                      onClick={(event) => {
                        setMenuTag(tag);
                        setMenuAnchor(event.currentTarget.getBoundingClientRect());
                      }}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                        selected ? 'hover:bg-white/10' : 'hover:bg-[#F5F6F7]'
                      )}
                      aria-label="Tag options"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {creating ? (
        <div className="flex gap-2">
          <input
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleCreateTag();
              if (event.key === 'Escape') {
                setCreating(false);
                setNewTagName('');
              }
            }}
            placeholder="Tag name..."
            className="h-12 min-w-0 flex-1 rounded-2xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#0F1729]"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateTag}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F1729] text-white transition-colors hover:bg-[#1F2937]"
            aria-label="Create tag"
          >
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#D1D5DB] px-4 py-3 text-sm text-[#6B7280] transition-colors hover:border-[#0F1729] hover:text-[#0F1729]"
        >
          <Plus size={16} />
          Create new tag
        </button>
      )}

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
