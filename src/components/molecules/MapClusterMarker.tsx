'use client';
import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './MapClusterMarker.module.css';

interface MapClusterMarkerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  count: number;
  highlighted?: boolean;
}

export default function MapClusterMarker({
  count,
  highlighted = false,
  className,
  type = 'button',
  ...props
}: MapClusterMarkerProps) {
  return (
    <button
      type={type}
      className={cn(styles.clusterMarker, highlighted && styles.highlighted, className)}
      {...props}
    >
      {count}
    </button>
  );
}
