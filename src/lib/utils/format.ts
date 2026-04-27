export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(2)}M`;
  }
  if (price >= 1_000) {
    const k = price / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`;
  }
  return `$${price.toLocaleString()}`;
}

export function formatPriceFull(price: number): string {
  return `$${price.toLocaleString('en-CA')}`;
}

export function formatDaysOnMarket(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function formatSqft(sqft: number): string {
  return sqft.toLocaleString();
}

export function formatPropertyType(type: string): string {
  const map: Record<string, string> = {
    condo: 'Condo',
    house: 'House',
    townhouse: 'Townhouse',
    'semi-detached': 'Semi-Detached',
    detached: 'Detached',
  };
  return map[type] ?? type;
}

export function formatAvgPrice(price: number): string {
  if (price >= 1_000_000) {
    return `Avg. $${(price / 1_000_000).toFixed(2)}M`;
  }
  return `Avg. $${Math.round(price / 1000)}K`;
}
