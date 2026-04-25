export function getPrimaryLocationLabel(name: string) {
  return name.split(',')[0]?.trim() || name;
}
