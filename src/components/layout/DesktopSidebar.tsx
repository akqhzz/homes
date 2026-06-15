'use client';
import Image from 'next/image';
import { Accessibility, Briefcase, ChevronDown, DollarSign, Heart, Home, KeyRound, LogOut, Mail, Map, Menu, Newspaper, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { cn } from '@/lib/utils/cn';
import ActionRow from '@/components/ui/ActionRow';
import { useSavedStore } from '@/store/savedStore';
import RenameDeletePopover from '@/components/ui/RenameDeletePopover';
import DesktopCollectionsMenu from '@/components/layout/DesktopCollectionsMenu';

type MenuItem = {
  icon: typeof Newspaper;
  label: string;
  sections?: string[][];
};

const MENU_ITEMS: MenuItem[] = [
  {
    icon: Home,
    label: 'Buy',
    sections: [
      ['Toronto Real Estate', 'Houses for Sale', 'Condos for Sale', 'Townhouses for Sale', 'Open Houses', 'Recently Sold'],
      ['New Listings', 'New Construction', 'Information about Buying'],
    ],
  },
  {
    icon: KeyRound,
    label: 'Rent',
    sections: [
      ['Toronto Rentals', 'Houses for Rent', 'Condos for Rent', 'Townhouses for Rent'],
      ['New Listings', 'Information about Renting'],
    ],
  },
  {
    icon: DollarSign,
    label: 'Sell',
    sections: [
      ['Toronto Recently Sold', 'Sell with Zoocasa', 'Home Appraisal'],
      ['Information about Selling'],
    ],
  },
  { icon: Mail, label: 'Newsletter' },
  { icon: Briefcase, label: 'Careers', sections: [['Headquarters', 'Agents', 'About Us']] },
  { icon: Accessibility, label: 'Accessibility' },
  { icon: Map, label: 'Sitemap' },
];

const NAV_ITEMS = [
  { href: '/', icon: Map, label: 'Map' },
  { href: '/saved', icon: Heart, label: 'Collections' },
  { href: '/for-you', icon: Sparkles, label: 'Insights' },
] as const;

interface NavButtonProps {
  active: boolean;
  icon: typeof Map;
  label: string;
  onClick: () => void;
}

function NavButton({ active, icon: Icon, label, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex w-[72px] flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 transition-colors',
        active
          ? 'bg-[var(--color-brand-surface)] text-[var(--color-brand-600)]'
          : 'text-[#64748B] hover:bg-[#F3F4F6] hover:text-[#334155]'
      )}
    >
      <Icon size={24} strokeWidth={active ? 2.25 : 1.9} />
      <span className={cn('type-micro leading-none', active ? 'text-[var(--color-brand-700)]' : 'text-[#64748B]')}>
        {label}
      </span>
    </button>
  );
}

export default function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '/map' : pathname.startsWith(href);

  return (
    <aside className="relative z-[80] hidden h-full w-[84px] shrink-0 border-r border-[#F1F3F5] bg-white lg:flex lg:flex-col lg:items-center lg:py-5">
      <button
        type="button"
        onClick={() => router.push('/')}
        className="relative -mt-1 flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-75"
        aria-label="Zoocasa home"
      >
        <span className="relative h-4 w-9">
          <Image src="/icons/zoocasa-vector.svg" alt="Zoocasa" fill sizes="36px" className="object-contain" priority />
        </span>
      </button>

      <nav className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-6">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          if (label === 'Collections') {
            return (
              <DesktopSidebarCollectionsNav
                key={href}
                active={active}
                onClick={() => router.push(href)}
              />
            );
          }
          return (
            <NavButton
              key={href}
              active={active}
              icon={Icon}
              label={label}
              onClick={() => router.push(href)}
            />
          );
        })}
      </nav>

      <div
        className="relative mt-auto flex flex-col items-center gap-3"
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => {
          setShowMenu(false);
          setHoveredMenu(null);
        }}
      >
        <NavButton
          active={showMenu}
          icon={Menu}
          label="Menu"
          onClick={() => setShowMenu(true)}
        />
        {showMenu && (
          <div
            className="absolute bottom-0 left-[3.75rem] z-50 w-72 overflow-visible rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]"
            onMouseLeave={() => setHoveredMenu(null)}
          >
            {MENU_ITEMS.map((item) => (
              <div key={item.label} className="relative">
                <ActionRow
                  size="md"
                  className="font-normal"
                  onMouseEnter={() => setHoveredMenu(item.sections ? item.label : null)}
                  onFocus={() => setHoveredMenu(item.sections ? item.label : null)}
                  aria-expanded={item.sections ? hoveredMenu === item.label : undefined}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F7]">
                    <item.icon size={15} className="text-[#0F1729]" />
                  </div>
                  <span className="flex-1 type-heading-sm text-[#0F1729]">{item.label}</span>
                  {item.sections && <ChevronDown size={15} className="-rotate-90" />}
                </ActionRow>
                {item.sections && hoveredMenu === item.label && (
                  <div
                    className="absolute left-[calc(100%+0.25rem)] top-0 z-50 w-72 rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)] before:absolute before:-left-2 before:top-0 before:h-full before:w-2 before:content-['']"
                    onMouseEnter={() => setHoveredMenu(item.label)}
                  >
                    {item.sections.map((section, sectionIndex) => (
                      <div key={`${item.label}-${sectionIndex}`} className={cn(sectionIndex > 0 && 'mt-1')}>
                        {section.map((child) => (
                          <ActionRow key={child} size="md" className="font-normal">
                            <span className="type-body font-medium text-[#0F1729]">{child}</span>
                          </ActionRow>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <ActionRow size="md" className="mt-1 font-normal">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#F8D8C8,#D9EEF6_55%,#EAE4FF)] type-caption font-semibold text-[var(--color-text-primary)]">
                JZ
              </div>
              <span className="flex-1 type-heading-sm text-[#0F1729]">Profile</span>
            </ActionRow>
            <ActionRow tone="danger" size="md" className="mt-1 font-normal">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <LogOut size={15} className="text-[var(--color-accent)]" />
              </div>
              <span className="type-heading-sm flex-1 text-[var(--color-accent)]">Sign Out</span>
            </ActionRow>
          </div>
        )}
      </div>
    </aside>
  );
}

function DesktopSidebarCollectionsNav({ active, onClick }: { active: boolean; onClick: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collectionMenuState, setCollectionMenuState] = useState<{ collectionId: string; right: number; bottom: number } | null>(null);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renameCollectionName, setRenameCollectionName] = useState('');
  const [confirmDeleteCollectionId, setConfirmDeleteCollectionId] = useState<string | null>(null);
  const { collections, createCollection, renameCollection, deleteCollection } = useSavedStore();

  const closeCollectionMenu = () => {
    setCollectionMenuState(null);
    setConfirmDeleteCollectionId(null);
  };

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
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <NavButton active={active} icon={Heart} label="Collections" onClick={onClick} />
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
          placement="side-center"
        />
      )}
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
            const activeCollection = collections.find((collection) => collection.id === collectionMenuState.collectionId);
            if (activeCollection) startCollectionRename(activeCollection.id, activeCollection.name);
          }}
          onRequestDelete={() => setConfirmDeleteCollectionId(collectionMenuState.collectionId)}
          onCancelDelete={() => setConfirmDeleteCollectionId(null)}
          onConfirmDelete={confirmDeleteCollection}
        />
      )}
    </div>
  );
}
