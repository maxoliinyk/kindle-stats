import { Bar } from 'react-chartjs-2';
import { formatDuration, formatDurationExactHM, msToHours } from '../../data';
import type { BookStats } from '../../types';
import { getSharedChartInteraction, getSharedTooltip, useChartTheme } from './chartTheme';

interface Props {
  books: BookStats[];
}

export function ReadingTimePerBook({ books }: Props) {
  const { textColor, gridColor, fontFamily, tooltipBg, tooltipText, tooltipBorder } = useChartTheme();
  const top = books.slice(0, 15);
  const totalMs = top.reduce((acc, book) => acc + book.totalReadingMs, 0);
  const topBook = top[0];

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
      chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
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


  return (
    <>
      <div className="chart-container" style={{ height: `${Math.max(300, top.length * 36)}px` }}>
        <Bar data={data} options={options} />
      </div>
      {topBook && (
        <p className="chart-insight">
          Top book: <strong>{topBook.name}</strong> ({formatDuration(topBook.totalReadingMs)})
        </p>
      )}
    </>
  );
}
