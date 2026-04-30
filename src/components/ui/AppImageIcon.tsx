'use client';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface AppImageIconProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  imageClassName?: string;
}

export default function AppImageIcon({
  src,
  alt,
  size = 20,
  className,
  imageClassName,
}: AppImageIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative block shrink-0 overflow-hidden rounded-[6px]', className)}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} fill sizes={`${size}px`} className={cn('object-cover', imageClassName)} />
    </span>
  );
}
