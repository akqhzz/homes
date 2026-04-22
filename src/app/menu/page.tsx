'use client';
import { User, Settings, HelpCircle, Star, Bell, Shield, CreditCard, ChevronRight, LogOut } from 'lucide-react';
import PageShell from '@/components/templates/PageShell';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile' },
      { icon: Bell, label: 'Notification Preferences', badge: '3 new' },
      { icon: Shield, label: 'Privacy & Security' },
      { icon: CreditCard, label: 'Subscription', badge: 'Free' },
    ],
  },
  {
    title: 'More',
    items: [
      { icon: Star, label: 'Rate the App' },
      { icon: HelpCircle, label: 'Help & Support' },
      { icon: Settings, label: 'Settings' },
    ],
  },
];

export default function MenuPage() {
  return (
    <PageShell>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="px-4 pt-12 lg:pt-6 pb-6 flex-shrink-0 border-b border-[#F5F6F7]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0F1729] to-[#4B5EC6] flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">Y</span>
            </div>
            <div>
              <p className="text-xl font-black text-[#0F1729]">Yunjie</p>
              <p className="text-sm text-[#9CA3AF] mt-0.5">Free Plan · GTA</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-28">
          {MENU_SECTIONS.map((section) => (
            <div key={section.title} className="px-4 py-4">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3 px-1">
                {section.title}
              </p>
              <div className="bg-[#F5F6F7] rounded-2xl overflow-hidden">
                {section.items.map((item, i) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#EBEBEB] transition-colors ${
                      i < section.items.length - 1 ? 'border-b border-white' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                      <item.icon size={15} className="text-[#0F1729]" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-[#0F1729]">{item.label}</span>
                    {'badge' in item && item.badge && (
                      <span className="text-xs bg-[#0F1729] text-white px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={15} className="text-[#D1D5DB]" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="px-4 pb-4">
            <button className="w-full flex items-center justify-center gap-2 py-4 text-[#EF4444] font-medium text-sm hover:bg-red-50 rounded-2xl transition-colors">
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
          <p className="text-center text-xs text-[#9CA3AF] pb-4">Version 1.0.0 · GTA Edition</p>
        </div>
      </div>
    </PageShell>
  );
}
