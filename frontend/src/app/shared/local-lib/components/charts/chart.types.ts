export interface ChartDataItem {
  label?: string;
  value: number;
  color: string;
  average?: number; // Optional average value for comparison (to show an additional marker on the bar)
}

export type ChartTextContent = 'value' | 'label' | 'both' | 'remaining' | 'none';
export type ChartLegendPosition = 'top' | 'bottom' | 'left' | 'right';

export function getTextContent(item: ChartDataItem, type: ChartTextContent): string {
  if (type === 'value') {
    return String(item.value);
  }
  if (type === 'label') {
    return item.label ?? '';
  }
  if (type === 'both') {
    return `${item.label}: ${item.value}`;
  }
  return '';
}
