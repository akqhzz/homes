'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Accessibility, Briefcase, ChevronDown, ChevronUp, DollarSign, Home, KeyRound, LogOut, Mail, Map, Newspaper } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
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
  {
    icon: Briefcase,
    label: 'Careers',
    sections: [['Headquarters', 'Agents', 'About Us']],
  },
  { icon: Accessibility, label: 'Accessibility' },
  { icon: Map, label: 'Sitemap' },
];

export default function MenuPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <PageShell>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="flex-shrink-0 bg-white px-4 pt-4 pb-0">
          <div className="mb-1 flex items-center justify-center">
            <div className="relative h-[22px] w-32">
              <Image src="/icons/zoocasa-black.svg" alt="Zoocasa" fill sizes="128px" className="object-contain" priority />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-2.5 pb-24 pt-5">
          <div className="mx-auto max-w-sm">
            {MENU_ITEMS.map((item) => (
              <div key={item.label}>
                <ActionRow
                  size="md"
                  className="font-normal"
                  onClick={() => {
                    if (!item.sections) return;
                    setOpenMenu((value) => (value === item.label ? null : item.label));
                  }}
                  aria-expanded={item.sections ? openMenu === item.label : undefined}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)]">
                    <item.icon size={15} className="text-[var(--color-text-primary)]" />
                  </div>
                  <span className="type-label flex-1 text-[var(--color-text-primary)]">{item.label}</span>
                  {item.sections && (openMenu === item.label ? <ChevronUp size={15} /> : <ChevronDown size={15} />)}
                </ActionRow>
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
        </div>
      </div>
    </PageShell>
  );
}
