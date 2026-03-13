import { Component, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartDataItem, ChartTextContent, getTextContent } from '../chart.types';

export class ChartBarHorizontalConfig {
  textAbove: ChartTextContent | ((item: ChartDataItem) => string) = 'none';
  textAboveClass = '';
  textUnder: ChartTextContent | ((item: ChartDataItem) => string) = 'none';
  textUnderClass = '';
  showLegend = true;
  legendPosition: 'top' | 'bottom' = 'bottom';
  fillValue: ChartTextContent | ((item: ChartDataItem) => string) = 'none';
  fillValueClass = '';
  emptyValue: ChartTextContent | ((item: ChartDataItem) => string) = 'none';
  emptyValueClass = '';
  maxValue = 100;
  barHeight = 20;
  barRadius = 4;
  barGap = 6;
  trackColor = '';
  emptyColor = 'var(--bg-hover)';

  constructor(config?: Partial<ChartBarHorizontalConfig>) {
    Object.assign(this, config);
  }
}

@Component({
  selector: 'app-chart-bar-horizontal',
  imports: [CommonModule],
  templateUrl: './bar-horizontal.component.html',
  styleUrl: './bar-horizontal.component.scss',
})
export class ChartBarHorizontalComponent {
  data = model<ChartDataItem[]>([]);
  config = model<ChartBarHorizontalConfig>(new ChartBarHorizontalConfig());

  protected getText(item: ChartDataItem, type: ChartTextContent | ((item: ChartDataItem) => string)): string {
    if (typeof type === 'function') {
      return type(item);
    }
    if (type === 'remaining') {
      return (this.config().maxValue - item.value).toString();
    }
    return getTextContent(item, type);
  }
}
