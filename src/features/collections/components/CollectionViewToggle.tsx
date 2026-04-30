'use client';
import { LayoutList, Map } from 'lucide-react';
import SegmentedControl from '@/components/ui/SegmentedControl';

export type CollectionView = 'list' | 'map';

interface CollectionViewToggleProps {
  value: CollectionView;
  onChange: (value: CollectionView) => void;
  className?: string;
}

const OPTIONS: Array<{
  value: CollectionView;
  label: string;
  displayLabel: string;
  icon: typeof LayoutList;
}> = [
  { value: 'list', label: 'List view', displayLabel: 'List', icon: LayoutList },
  { value: 'map', label: 'Map view', displayLabel: 'Map', icon: Map },
];

export default function CollectionViewToggle({
  value,
  onChange,
  className,
}: CollectionViewToggleProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={OPTIONS.map(({ icon: Icon, ...option }) => ({
        ...option,
        icon: <Icon size={16} />,
      }))}
      className={className}
      itemClassName="h-11 px-4"
      inactiveItemClassName="text-[#6B7280] hover:bg-[#F5F6F7] hover:text-[#0F1729]"
    />
  );
}
