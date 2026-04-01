import { Bar } from 'react-chartjs-2';
import { formatDurationExactHM, msToHours } from '../../data';
import type { MonthlyReading } from '../../types';
import { getSharedChartInteraction, getSharedTooltip, useChartTheme } from './chartTheme';

interface Props {
  monthly: MonthlyReading[];
}

export function BooksPerMonth({ monthly }: Props) {
  const { textColor, gridColor, fontFamily, tooltipBg, tooltipText, tooltipBorder } = useChartTheme();
  const bestMonth = [...monthly].sort((a, b) => b.totalMs - a.totalMs)[0];

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
        backgroundColor: 'rgba(10, 132, 255, 0.7)',
        hoverBackgroundColor: 'rgba(10, 132, 255, 0.9)',
        hoverBorderColor: 'rgba(100, 210, 255, 1)',
        hoverBorderWidth: 2,
        borderRadius: 4,
        yAxisID: 'y',
        order: 2,
      },
      {
        label: 'Unique Books',
        data: monthly.map(m => m.uniqueBooks),
        type: 'line' as const,
        borderColor: 'rgba(48, 209, 88, 1)',
        backgroundColor: 'rgba(48, 209, 88, 0.1)',
        pointRadius: 4,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 3,
        pointHoverBackgroundColor: '#ffffff',
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
    onHover: (_event: any, elements: any[], chart: any) => {
      chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
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
        ...getSharedTooltip(tooltipBg, tooltipText, tooltipBorder, fontFamily),
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
        ticks: { color: textColor, font: { family: fontFamily, size: 10 }, maxRotation: 45 },
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


  return (
    <>
      <div className="chart-container" style={{ height: '280px' }}>
        <Bar data={data as any} options={options as any} />
      </div>
      {bestMonth && (
        <p className="chart-insight">
          Best month: <strong>{new Date(`${bestMonth.month}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong> ({msToHours(bestMonth.totalMs)}h)
        </p>
      )}
    </>
  );
}
