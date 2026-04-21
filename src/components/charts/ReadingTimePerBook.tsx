import { useEffect, useRef } from 'react';
import type { Chart as ChartJS } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatDuration, formatDurationExactHM, msToHours } from '../../data';
import type { BookStats } from '../../types';
import {
  getSharedChartInteraction,
  getSharedTooltip,
  removeChartTooltipForChart,
  setChartPointerCursor,
  useChartTheme,
} from './chartTheme';

interface Props {
  books: BookStats[];
  onBookSelect: (bookId: string) => void;
}

export function ReadingTimePerBook({ books, onBookSelect }: Props) {
  const { textColor, gridColor, fontFamily, tooltipBg, tooltipText, tooltipBorder } = useChartTheme();
  const chartRef = useRef<ChartJS<'bar'> | null>(null);
  const top = books.slice(0, 15);
  const totalMs = top.reduce((acc, book) => acc + book.totalReadingMs, 0);
  const topBook = top[0];

  useEffect(() => () => {
    if (chartRef.current) {
      removeChartTooltipForChart(chartRef.current);
    }
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
    interaction: { mode: 'nearest' as const, intersect: false, axis: 'y' as const },
    hover: { mode: 'nearest' as const, intersect: false, axis: 'y' as const },
    onHover: setChartPointerCursor,
    onClick: (event: any, elements: any[], chart: any) => {
      const resolvedElements = elements.length > 0
        ? elements
        : chart.getElementsAtEventForMode(
          event.native ?? event,
          'nearest',
          { intersect: false, axis: 'y' },
          true,
        );
      const first = resolvedElements[0];
      if (!first) return;
      const book = top[first.index];
      if (!book) return;
      removeChartTooltipForChart(chart);
      onBookSelect(book.id);
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...getSharedTooltip(tooltipBg, tooltipText, tooltipBorder, fontFamily),
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
        <Bar ref={chartRef} key={chartRenderKey} data={data} options={options} redraw />
      </div>
      {topBook && (
        <p className="chart-insight">
          Top book: <strong>{topBook.name}</strong> ({formatDuration(topBook.totalReadingMs)})
        </p>
      )}
    </>
  );
}
