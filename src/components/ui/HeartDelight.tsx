'use client';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface HeartDelightProps {
  activeKey: number;
  children: ReactNode;
}

const PARTICLES = [
  { x: -15, y: -20, delay: 0 },
  { x: 0, y: -26, delay: 0.02 },
  { x: 16, y: -18, delay: 0.04 },
  { x: -20, y: -4, delay: 0.06 },
  { x: 20, y: 0, delay: 0.08 },
];

export default function HeartDelight({ activeKey, children }: HeartDelightProps) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <motion.span
        key={`heart-icon-${activeKey}`}
        className="relative z-10 inline-flex"
        animate={activeKey > 0 ? { scale: [1, 1.42, 0.9, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 0.68, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {children}
      </motion.span>
      <AnimatePresence>
        {activeKey > 0 && (
          <motion.span
            key={`heart-burst-${activeKey}`}
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="absolute h-7 w-7 rounded-full border border-[var(--color-accent)]"
              initial={{ scale: 0.35, opacity: 0.5 }}
              animate={{ scale: 1.45, opacity: 0 }}
              transition={{ duration: 0.66, ease: 'easeOut' }}
            />
            {PARTICLES.map((particle, index) => (
              <motion.span
                key={index}
                className="absolute h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: particle.x, y: particle.y, scale: [0.3, 1, 0.4], opacity: [0, 1, 0] }}
                transition={{ duration: 0.7, delay: particle.delay * 1.25, ease: [0.2, 0.7, 0.2, 1] }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
