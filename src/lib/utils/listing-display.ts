export function formatSqftCompact(value: number) {
  return String(value);
}

export function formatBedBathSqftLine(
  beds: number,
  baths: number,
  sqft: number,
  options?: {
    separator?: string;
    spacedSqft?: boolean;
  }
) {
  const separator = options?.separator ?? ' · ';
  const sqftLabel = options?.spacedSqft === false ? `${formatSqftCompact(sqft)}sqft` : `${formatSqftCompact(sqft)} sqft`;
  return `${beds}bd${separator}${baths}ba${separator}${sqftLabel}`;
}

export function formatMlsLine(mlsNumber: string, brokerage: string) {
  return `MLS®#${mlsNumber} ${brokerage}`;
}
