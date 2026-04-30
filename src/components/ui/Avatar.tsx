import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden bg-[#E5E7EB] flex items-center justify-center flex-shrink-0',
        {
          'w-6 h-6 text-xs': size === 'sm',
          'w-8 h-8 text-sm': size === 'md',
          'w-10 h-10 text-base': size === 'lg',
        },
        className
      )}
    >
      {src ? (
        <Image src={src} alt={name} width={40} height={40} className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium text-[#6B7280]">{initials}</span>
      )}
    </div>
  );
}
