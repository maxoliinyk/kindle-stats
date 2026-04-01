import { useMemo } from 'react';
import type { TooltipOptions } from 'chart.js';

// Use CSS custom properties for chart colors
export function useChartTheme() {
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      textColor: style.getPropertyValue('--chart-text').trim() || '#8e8e93',
      gridColor: style.getPropertyValue('--chart-grid').trim() || 'rgba(255,255,255,0.06)',
      accent: style.getPropertyValue('--accent').trim() || '#0A84FF',
      accentSecondary: style.getPropertyValue('--accent-secondary').trim() || '#30D158',
      accentTertiary: style.getPropertyValue('--accent-tertiary').trim() || '#FF9F0A',
      accentQuaternary: style.getPropertyValue('--accent-quaternary').trim() || '#BF5AF2',
      fontFamily: "'Inter', sans-serif",
    };
  }, []);
}

export function getSharedChartInteraction(mode: 'index' | 'nearest' = 'nearest') {
  return {
    interaction: { mode, intersect: false },
    hover: { mode, intersect: false },
  };
}

export function getSharedTooltip(
  textColor: string,
  fontFamily: string,
): Partial<TooltipOptions<'bar' | 'line' | 'doughnut'>> {
  return {
    backgroundColor: 'rgba(28, 28, 30, 0.94)',
    titleColor: '#f5f5f7',
    bodyColor: '#f5f5f7',
    borderColor: 'rgba(255, 255, 255, 0.16)',
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
