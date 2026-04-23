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
        <div className="px-5 pt-5 pb-4 flex-shrink-0 border-b border-[#F5F6F7]">
          <p className="font-heading text-xl text-[#0F1729]">homes</p>
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
                  <span className="flex-1 text-sm font-medium text-[#0F1729]">{item.label}</span>
                  <ChevronRight size={15} className="text-[#D1D5DB]" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-4">
            <button className="w-full flex items-center justify-center gap-2 py-4 text-[#EF4444] font-medium text-sm hover:bg-red-50 rounded-2xl transition-colors">
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
