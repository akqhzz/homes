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

  const uniqueTags = useMemo(
    () => Array.from(new Set(availableTags.map((tag) => tag.trim()).filter(Boolean))),
    [availableTags]
  );

  const handleCreateTag = () => {
    const tag = newTagName.trim();
    if (!tag) return;
    onCreateTag(tag);
    setNewTagName('');
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
                'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 type-btn transition-colors',
                selected
                  ? 'border-[#0F1729] bg-[#0F1729] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#0F1729] hover:border-[#0F1729]'
              )}
            >
              <Tag size={14} />
              {tag}
              {selected && <Check size={14} />}
            </button>
          );
        })}

        {uniqueTags.length === 0 && (
          <p className="type-body text-[#9CA3AF]">
            {mode === 'assign' ? 'No tags yet. Create one below.' : 'No tags yet. Create one to start filtering.'}
          </p>
        )}
      </div>

      <div className="rounded-[24px] bg-[#F9FAFB] p-3">
        <p className="mb-2 type-label text-[#0F1729]">Create new tag</p>
        <div className="flex gap-2">
          <input
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleCreateTag();
            }}
            placeholder="Tag name"
            className="h-11 min-w-0 flex-1 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm outline-none transition-colors focus:border-[#0F1729]"
          />
          <button
            type="button"
            onClick={handleCreateTag}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F1729] text-white transition-colors hover:bg-[#1F2937]"
            aria-label="Create tag"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
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
