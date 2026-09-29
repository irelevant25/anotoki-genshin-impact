import { Component, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartDataItem, ChartLegendPosition, ChartTextContent, getTextContent } from '../chart.types';

export class ChartBarVerticalConfig {
  textAbove: ChartTextContent | ((item: ChartDataItem) => string) = 'none';
  textAboveClass = '';
  textInside: ChartTextContent | ((item: ChartDataItem) => string) = 'none';
  textInsideClass = '';
  textUnder: ChartTextContent | ((item: ChartDataItem) => string) = 'none';
  textUnderClass = '';
  showLegend = true;
  legendPosition: ChartLegendPosition = 'bottom';
  maxValue = 100;
  chartHeight = 200;
  barRadius = 4;
  trackColor = '';

  constructor(config?: Partial<ChartBarVerticalConfig>) {
    Object.assign(this, config);
  }
}

@Component({
  selector: 'app-chart-bar-vertical',
  imports: [CommonModule],
  templateUrl: './bar-vertical.component.html',
  styleUrl: './bar-vertical.component.scss',
})
export class ChartBarVerticalComponent {
  data = model<ChartDataItem[]>([]);
  config = model<ChartBarVerticalConfig>(new ChartBarVerticalConfig());

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
