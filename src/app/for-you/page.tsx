'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import PageShell from '@/components/templates/PageShell';
import { cn } from '@/lib/utils/cn';

const INSIGHTS = [
  {
    id: 'downtown-condos',
    title: 'Downtown condos are taking longer to clear.',
    stat: '+18%',
    label: 'days on market',
    detail: 'Buyers have more room to compare similar units, especially above $900k.',
    tone: 'bg-[#F5F6F7]',
  },
  {
    id: 'west-end',
    title: 'West-end townhomes are still moving quickly.',
    stat: '11',
    label: 'median days',
    detail: 'Low inventory around transit is keeping competition tighter than the broader market.',
    tone: 'bg-[#EEF2F7]',
  },
  {
    id: 'price-band',
    title: 'The strongest demand is below $1.2M.',
    stat: '42%',
    label: 'more saves',
    detail: 'Listings in the starter-family range are seeing the most repeat engagement this week.',
    tone: 'bg-[#F7F4EF]',
  },
];

export default function ForYouPage() {
  const [index, setIndex] = useState(0);
  const activeInsight = INSIGHTS[index];

  const go = (direction: 1 | -1) => {
    setIndex((value) => (value + direction + INSIGHTS.length) % INSIGHTS.length);
  };

  return (
    <PageShell showDesktopHeader={false} desktopWide>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="flex-shrink-0 px-4 pt-4 pb-0 lg:hidden">
          <div className="mb-1 flex items-center justify-center">
            <h1 className="type-title text-[#0F1729]">For You</h1>
          </div>
        </div>

        <div className="flex flex-1 items-center overflow-hidden px-4 pb-24 lg:hidden">
          <div className="relative h-[72%] min-h-[420px] w-full">
            {INSIGHTS.map((insight, cardIndex) => {
              const offset = cardIndex - index;
              const isActive = cardIndex === index;
              return (
                <motion.article
                  key={insight.id}
                  drag={isActive ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -54 || info.velocity.x < -420) go(1);
                    if (info.offset.x > 54 || info.velocity.x > 420) go(-1);
                  }}
                  animate={{
                    x: offset * 18,
                    y: Math.abs(offset) * 12,
                    scale: isActive ? 1 : 0.96,
                    opacity: Math.abs(offset) > 1 ? 0 : 1,
                    zIndex: INSIGHTS.length - Math.abs(offset),
                  }}
                  transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('absolute inset-0 flex flex-col justify-between rounded-[28px] p-6 shadow-[0_12px_32px_rgba(15,23,41,0.10)]', insight.tone)}
                >
                  <div>
                    <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-sm">
                      <TrendingUp size={18} />
                    </div>
                    <p className="type-title-lg text-[#0F1729]">{insight.title}</p>
                  </div>
                  <div>
                    <div className="mb-5 flex items-end gap-3">
                      <span className="type-display text-[#0F1729]">{insight.stat}</span>
                      <span className="pb-2 type-label text-[#6B7280]">{insight.label}</span>
                    </div>
                    <p className="type-body-lg text-[#4B5563]">{insight.detail}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <div className="hidden h-full min-w-0 flex-1 overflow-hidden lg:flex">
          <div className="relative min-h-0 min-w-0 flex-1 self-stretch lg:m-4 lg:mr-2 lg:overflow-hidden lg:rounded-[28px]">
            <div className={cn('flex h-full flex-col justify-between p-10', activeInsight.tone)}>
              <div>
                <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-sm">
                  <TrendingUp size={20} />
                </div>
                <p className="max-w-xl type-title-lg text-[#0F1729]">{activeInsight.title}</p>
              </div>
              <div>
                <div className="mb-5 flex items-end gap-3">
                  <span className="type-display text-[#0F1729]">{activeInsight.stat}</span>
                  <span className="pb-2 type-label text-[#6B7280]">{activeInsight.label}</span>
                </div>
                <p className="max-w-xl type-body-lg text-[#4B5563]">{activeInsight.detail}</p>
              </div>
            </div>
          </div>
          <div className="hidden h-full shrink-0 overflow-hidden lg:block lg:w-[688px] 3xl:w-[1024px]">
            <div className="h-full overflow-y-auto px-4 py-4">
              <div className="grid gap-4">
                {INSIGHTS.map((insight, itemIndex) => (
                  <button
                    key={insight.id}
                    type="button"
                    onClick={() => setIndex(itemIndex)}
                    className={cn(
                      'flex min-h-[164px] flex-col justify-between rounded-[28px] p-6 text-left transition-transform hover:-translate-y-0.5',
                      insight.tone,
                      itemIndex === index && 'ring-1 ring-[#0F1729]/10'
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-sm">
                      <TrendingUp size={17} />
                    </div>
                    <div>
                      <p className="type-title text-[#0F1729]">{insight.title}</p>
                      <div className="mt-4 flex items-end gap-2">
                        <span className="type-heading text-[#0F1729]">{insight.stat}</span>
                        <span className="pb-0.5 type-caption text-[#6B7280]">{insight.label}</span>
                      </div>
                      <p className="mt-3 type-body text-[#4B5563]">{insight.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
