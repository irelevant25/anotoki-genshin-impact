import { Component, computed, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartDataItem, ChartLegendPosition } from '../chart.types';

type ChartTextContent = 'value' | 'label' | 'percent';

export class ChartPieConfig {
  size: number = 200;
  innerRadiusRatio: number = 0.55;
  textCenter: string = '';
  textCenterClass: string = '';
  showLegend: boolean = true;
  legendClass: string = '';
  legendContent: ChartTextContent[] | ((item: ChartDataItem) => string) = ['label', 'value', 'percent'];
  legendContentClass: string = '';
  legendPosition: ChartLegendPosition = 'bottom';

  constructor(config?: Partial<ChartPieConfig>) {
    Object.assign(this, config);
  }
}

interface PieSegment {
  path: string;
  percent: number;
  percentDecimal?: number;
  item: ChartDataItem;
}

@Component({
  selector: 'app-chart-pie',
  imports: [CommonModule],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss',
})
export class ChartPieComponent {
  data = model<ChartDataItem[]>([]);
  config = model<ChartPieConfig>(new ChartPieConfig());

  private _decimalPlaces: number = 1;

  protected segments = computed<PieSegment[]>(() => {
    const data = this.data();
    if (!data.length) {
      return [];
    }

    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) {
      return [];
    }

    const svgCenter = this.config().size / 2;
    const outerRadius = this.config().size / 2 - 4;
    const innerRadius = outerRadius * this.config().innerRadiusRatio;

    const cx = svgCenter;
    const cy = svgCenter;
    const R = outerRadius;
    const r = innerRadius;

    let startAngle = -Math.PI / 2; // 90 degrees

    const result = data.map((item, i) => {
      const fraction = item.value / total;
      const angle = fraction * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const largeArc = angle > Math.PI ? 1 : 0;

      const cos0 = Math.cos(startAngle);
      const sin0 = Math.sin(startAngle);
      const cos1 = Math.cos(endAngle);
      const sin1 = Math.sin(endAngle);

      // Outer arc points
      const ox0 = cx + R * cos0;
      const oy0 = cy + R * sin0;
      const ox1 = cx + R * cos1;
      const oy1 = cy + R * sin1;

      // Inner arc points (traversed in reverse)
      const ix0 = cx + r * cos0;
      const iy0 = cy + r * sin0;
      const ix1 = cx + r * cos1;
      const iy1 = cy + r * sin1;

      // SVG arc path for a doughnut segment
      const path = `M ${ox0} ${oy0} ` + `A ${R} ${R} 0 ${largeArc} 1 ${ox1} ${oy1} ` + `L ${ix1} ${iy1} ` + `A ${r} ${r} 0 ${largeArc} 0 ${ix0} ${iy0} ` + `Z`;

      startAngle = endAngle;

      const percent = Math.round(fraction * 1000) / 10;

      return {
        path,
        percent,
        percentDecimal: percent.toString().split('.')[1]?.length,
        item,
      };
    });

    let decimalPlaces = 0;
    result.forEach((r) => {
      decimalPlaces = Math.max(decimalPlaces, r.percentDecimal ?? 0);
    });
    this._decimalPlaces = decimalPlaces;

    return result;
  });

  protected getText(segment: PieSegment): string {
    const item = segment.item;
    const type = this.config().legendContent;
    let result = '';

    if (typeof type === 'function') {
      result += type(item);
    }
    if (Array.isArray(type)) {
      type.forEach((t) => {
        if (t === 'value') {
          result += `<span class="legend-value">${String(item.value)}</span>`;
        }
        if (t === 'label') {
          result += `<span class="legend-label">${item.label}</span>`;
        }
        if (t === 'percent') {
          result += `<span class="legend-percent">${segment.percent.toFixed(this._decimalPlaces)}%</span>`;
        }
      });
    }
    return result;
  }
}
