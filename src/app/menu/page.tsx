'use client';
import { Bell, ChevronRight, LogOut, MessageSquare, Shield, User } from 'lucide-react';
import PageShell from '@/components/templates/PageShell';

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
            <h1 className="type-title text-[#0F1729]">homes</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          <div className="px-4 py-4">
            <div className="overflow-hidden rounded-2xl bg-[#F5F6F7]">
              {MENU_ITEMS.map((item, i) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#EBEBEB] transition-colors ${
                    i < MENU_ITEMS.length - 1 ? 'border-b border-white' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                    <item.icon size={15} className="text-[#0F1729]" />
                  </div>
                  <span className="flex-1 type-body font-medium text-[#0F1729]">{item.label}</span>
                  <ChevronRight size={15} className="text-[#D1D5DB]" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-4">
            <button className="w-full flex items-center gap-3 rounded-2xl bg-[#F5F6F7] px-4 py-3.5 text-left transition-colors hover:bg-red-50">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                <LogOut size={15} className="text-[#EF4444]" />
              </div>
              <span className="flex-1 type-body font-medium text-[#EF4444]">Sign Out</span>
              <ChevronRight size={15} className="text-[#FCA5A5]" />
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
