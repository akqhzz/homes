'use client';
import { useMemo, useState } from 'react';
import { Check, Plus, Tag } from 'lucide-react';
import MobileDrawer from '@/components/molecules/MobileDrawer';
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
  onClearFilters?: () => void;
  desktop?: boolean;
}

function CollectionTagsPanelContent({
  mode,
  availableTags,
  selectedTags,
  onToggleTag,
  onCreateTag,
  onClearFilters,
}: Omit<CollectionTagsPanelProps, 'title' | 'open' | 'onClose' | 'desktop'>) {
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

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
      {mode === 'filter' && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="flex min-h-11 items-center justify-center rounded-2xl bg-[#F5F6F7] px-4 type-btn text-[#0F1729] transition-colors hover:bg-[#EBEBEB]"
        >
          Clear Filters
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        {uniqueTags.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] font-medium transition-colors',
                selected
                  ? 'border-[#0F1729] bg-[#0F1729] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0F1729] hover:text-[#0F1729]'
              )}
            >
              <Tag size={12} />
              {tag}
              {selected && <Check size={12} />}
            </button>
          );
        })}

        {uniqueTags.length === 0 && (
          <p className="type-body text-[#9CA3AF]">
            {mode === 'assign' ? 'No tags yet. Create one below.' : 'No tags yet. Create one to start filtering.'}
          </p>
        )}
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
