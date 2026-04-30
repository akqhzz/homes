'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import Button from '@/components/ui/Button';
import RenameDeletePopover from '@/components/ui/RenameDeletePopover';
import { useSavedStore } from '@/store/savedStore';
import { useOutsidePointerDown } from '@/hooks/useOutsidePointerDown';
import DesktopCollectionsMenu, { DesktopCollectionsTrigger } from '@/components/layout/DesktopCollectionsMenu';
import { cn } from '@/lib/utils/cn';

interface DesktopCollectionsControlProps {
  open?: boolean;
  align?: 'left' | 'right';
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export default function DesktopCollectionsControl({
  open: controlledOpen,
  align = 'right',
  className,
  onOpenChange,
}: DesktopCollectionsControlProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collectionMenuState, setCollectionMenuState] = useState<{ collectionId: string; right: number; bottom: number } | null>(null);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renameCollectionName, setRenameCollectionName] = useState('');
  const [confirmDeleteCollectionId, setConfirmDeleteCollectionId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { collections, createCollection, renameCollection, deleteCollection } = useSavedStore();
  const open = controlledOpen ?? localOpen;

  const setMenuOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setLocalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const closeCollectionMenu = () => {
    setCollectionMenuState(null);
    setConfirmDeleteCollectionId(null);
  };

  const closeAll = () => {
    setMenuOpen(false);
    setCreatingCollection(false);
    closeCollectionMenu();
  };

  useOutsidePointerDown({
    refs: [containerRef],
    enabled: open,
    ignoreClosestSelectors: ['[data-rename-delete-popover="true"]'],
    onOutside: closeAll,
  });

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    createCollection(name);
    setNewCollectionName('');
    setCreatingCollection(false);
  };

  const openCollectionMenu = (event: MouseEvent<HTMLButtonElement>, collectionId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (collectionMenuState?.collectionId === collectionId) {
      closeCollectionMenu();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setCollectionMenuState({
      collectionId,
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.top + 4,
    });
    setConfirmDeleteCollectionId(null);
  };

  const startCollectionRename = (collectionId: string, name: string) => {
    closeCollectionMenu();
    setRenamingCollectionId(collectionId);
    setRenameCollectionName(name);
  };

  const finishCollectionRename = () => {
    const name = renameCollectionName.trim();
    if (!renamingCollectionId) return;
    if (!name) {
      setRenamingCollectionId(null);
      setRenameCollectionName('');
      return;
    }
    renameCollection(renamingCollectionId, name);
    setRenamingCollectionId(null);
    setRenameCollectionName('');
  };

  const confirmDeleteCollection = () => {
    if (!confirmDeleteCollectionId) return;
    deleteCollection(confirmDeleteCollectionId);
    if (renamingCollectionId === confirmDeleteCollectionId) {
      setRenamingCollectionId(null);
      setRenameCollectionName('');
    }
    closeCollectionMenu();
  };

  return (
    <>
      <div ref={containerRef} className={cn('relative', className)}>
        <Button
          variant="surface"
          size="control"
          onClick={() => {
            const nextOpen = !open;
            setMenuOpen(nextOpen);
            if (!nextOpen) closeCollectionMenu();
          }}
        >
          <DesktopCollectionsTrigger />
        </Button>
        {open && (
          <DesktopCollectionsMenu
            collections={collections}
            creatingCollection={creatingCollection}
            newCollectionName={newCollectionName}
            renamingCollectionId={renamingCollectionId}
            renameCollectionName={renameCollectionName}
            onCreatingCollectionChange={setCreatingCollection}
            onNewCollectionNameChange={setNewCollectionName}
            onRenameCollectionNameChange={setRenameCollectionName}
            onCreateCollection={handleCreateCollection}
            onFinishCollectionRename={finishCollectionRename}
            onCancelCollectionRename={() => {
              setRenamingCollectionId(null);
              setRenameCollectionName('');
            }}
            onOpenCollection={(collectionId) => router.push(`/saved/${collectionId}`)}
            onOpenCollectionMenu={openCollectionMenu}
            onShowAllCollections={() => router.push('/saved')}
            align={align}
          />
        )}
      </div>

      {collectionMenuState && (
        <RenameDeletePopover
          open
          confirmOpen={!!confirmDeleteCollectionId}
          right={collectionMenuState.right}
          bottom={collectionMenuState.bottom}
          deleteTitle="Delete collection?"
          deleteDescription="This will remove the collection and its saved listing references."
          onClose={closeCollectionMenu}
          onRename={() => {
            const active = collections.find((collection) => collection.id === collectionMenuState.collectionId);
            if (active) startCollectionRename(active.id, active.name);
          }}
          onRequestDelete={() => setConfirmDeleteCollectionId(collectionMenuState.collectionId)}
          onCancelDelete={() => setConfirmDeleteCollectionId(null)}
          onConfirmDelete={confirmDeleteCollection}
        />
      )}
    </>
  );
}
