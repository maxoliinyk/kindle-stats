import { Bar } from 'react-chartjs-2';
import { msToMinutes } from '../../data';
import type { HourlyReading } from '../../types';
import { getSharedChartInteraction, getSharedTooltip, setChartPointerCursor, useChartTheme } from './chartTheme';

interface Props {
  hourly: HourlyReading[];
}

export function TimeOfDay({ hourly }: Props) {
  const { textColor, gridColor, fontFamily, tooltipBg, tooltipText, tooltipBorder } = useChartTheme();
  const totalMs = hourly.reduce((acc, h) => acc + h.totalMs, 0);
  const peakHourData = [...hourly].sort((a, b) => b.totalMs - a.totalMs)[0];

  const labels = hourly.map(h => {
    if (h.hour === 0) return '12am';
    if (h.hour === 12) return '12pm';
    return h.hour < 12 ? `${h.hour}am` : `${h.hour - 12}pm`;
  });

  const data = {
    labels,
    datasets: [{
      data: hourly.map(h => msToMinutes(h.totalMs)),
      backgroundColor: hourly.map(h => {
        // Gradient: warm colors for day, cool for night
        if (h.hour >= 6 && h.hour < 12) return 'rgba(255, 159, 10, 0.7)';
        if (h.hour >= 12 && h.hour < 18) return 'rgba(255, 69, 58, 0.7)';
        if (h.hour >= 18 && h.hour < 22) return 'rgba(191, 82, 242, 0.7)';
        return 'rgba(10, 132, 255, 0.7)';
      }),
      hoverBackgroundColor: hourly.map(h => {
        if (h.hour >= 6 && h.hour < 12) return 'rgba(255, 159, 10, 0.9)';
        if (h.hour >= 12 && h.hour < 18) return 'rgba(255, 69, 58, 0.9)';
        if (h.hour >= 18 && h.hour < 22) return 'rgba(191, 82, 242, 0.9)';
        return 'rgba(10, 132, 255, 0.9)';
      }),
      hoverBorderColor: 'rgba(255, 255, 255, 0.95)',
      hoverBorderWidth: 2,
      borderRadius: 4,
      barThickness: 14,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    ...getSharedChartInteraction('index'),
    interaction: { mode: 'index' as const, intersect: false, axis: 'x' as const },
    hover: { mode: 'index' as const, intersect: false, axis: 'x' as const },
    onHover: setChartPointerCursor,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...getSharedTooltip(tooltipBg, tooltipText, tooltipBorder, fontFamily),
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            return `Hour: ${labels[idx]}`;
          },
          label: (ctx: any) => {
            const h = hourly[ctx.dataIndex];
            const share = totalMs > 0 ? Math.round((h.totalMs / totalMs) * 100) : 0;
            return [
              `Reading: ${Math.round(h.totalMs / 60000)} min`,
              `Sessions: ${h.sessionCount}`,
              `Share: ${share}%`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { family: fontFamily, size: 10 }, maxRotation: 0 },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: fontFamily } },
        title: { display: true, text: 'Minutes', color: textColor, font: { family: fontFamily } },
      },
    },
  };


  return (
    <>
      <div className="chart-container" style={{ height: '260px' }}>
        <Bar data={data} options={options} />
      </div>
      {peakHourData && (
        <p className="chart-insight">
          Peak hour: <strong>{labels[peakHourData.hour]}</strong> ({msToMinutes(peakHourData.totalMs)} min). Hover anywhere above the chart columns to inspect each hour.
        </p>
      )}
    </>
  );
}
