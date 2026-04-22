import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { formatDurationExactHM, msToHours } from '../../data';
import type { MonthlyReading } from '../../types';
import { useAppearance } from '../../hooks/useAppearance';
import { getSharedChartInteraction, getSharedTooltip, setChartPointerCursor, useChartTheme } from './chartTheme';

interface Props {
  monthly: MonthlyReading[];
}

const KINDLE_MONTHLY_COLORS: Record<string, { bars: string; line: string }> = {
  paper: { bars: '#D4A14A', line: '#5D340C' },
  sepia: { bars: '#B88549', line: '#3E1E0B' },
  night: { bars: '#A47A42', line: '#F2CE86' },
};

export function BooksPerMonth({ monthly }: Props) {
  const { textColor, gridColor, fontFamily, tooltipBg, tooltipText, tooltipBorder, tooltipRadius, accent, skin } = useChartTheme();
  const { mode } = useAppearance();
  const kindleMonthly = KINDLE_MONTHLY_COLORS[mode] ?? KINDLE_MONTHLY_COLORS.paper;
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(Math.max(0, monthly.length - 1));
  const bestMonth = [...monthly].sort((a, b) => b.totalMs - a.totalMs)[0];

  useEffect(() => {
    setSelectedMonthIndex(Math.max(0, monthly.length - 1));
  }, [monthly]);

  const labels = monthly.map(m => {
    const [year, month] = m.month.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Reading Hours',
        data: monthly.map(m => msToHours(m.totalMs)),
        backgroundColor: skin === 'kindle' ? kindleMonthly.bars : 'rgba(10, 132, 255, 0.7)',
        hoverBackgroundColor: skin === 'kindle' ? accent : 'rgba(10, 132, 255, 0.9)',
        hoverBorderColor: skin === 'kindle' ? kindleMonthly.line : 'rgba(100, 210, 255, 1)',
        hoverBorderWidth: 2,
        borderRadius: skin === 'kindle' ? 0 : 4,
        yAxisID: 'y',
        order: 2,
      },
      {
        label: 'Unique Books',
        data: monthly.map(m => m.uniqueBooks),
        type: 'line' as const,
        borderColor: skin === 'kindle' ? kindleMonthly.line : 'rgba(48, 209, 88, 1)',
        backgroundColor: skin === 'kindle' ? 'rgba(0,0,0,0)' : 'rgba(48, 209, 88, 0.1)',
        pointRadius: 4,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 3,
        pointHoverBackgroundColor: skin === 'kindle' ? kindleMonthly.line : '#ffffff',
        pointBackgroundColor: skin === 'kindle' ? 'rgba(0,0,0,0)' : undefined,
        borderWidth: 2,
        hitRadius: 12,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    ...getSharedChartInteraction('index'),
    interaction: { mode: 'index' as const, intersect: false, axis: 'x' as const },
    hover: { mode: 'index' as const, intersect: false, axis: 'x' as const },
    onHover: setChartPointerCursor,
    onClick: (event: any, elements: any[], chart: any) => {
      const resolved = elements.length > 0
        ? elements
        : chart.getElementsAtEventForMode(event.native ?? event, 'index', { intersect: false }, true);
      const first = resolved[0];
      if (!first) return;
      setSelectedMonthIndex(first.index);
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
          font: { family: fontFamily, size: 12 },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        ...getSharedTooltip(tooltipBg, tooltipText, tooltipBorder, fontFamily, tooltipRadius),
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            return labels[idx] ?? '';
          },
          label: (ctx: any) => {
            const entry = monthly[ctx.dataIndex];
            const totalMinutes = Math.round(entry.totalMs / 60000);
            const perBookMinutes = entry.uniqueBooks > 0 ? Math.round(totalMinutes / entry.uniqueBooks) : 0;
            return [
              `Total reading: ${formatDurationExactHM(entry.totalMs)} (${totalMinutes} min)`,
              `Unique books: ${entry.uniqueBooks}`,
              entry.uniqueBooks > 0 ? `Avg per book: ${perBookMinutes} min` : 'Avg per book: —',
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { family: fontFamily, size: 10 }, maxRotation: 0, maxTicksLimit: 10 },
      },
      y: {
        position: 'left' as const,
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: fontFamily } },
        title: { display: true, text: 'Hours', color: textColor, font: { family: fontFamily } },
        beginAtZero: true,
      },
      y1: {
        position: 'right' as const,
        grid: { display: false },
        ticks: { color: textColor, font: { family: fontFamily }, stepSize: 1 },
        title: { display: true, text: 'Books', color: textColor, font: { family: fontFamily } },
        beginAtZero: true,
      },
    },
  };

  const selectedMonth = monthly[selectedMonthIndex];
  const selectedMonthLabel = labels[selectedMonthIndex];
  const selectedMonthMinutes = selectedMonth ? Math.round(selectedMonth.totalMs / 60000) : 0;
  const selectedPerBook = selectedMonth && selectedMonth.uniqueBooks > 0
    ? Math.round(selectedMonthMinutes / selectedMonth.uniqueBooks)
    : 0;

  return (
    <>
      <div className="chart-container" style={{ height: '280px' }}>
        <Bar data={data as any} options={options as any} />
      </div>
      {selectedMonth && (
        <div className="monthly-detail-panel">
          <strong>{selectedMonthLabel}</strong>
          <span>{formatDurationExactHM(selectedMonth.totalMs)}</span>
          <span>{selectedMonth.uniqueBooks} books</span>
          <span>{selectedMonth.uniqueBooks > 0 ? `${selectedPerBook} min/book` : 'No books'}</span>
        </div>
      )}
      {bestMonth && (
        <p className="chart-insight">
          Best month: <strong>{new Date(`${bestMonth.month}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong> ({msToHours(bestMonth.totalMs)}h). Click a month for details.
        </p>
      )}
    </>
  );
}
