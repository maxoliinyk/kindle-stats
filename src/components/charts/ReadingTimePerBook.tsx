import { useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { formatDuration, formatDurationExactHM, msToHours } from '../../data';
import type { BookStats } from '../../types';
import { getSharedChartInteraction, getSharedTooltip, useChartTheme } from './chartTheme';

interface Props {
  books: BookStats[];
  onBookSelect: (bookId: string) => void;
}

export function ReadingTimePerBook({ books, onBookSelect }: Props) {
  const { textColor, gridColor, fontFamily, tooltipBg, tooltipText, tooltipBorder } = useChartTheme();
  const top = books.slice(0, 15);
  const totalMs = top.reduce((acc, book) => acc + book.totalReadingMs, 0);
  const topBook = top[0];

  const hideCustomTooltip = () => {
    const tooltipEl = document.getElementById('chartjs-tooltip-custom');
    if (!tooltipEl) return;
    tooltipEl.style.opacity = '0';
    tooltipEl.style.visibility = 'hidden';
    tooltipEl.remove();
  };

  useEffect(() => () => {
    hideCustomTooltip();
  }, []);

  const data = {
    labels: top.map(b => {
      const name = b.name;
      return name.length > 40 ? name.substring(0, 37) + '...' : name;
    }),
    datasets: [{
      data: top.map(b => msToHours(b.totalReadingMs)),
      backgroundColor: 'rgba(10, 132, 255, 0.7)',
      borderColor: 'rgba(10, 132, 255, 1)',
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(10, 132, 255, 0.9)',
      hoverBorderColor: 'rgba(100, 210, 255, 1)',
      hoverBorderWidth: 2,
      borderRadius: 4,
      barThickness: 20,
    }],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    ...getSharedChartInteraction('nearest'),
    interaction: { mode: 'nearest' as const, intersect: true },
    hover: { mode: 'nearest' as const, intersect: true },
    onHover: (event: any, elements: any[], chart: any) => {
      const nativeEvent = event?.native as MouseEvent | undefined;
      if (nativeEvent) {
        chart.$hoverClientX = nativeEvent.clientX;
        chart.$hoverClientY = nativeEvent.clientY;
      }
      chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
    onClick: (_event: unknown, elements: any[]) => {
      const first = elements[0];
      if (!first) return;
      const book = top[first.index];
      if (!book) return;
      hideCustomTooltip();
      onBookSelect(book.id);
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...getSharedTooltip(tooltipBg, tooltipText, tooltipBorder, fontFamily),
        external: (context: any) => {
          const { chart, tooltip } = context;
          let tooltipEl = document.getElementById('chartjs-tooltip-custom');

          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip-custom';
            tooltipEl.className = 'heatmap-cursor-tooltip';
            document.body.appendChild(tooltipEl);
          }

          if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            tooltipEl.style.visibility = 'hidden';
            return;
          }

          const titleLines = tooltip.title || [];
          const bodyLines = tooltip.body?.map((b: any) => b.lines) || [];
          const footerLines = tooltip.footer || [];
          let innerHtml = '';

          titleLines.forEach((title: string) => {
            innerHtml += `<span class="heatmap-cursor-tooltip-date">${title}</span>`;
          });
          bodyLines.forEach((body: string[]) => {
            body.forEach(line => {
              innerHtml += `<span>${line}</span>`;
            });
          });
          if (footerLines.length > 0) {
            innerHtml += `<div style="height: 4px;"></div>`;
            footerLines.forEach((footer: string) => {
              innerHtml += `<span style="color: var(--text-secondary); opacity: 0.9;">${footer}</span>`;
            });
          }

          tooltipEl.innerHTML = innerHtml;
          tooltipEl.style.opacity = '1';
          tooltipEl.style.visibility = 'visible';
          tooltipEl.style.position = 'fixed';
          tooltipEl.style.pointerEvents = 'none';

          const fallback = chart.canvas.getBoundingClientRect();
          const x = chart.$hoverClientX ?? fallback.left + tooltip.caretX;
          const y = chart.$hoverClientY ?? fallback.top + tooltip.caretY;
          tooltipEl.style.left = x + 'px';
          tooltipEl.style.top = y + 'px';
        },
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            return top[idx]?.name ?? '';
          },
          label: (ctx: any) => {
            const book = top[ctx.dataIndex];
            const avgSession = book.sessionCount > 0 ? book.totalReadingMs / book.sessionCount : 0;
            return [
              `Total: ${formatDurationExactHM(book.totalReadingMs)}`,
              `Sessions: ${book.sessionCount}`,
              `Avg session: ${formatDurationExactHM(avgSession)}`,
            ];
          },
          footer: (items: any[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            const book = top[idx];
            if (!book || totalMs === 0) return '';
            return `${Math.round((book.totalReadingMs / totalMs) * 100)}% of top-${top.length} reading time`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: fontFamily } },
        title: { display: true, text: 'Hours', color: textColor, font: { family: fontFamily } },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: textColor,
          font: { family: fontFamily, size: 12 },
        },
      },
    },
  };

  const chartRenderKey = top.map(book => `${book.id}:${book.totalReadingMs}`).join('|');


  return (
    <>
      <div className="chart-container" style={{ height: `${Math.max(300, top.length * 36)}px` }}>
        <Bar key={chartRenderKey} data={data} options={options} redraw />
      </div>
      {topBook && (
        <p className="chart-insight">
          Top book: <strong>{topBook.name}</strong> ({formatDuration(topBook.totalReadingMs)})
        </p>
      )}
    </>
  );
}
