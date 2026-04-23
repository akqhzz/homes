'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/atoms/Avatar';
import { CollaboratorAvatar } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface CollectionWorkspaceHeaderProps {
  title: string;
  listingCount: number;
  collaborators?: CollaboratorAvatar[];
  className?: string;
}

export default function CollectionWorkspaceHeader({
  title,
  listingCount,
  collaborators = [],
  className,
}: CollectionWorkspaceHeaderProps) {
  const router = useRouter();
  const listingLabel = `${listingCount} listing${listingCount === 1 ? '' : 's'}`;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        onClick={() => router.back()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7] text-[#0F1729] transition-colors hover:bg-[#EBEBEB]"
        aria-label="Back"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex min-h-11 items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="type-title text-[#0F1729] lg:text-[2rem]">{title}</h1>
            <p className="mt-1 type-body text-[#6B7280]">{listingLabel}</p>
          </div>

          {collaborators.length > 0 && (
            <div className="hidden shrink-0 items-center gap-2 pt-1 sm:flex">
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map((collaborator) => (
                  <Avatar
                    key={collaborator.id}
                    src={collaborator.avatar}
                    name={collaborator.name}
                    size="sm"
                    className="border-2 border-white"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
