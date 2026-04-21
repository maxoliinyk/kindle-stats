import { useMemo } from 'react';
import type { TooltipOptions } from 'chart.js';
import { useTheme } from '../../hooks/useTheme';

// Use CSS custom properties for chart colors
export function useChartTheme() {
  const { resolved } = useTheme();

  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    const isDark = resolved === 'dark';
    return {
      textColor: style.getPropertyValue('--chart-text').trim() || '#8e8e93',
      gridColor: style.getPropertyValue('--chart-grid').trim() || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
      accent: style.getPropertyValue('--accent').trim() || (isDark ? '#0A84FF' : '#007AFF'),
      fontFamily: "'Inter', sans-serif",
      tooltipBg: isDark ? 'rgba(28, 28, 30, 0.94)' : 'rgba(255, 255, 255, 0.98)',
      tooltipText: isDark ? '#f5f5f7' : '#1d1d1f',
      tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.15)',
    };
  }, [resolved]);
}

export function getSharedChartInteraction(mode: 'index' | 'nearest' = 'nearest') {
  return {
    interaction: { mode, intersect: false },
    hover: { mode, intersect: false },
  };
}

function getTooltipElementId(chart: { id: string | number }): string {
  return `chartjs-tooltip-custom-${String(chart.id)}`;
}

export function removeChartTooltipForChart(chart: { id: string | number }): void {
  const tooltipEl = document.getElementById(getTooltipElementId(chart));
  if (!tooltipEl) return;
  tooltipEl.remove();
}

export function setChartPointerCursor(_event: unknown, elements: unknown[], chart: { canvas: { style: { cursor: string } } }) {
  chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
}

export const externalTooltipHandler = (context: any) => {
  const { chart, tooltip } = context;
  const tooltipElementId = getTooltipElementId(chart);
  let tooltipEl = document.getElementById(tooltipElementId);

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = tooltipElementId;
    tooltipEl.className = 'heatmap-cursor-tooltip chart-cursor-tooltip';
    document.body.appendChild(tooltipEl);
  }

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    tooltipEl.style.visibility = 'hidden';
    return;
  }

  if (tooltip.body) {
    const titleLines = tooltip.title || [];
    const bodyLines = tooltip.body.map((b: any) => b.lines);
    const footerLines = tooltip.footer || [];

    let innerHtml = '';

    titleLines.forEach((title: string) => {
      innerHtml += `<span class="heatmap-cursor-tooltip-date">${title}</span>`;
    });

    bodyLines.forEach((body: string[], _i: number) => {
      if (Array.isArray(body)) {
        body.forEach(line => {
          innerHtml += `<span>${line}</span>`;
        });
      } else {
        innerHtml += `<span>${body}</span>`;
      }
    });

    if (footerLines.length > 0) {
      innerHtml += `<div style="height: 4px;"></div>`;
      footerLines.forEach((footer: string) => {
        innerHtml += `<span style="color: var(--text-secondary); opacity: 0.9;">${footer}</span>`;
      });
    }

    tooltipEl.innerHTML = innerHtml;
  }

  const { left: canvasLeft, top: canvasTop } = chart.canvas.getBoundingClientRect();

  tooltipEl.style.opacity = '1';
  tooltipEl.style.visibility = 'visible';
  tooltipEl.style.position = 'fixed';
  tooltipEl.style.pointerEvents = 'none';
  tooltipEl.style.left = canvasLeft + tooltip.caretX + 'px';
  tooltipEl.style.top = canvasTop + tooltip.caretY + 'px';
};

export function getSharedTooltip(
  bgColor: string,
  textColor: string,
  borderColor: string,
  fontFamily: string,
): Partial<TooltipOptions<'bar' | 'line' | 'doughnut'>> {
  return {
    enabled: false,
    external: externalTooltipHandler,
    position: 'nearest',
    backgroundColor: bgColor,
    titleColor: textColor,
    bodyColor: textColor,
    borderColor: borderColor,
    borderWidth: 1,
    displayColors: true,
    cornerRadius: 8,
    titleFont: { family: fontFamily, weight: 600, size: 12 },
    bodyFont: { family: fontFamily, size: 12 },
    padding: 10,
    boxPadding: 4,
    usePointStyle: true,
    footerColor: textColor,
    footerFont: { family: fontFamily, size: 11 },
  };
}

export const CHART_COLORS = [
  'rgba(10, 132, 255, 0.8)',    // blue
  'rgba(48, 209, 88, 0.8)',     // green
  'rgba(255, 159, 10, 0.8)',    // orange
  'rgba(191, 82, 242, 0.8)',    // purple
  'rgba(255, 69, 58, 0.8)',     // red
  'rgba(100, 210, 255, 0.8)',   // cyan
  'rgba(255, 214, 10, 0.8)',    // yellow
  'rgba(172, 142, 104, 0.8)',   // brown
];
