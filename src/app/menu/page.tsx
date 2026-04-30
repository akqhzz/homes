'use client';
import { Bell, ChevronRight, LogOut, MessageSquare, Shield, User } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import ActionRow from '@/components/ui/ActionRow';
import { cn } from '@/lib/utils/cn';

const MENU_ITEMS = [
  { icon: User, label: 'Profile' },
  { icon: Bell, label: 'Notification Preference' },
  { icon: Shield, label: 'Privacy & Security' },
  { icon: MessageSquare, label: 'Send Feedback' },
];

export default function MenuPage() {
  return (
    <PageShell>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="flex-shrink-0 px-4 pt-4 pb-0">
          <div className="mb-1 flex items-center justify-center">
            <h1 className="type-title-lg text-[var(--color-text-primary)]">D.</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          <div className="px-4 py-4">
            <div className="overflow-hidden rounded-2xl bg-[var(--color-surface)]">
              {MENU_ITEMS.map((item, i) => (
                <ActionRow
                  key={item.label}
                  size="md"
                  leading={
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
                      <item.icon size={15} className="text-[var(--color-text-primary)]" />
                    </div>
                  }
                  trailing={<ChevronRight size={15} className="text-[#D1D5DB]" />}
                  className={cn(
                    'rounded-none px-4 py-3.5 font-normal hover:bg-[var(--color-surface-hover)]',
                    i < MENU_ITEMS.length - 1 && 'border-b border-white'
                  )}
                >
                  <span className="flex-1 type-body text-[var(--color-text-primary)]">{item.label}</span>
                </ActionRow>
              ))}
            </div>
          </div>

          <div className="px-4">
            <ActionRow
              tone="danger"
              size="md"
              leading={
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
                  <LogOut size={15} className="text-[var(--color-accent)]" />
                </div>
              }
              trailing={<ChevronRight size={15} className="text-[#FCA5A5]" />}
              className="bg-[var(--color-surface)] px-4 py-3.5 font-normal"
            >
              <span className="flex-1 type-body text-[var(--color-accent)]">Sign Out</span>
            </ActionRow>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
