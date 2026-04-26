'use client';
import { Bell, Heart, LogOut, Map, Menu, MessageSquare, Shield, Sparkles, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

const MENU_ITEMS = [
  { icon: User, label: 'Profile' },
  { icon: Bell, label: 'Notification Preference' },
  { icon: Shield, label: 'Privacy & Security' },
  { icon: MessageSquare, label: 'Send Feedback' },
];

const NAV_ITEMS = [
  { href: '/', icon: Map, label: 'Map' },
  { href: '/saved', icon: Heart, label: 'Mine' },
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
        'flex w-[62px] flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 transition-colors',
        active
          ? 'bg-[var(--color-brand-surface)] text-[var(--color-brand-600)]'
          : 'text-[#64748B] hover:bg-[#F3F4F6] hover:text-[#334155]'
      )}
    >
      <Icon size={24} strokeWidth={active ? 2.25 : 1.9} />
      <span className={cn('text-[0.68rem] font-medium leading-none', active ? 'text-[var(--color-brand-700)]' : 'text-[#64748B]')}>
        {label}
      </span>
    </button>
  );
}

export default function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '/map' : pathname.startsWith(href);

  return (
    <aside className="hidden h-full w-[84px] shrink-0 border-r border-[#F1F3F5] bg-white lg:flex lg:flex-col lg:items-center lg:py-5">
      <button
        type="button"
        onClick={() => router.push('/')}
        className="type-title-lg mt-0 flex h-11 w-11 items-center justify-center leading-none tracking-[-0.06em] text-[var(--color-text-primary)]"
        aria-label="Homes"
      >
        h.
      </button>

      <nav className="mt-[18.5rem] flex flex-col items-center gap-6">
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

      <div className="relative mt-auto">
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
            <div className="absolute bottom-0 left-[3.75rem] z-50 w-72 overflow-hidden rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
              {MENU_ITEMS.map((item) => (
                <button key={item.label} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#F5F6F7]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F7]">
                    <item.icon size={15} className="text-[#0F1729]" />
                  </div>
                  <span className="flex-1 type-body font-medium text-[#0F1729]">{item.label}</span>
                </button>
              ))}
              <button className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-red-50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <LogOut size={15} className="text-[#EF4444]" />
                </div>
                <span className="flex-1 type-body font-medium text-[#EF4444]">Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
