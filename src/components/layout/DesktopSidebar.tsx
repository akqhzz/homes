'use client';
import Image from 'next/image';
import { Accessibility, Briefcase, ChevronDown, ChevronLeft, DollarSign, Heart, Home, KeyRound, LogOut, Mail, Map, Menu, Newspaper, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import ActionRow from '@/components/ui/ActionRow';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/store/uiStore';

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
  const { isDesktopSidebarCollapsed, setDesktopSidebarCollapsed } = useUIStore();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '/map' : pathname.startsWith(href);

  if (isDesktopSidebarCollapsed) return null;

  return (
    <aside className="relative hidden h-full w-[84px] shrink-0 border-r border-[#F1F3F5] bg-white lg:flex lg:flex-col lg:items-center lg:py-5">
      <Button
        variant="ghost"
        shape="circle"
        size="control"
        type="button"
        onClick={() => setDesktopSidebarCollapsed(true)}
        className="group relative mt-0 hover:bg-transparent"
        aria-label="Collapse sidebar"
      >
        <span className="relative h-4 w-9 transition-opacity group-hover:opacity-0">
          <Image src="/icons/zoocasa-vector.svg" alt="Zoocasa" fill sizes="36px" className="object-contain" priority />
        </span>
        <ChevronLeft
          size={18}
          className="absolute opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </Button>

      <nav className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-6">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
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
      >
        <NavButton
          active={showMenu}
          icon={Menu}
          label="Menu"
          onClick={() => setShowMenu((value) => !value)}
        />
        {showMenu && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
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
                    <span className="flex-1 type-body font-medium text-[#0F1729]">{item.label}</span>
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
                <span className="flex-1 type-body font-medium text-[#0F1729]">Profile</span>
              </ActionRow>
              <ActionRow tone="danger" size="md" className="mt-1 font-normal">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <LogOut size={15} className="text-[var(--color-accent)]" />
                </div>
                <span className="type-label flex-1 text-[var(--color-accent)]">Sign Out</span>
              </ActionRow>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
