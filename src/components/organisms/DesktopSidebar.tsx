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
        className="mt-0 flex h-11 w-11 items-center justify-center text-[2.1rem] font-heading font-semibold leading-none tracking-[-0.06em] text-[#0F1729]"
        aria-label="Homes"
      >
        h.
      </button>

      <nav className="mt-[18.5rem] flex flex-col items-center gap-7">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              aria-label={label}
              className={cn(
                'flex w-[58px] flex-col items-center gap-1.5 rounded-2xl py-1 transition-colors',
                active ? 'text-[#0F1729]' : 'text-[#C9CDD2] hover:text-[#6B7280]'
              )}
            >
              <Icon size={24} strokeWidth={active ? 2.25 : 1.9} />
              <span className={cn('text-[0.68rem] font-medium leading-none', active ? 'text-[#0F1729]' : 'text-[#C9CDD2]')}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="relative mt-auto">
        <button
          type="button"
          onClick={() => setShowMenu((value) => !value)}
          aria-label="Menu"
          className={cn(
            'flex w-[58px] flex-col items-center gap-1.5 rounded-2xl py-1 transition-colors',
            showMenu ? 'text-[#0F1729]' : 'text-[#C9CDD2] hover:text-[#6B7280]'
          )}
        >
          <Menu size={24} strokeWidth={2} />
          <span className={cn('text-[0.68rem] font-medium leading-none', showMenu ? 'text-[#0F1729]' : 'text-[#C9CDD2]')}>
            Menu
          </span>
        </button>
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
