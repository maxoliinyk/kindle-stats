import { Line } from 'react-chartjs-2';
import { msToMinutes } from '../../data';
import type { DailyReading } from '../../types';
import { getSharedChartInteraction, getSharedTooltip, useChartTheme } from './chartTheme';

interface Props {
  daily: DailyReading[];
}

export function ReadingPace({ daily }: Props) {
  const { textColor, gridColor, fontFamily, accent, tooltipBg, tooltipText, tooltipBorder } = useChartTheme();

  // Compute weekly rolling average
  const withDays = daily.filter(d => d.totalMs > 0);
  if (withDays.length === 0) return <p>No data</p>;

  // Group by week
  const weeklyMap = new Map<string, number[]>();
  for (const d of withDays) {
    const date = new Date(d.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeklyMap.has(key)) weeklyMap.set(key, []);
    weeklyMap.get(key)!.push(d.totalMs);
  }

  const weeks = Array.from(weeklyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, values]) => ({
      week,
      avgMs: values.reduce((a, b) => a + b, 0) / values.length,
      totalMs: values.reduce((a, b) => a + b, 0),
    }));

  const data = {
    labels: weeks.map(w => {
      const d = new Date(w.week);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Avg daily reading (min)',
      data: weeks.map(w => msToMinutes(w.avgMs)),
      borderColor: accent,
      backgroundColor: `rgba(${accent === '#0A84FF' || accent === '#007AFF' ? '10, 132, 255' : '0, 122, 255'}, 0.1)`,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    ...getSharedChartInteraction('index'),
    plugins: {
      legend: { display: false },
      tooltip: {
        ...getSharedTooltip(tooltipBg, tooltipText, tooltipBorder, fontFamily),
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            const date = new Date(weeks[idx].week);
            return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
          },
          label: (ctx: any) => {
            const week = weeks[ctx.dataIndex];
            const prevWeek = weeks[ctx.dataIndex - 1];
            const changeMin = prevWeek != null ? Math.round((week.avgMs - prevWeek.avgMs) / 60000) : null;
            return [
              `Avg/day: ${Math.round(week.avgMs / 60000)} min`,
              `Weekly total: ${Math.round(week.totalMs / 60000)} min`,
              changeMin === null
                ? 'Change vs prior week: n/a'
                : `Change vs prior week: ${changeMin >= 0 ? '+' : ''}${changeMin} min/day`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: textColor,
          font: { family: fontFamily, size: 10 },
          maxRotation: 45,
          maxTicksLimit: 12,
        },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: fontFamily } },
        title: { display: true, text: 'Minutes', color: textColor, font: { family: fontFamily } },
        beginAtZero: true,
      },
    },
  };


  return (
    <>
      <div className="chart-container" style={{ height: '260px' }}>
        <Line data={data} options={options} />
      </div>
      <p className="chart-insight">
        Latest pace: <strong>{msToMinutes(weeks[weeks.length - 1].avgMs)} min/day</strong>
      </p>
    </>
  );
}
