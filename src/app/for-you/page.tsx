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

  const go = (direction: 1 | -1) => {
    setIndex((value) => (value + direction + INSIGHTS.length) % INSIGHTS.length);
  };

  return (
    <PageShell>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        <div className="flex-shrink-0 px-4 pt-4 pb-0">
          <div className="mb-1 flex items-center justify-center">
            <h1 className="type-title text-[#0F1729]">For You</h1>
          </div>
        </div>

        <div className="flex flex-1 items-center overflow-hidden px-4 pb-24">
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
      </div>
    </PageShell>
  );
}
