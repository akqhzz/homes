'use client';
import { Search } from 'lucide-react';
import { Location } from '@/lib/types';

interface SearchLocationResultItemProps {
  location: Location;
  onSelect: () => void;
  highlighted?: boolean;
}

function getPrimaryLocationLabel(name: string) {
  return name.split(',')[0]?.trim() || name;
}

// Shared search dropdown row used by desktop and mobile search surfaces.
// Keeping one component here preserves the same visual treatment across both UIs.
export default function SearchLocationResultItem({
  location,
  onSelect,
  highlighted = false,
}: SearchLocationResultItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#F5F6F7] ${
        highlighted ? 'bg-[#F5F6F7]' : ''
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7]">
        <Search size={14} className="text-[#9CA3AF]" />
      </div>
      <div className="min-w-0">
        <p className="truncate type-label text-[#0F1729]">{getPrimaryLocationLabel(location.name)}</p>
        <p className="type-caption text-[#9CA3AF]">
          {[location.city, location.province].filter(Boolean).join(', ') || 'Canada'}
        </p>
      </div>
    </button>
  );
}
