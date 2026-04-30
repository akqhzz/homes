import { formatPrice, formatPriceFull } from '@/lib/utils/format';

interface PriceTextProps {
  price: number;
  className?: string;
  format?: 'compact' | 'full';
}

export default function PriceText({ price, className, format = 'compact' }: PriceTextProps) {
  const label = format === 'full' ? formatPriceFull(price) : formatPrice(price);

  if (!label.startsWith('$')) {
    return <span className={className}>{label}</span>;
  }

  return (
    <span className={className}>
      <span className="price-currency">$</span>
      {label.slice(1)}
    </span>
  );
}
