'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
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

  const go = (direction: 1 | -1) => {
    setIndex((value) => (value + direction + INSIGHTS.length) % INSIGHTS.length);
  };

  return (
    <PageShell>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="px-4 pt-4 lg:pt-6 pb-3 flex-shrink-0">
          <h1 className="font-heading text-2xl text-[#0F1729]">For You</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">Market signals matched to your search patterns.</p>
        </div>

        <div className="flex-1 overflow-hidden px-4 pb-24 pt-4">
          <div className="relative h-full min-h-[420px]">
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
                  className={cn(
                    'absolute inset-x-0 top-0 flex h-[72%] min-h-[360px] flex-col justify-between rounded-[28px] p-6 shadow-[0_12px_32px_rgba(15,23,41,0.10)]',
                    insight.tone
                  )}
                >
                  <div>
                    <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-sm">
                      <TrendingUp size={18} />
                    </div>
                    <p className="font-heading text-3xl leading-tight text-[#0F1729]">{insight.title}</p>
                  </div>
                  <div>
                    <div className="mb-5 flex items-end gap-3">
                      <span className="font-heading text-6xl leading-none text-[#0F1729]">{insight.stat}</span>
                      <span className="pb-2 text-sm font-semibold text-[#6B7280]">{insight.label}</span>
                    </div>
                    <p className="text-base leading-relaxed text-[#4B5563]">{insight.detail}</p>
                  </div>
                </motion.article>
              );
            })}
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2.5">
              <button onClick={() => go(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)]">
                <ArrowLeft size={17} />
              </button>
              <div className="flex items-center gap-1 rounded-full bg-white px-4 shadow-[var(--shadow-control)]">
                {INSIGHTS.map((insight, dotIndex) => (
                  <span
                    key={insight.id}
                    className={cn('h-1.5 rounded-full transition-all', dotIndex === index ? 'w-5 bg-[#0F1729]' : 'w-1.5 bg-[#D1D5DB]')}
                  />
                ))}
              </div>
              <button onClick={() => go(1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0F1729] shadow-[var(--shadow-control)]">
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
