'use client';
import { TrendingDown, Home, Search } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import ActionRow from '@/components/ui/ActionRow';
import Button from '@/components/ui/Button';

const NOTIFICATIONS = [
  {
    id: '1',
    icon: <TrendingDown size={15} className="text-green-600" />,
    bg: 'bg-green-50',
    title: 'Price drop alert',
    body: '210 Victoria St Unit 1502 dropped to $828,000 (was $875,000)',
    time: '2h ago',
    unread: true,
  },
  {
    id: '2',
    icon: <Home size={15} className="text-blue-600" />,
    bg: 'bg-blue-50',
    title: '15 new listings in Toronto Downtown',
    body: 'New listings match your saved search criteria.',
    time: '4h ago',
    unread: true,
  },
  {
    id: '3',
    icon: <Search size={15} className="text-purple-600" />,
    bg: 'bg-purple-50',
    title: 'Annex Houses — 4 new matches',
    body: 'New homes matching "Annex Houses" have been listed.',
    time: 'Yesterday',
    unread: false,
  },
];

export default function NotificationsPage() {
  return (
    <PageShell>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="px-4 pt-4 lg:pt-6 pb-5 flex-shrink-0 border-b border-[#F5F6F7]">
          <div className="flex items-center justify-between">
            <h1 className="type-title text-[#0F1729]">Alerts</h1>
            <Button variant="ghost" size="sm" className="type-body font-medium text-[#9CA3AF] hover:text-[#0F1729]">
              Mark all read
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-24">
          {NOTIFICATIONS.map((n) => (
            <ActionRow
              key={n.id}
              size="md"
              leading={
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${n.bg}`}>
                  {n.icon}
                </div>
              }
              className="items-start rounded-none border-b border-[#F5F6F7] px-4 py-4 font-normal hover:bg-[#FAFAFA]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="type-label text-[#0F1729] leading-snug">{n.title}</p>
                  {n.unread && <div className="w-2 h-2 rounded-full bg-[#0F1729] flex-shrink-0 mt-1.5" />}
                </div>
                <p className="type-body text-[#6B7280] mt-0.5 leading-relaxed">{n.body}</p>
                <p className="type-caption text-[#9CA3AF] mt-1.5">{n.time}</p>
              </div>
            </ActionRow>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
