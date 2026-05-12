'use client';
import { useState } from 'react';
import { Accessibility, Briefcase, ChevronDown, ChevronUp, DollarSign, Home, KeyRound, LogOut, Mail, Map, Newspaper } from 'lucide-react';
import ActionRow from '@/components/ui/ActionRow';
import { cn } from '@/lib/utils/cn';

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

export default function DesktopAccountMenu() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div className="absolute right-0 top-12 z-40 max-h-[min(42rem,calc(100vh-5rem))] w-72 overflow-y-auto rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
      {MENU_ITEMS.map((item) => (
        <div key={item.label}>
          <DesktopMenuItem
            icon={item.icon}
            label={item.label}
            open={openMenu === item.label}
            hasChildren={Boolean(item.sections)}
            onClick={() => {
              if (!item.sections) return;
              setOpenMenu((value) => (value === item.label ? null : item.label));
            }}
          />
          {item.sections && openMenu === item.label && (
            <div className="pb-1 pl-11 pr-2">
              {item.sections.map((section, sectionIndex) => (
                <div key={`${item.label}-${sectionIndex}`} className={cn(sectionIndex > 0 && 'mt-1')}>
                  {section.map((child) => (
                    <ActionRow key={child} size="sm" className="px-2 font-normal">
                      <span className="type-body text-[var(--color-text-primary)]">{child}</span>
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
        <span className="type-label flex-1 text-[var(--color-text-primary)]">Profile</span>
      </ActionRow>
      <ActionRow tone="danger" size="md" className="mt-1 font-normal">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <LogOut size={15} className="text-[var(--color-accent)]" />
        </div>
        <span className="type-label flex-1 text-[var(--color-accent)]">Sign Out</span>
      </ActionRow>
    </div>
  );
}

function DesktopMenuItem({
  icon: Icon,
  label,
  hasChildren,
  open,
  onClick,
}: {
  icon: MenuItem['icon'];
  label: string;
  hasChildren?: boolean;
  open?: boolean;
  onClick?: () => void;
}) {
  return (
    <ActionRow size="md" className="font-normal" onClick={onClick} aria-expanded={hasChildren ? open : undefined}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)]">
        <Icon size={15} className="text-[var(--color-text-primary)]" />
      </div>
      <span className="type-label flex-1 text-[var(--color-text-primary)]">{label}</span>
      {hasChildren && (open ? <ChevronUp size={15} /> : <ChevronDown size={15} />)}
    </ActionRow>
  );
}
