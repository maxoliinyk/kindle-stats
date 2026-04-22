import { useMemo } from 'react';
import type { TooltipOptions } from 'chart.js';
import { useAppearance } from '../../hooks/useAppearance';

export const CHART_COLORS_MODERN = [
  'rgba(10, 132, 255, 0.8)',    // blue
  'rgba(48, 209, 88, 0.8)',     // green
  'rgba(255, 159, 10, 0.8)',    // orange
  'rgba(191, 82, 242, 0.8)',    // purple
  'rgba(255, 69, 58, 0.8)',     // red
  'rgba(100, 210, 255, 0.8)',   // cyan
  'rgba(255, 214, 10, 0.8)',    // yellow
  'rgba(172, 142, 104, 0.8)',   // brown
];

const KINDLE_PALETTES: Record<string, string[]> = {
  paper: [
    '#8A5A2B',
    '#D4A14A',
    '#5D340C',
    '#C07A3A',
    '#7A5530',
    '#E7C988',
    '#3E2912',
    '#A66B22',
  ],
  sepia: [
    '#7A4C1F',
    '#B88549',
    '#3E1E0B',
    '#A36433',
    '#5A2E11',
    '#D8B87A',
    '#2A1609',
    '#854E1C',
  ],
  night: [
    '#DDB47A',
    '#C89A5A',
    '#F2CE86',
    '#A47A42',
    '#7B5A2B',
    '#E7BB70',
    '#4A3A1F',
    '#9F6E33',
  ],
};

export function getKindlePalette(mode: string): string[] {
  return KINDLE_PALETTES[mode] ?? KINDLE_PALETTES.paper;
}

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function useChartTheme() {
  const { skin, mode } = useAppearance();

  return useMemo(() => {
    const isKindle = skin === 'kindle';
    const textColor = readVar('--chart-text', isKindle ? '#5A4E3F' : '#8e8e93');
    const gridColor = readVar('--chart-grid', isKindle ? 'rgba(27,23,20,0.08)' : 'rgba(0,0,0,0.06)');
    const accent = readVar('--accent', isKindle ? '#8A5A2B' : '#0A84FF');
    const textPrimary = readVar('--text-primary', isKindle ? '#1B1714' : '#1d1d1f');
    const bgCard = readVar('--bg-card', isKindle ? '#FBF5E3' : '#ffffff');
    const border = readVar('--border-strong', 'rgba(0,0,0,0.15)');
    const fontFamily = readVar('--font-ui', isKindle ? "'Literata', Georgia, serif" : "'Inter', sans-serif");

    const palette = isKindle
      ? getKindlePalette(mode)
      : CHART_COLORS_MODERN;

    const tooltipBg = isKindle ? bgCard : (mode === 'dark' ? 'rgba(28, 28, 30, 0.94)' : 'rgba(255, 255, 255, 0.98)');
    const tooltipText = textPrimary;
    const tooltipBorder = isKindle ? border : (mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.15)');
    const tooltipRadius = isKindle ? 0 : 8;

    return {
      skin,
      palette,
      textColor,
      gridColor,
      accent,
      bgCard,
      fontFamily,
      tooltipBg,
      tooltipText,
      tooltipBorder,
      tooltipRadius,
    };
  }, [skin, mode]);
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
  cornerRadius: number = 8,
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
    cornerRadius,
    titleFont: { family: fontFamily, weight: 600, size: 12 },
    bodyFont: { family: fontFamily, size: 12 },
    padding: 10,
    boxPadding: 4,
    usePointStyle: true,
    footerColor: textColor,
    footerFont: { family: fontFamily, size: 11 },
  };
}

export const CHART_COLORS = CHART_COLORS_MODERN;
