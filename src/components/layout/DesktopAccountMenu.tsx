'use client';
import { Bell, LogOut, MessageSquare, Shield, User } from 'lucide-react';
import ActionRow from '@/components/ui/ActionRow';

const MENU_ITEMS = [
  { icon: User, label: 'Profile' },
  { icon: Bell, label: 'Notification Preference' },
  { icon: Shield, label: 'Privacy & Security' },
  { icon: MessageSquare, label: 'Send Feedback' },
];

export default function DesktopAccountMenu() {
  return (
    <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-3xl bg-white p-2 shadow-[0_14px_40px_rgba(15,23,41,0.16)]">
      {MENU_ITEMS.map((item) => (
        <DesktopMenuItem key={item.label} icon={item.icon} label={item.label} />
      ))}
      <ActionRow tone="danger" size="md" className="mt-1 font-normal">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <LogOut size={15} className="text-[var(--color-accent)]" />
        </div>
        <span className="type-label flex-1 text-[var(--color-accent)]">Sign Out</span>
      </ActionRow>
    </div>
  );
}

function DesktopMenuItem({ icon: Icon, label }: { icon: (typeof MENU_ITEMS)[number]['icon']; label: string }) {
  return (
    <ActionRow size="md" className="font-normal">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)]">
        <Icon size={15} className="text-[var(--color-text-primary)]" />
      </div>
      <span className="type-label flex-1 text-[var(--color-text-primary)]">{label}</span>
    </ActionRow>
  );
}
