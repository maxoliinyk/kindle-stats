import { Bar } from 'react-chartjs-2';
import { msToMinutes } from '../../data';
import type { HourlyReading } from '../../types';
import { useAppearance } from '../../hooks/useAppearance';
import { getSharedChartInteraction, getSharedTooltip, setChartPointerCursor, useChartTheme } from './chartTheme';

interface Props {
  hourly: HourlyReading[];
}

const KINDLE_BAND_COLORS: Record<string, { morning: string; afternoon: string; evening: string; night: string }> = {
  paper: { morning: '#E7C27A', afternoon: '#C07A3A', evening: '#8A5A2B', night: '#3E2912' },
  sepia: { morning: '#D8B87A', afternoon: '#B88549', evening: '#7A4C1F', night: '#2A1609' },
  night: { morning: '#F2CE86', afternoon: '#DDB47A', evening: '#A47A42', night: '#7F5E2A' },
};

export function TimeOfDay({ hourly }: Props) {
  const { textColor, gridColor, fontFamily, tooltipBg, tooltipText, tooltipBorder, tooltipRadius, skin, bgCard } = useChartTheme();
  const { mode } = useAppearance();

  const kindleColorForHour = (hour: number): string => {
    const bands = KINDLE_BAND_COLORS[mode] ?? KINDLE_BAND_COLORS.paper;
    if (hour >= 6 && hour < 12) return bands.morning;
    if (hour >= 12 && hour < 18) return bands.afternoon;
    if (hour >= 18 && hour < 22) return bands.evening;
    return bands.night;
  };
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
        if (skin === 'kindle') return kindleColorForHour(h.hour);
        if (h.hour >= 6 && h.hour < 12) return 'rgba(255, 159, 10, 0.7)';
        if (h.hour >= 12 && h.hour < 18) return 'rgba(255, 69, 58, 0.7)';
        if (h.hour >= 18 && h.hour < 22) return 'rgba(191, 82, 242, 0.7)';
        return 'rgba(10, 132, 255, 0.7)';
      }),
      hoverBackgroundColor: hourly.map(h => {
        if (skin === 'kindle') return kindleColorForHour(h.hour);
        if (h.hour >= 6 && h.hour < 12) return 'rgba(255, 159, 10, 0.9)';
        if (h.hour >= 12 && h.hour < 18) return 'rgba(255, 69, 58, 0.9)';
        if (h.hour >= 18 && h.hour < 22) return 'rgba(191, 82, 242, 0.9)';
        return 'rgba(10, 132, 255, 0.9)';
      }),
      borderColor: bgCard,
      borderWidth: { top: 0, right: 1, bottom: 0, left: 1 },
      hoverBorderColor: skin === 'kindle' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.95)',
      hoverBorderWidth: 2,
      borderRadius: skin === 'kindle' ? 0 : 4,
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
        ...getSharedTooltip(tooltipBg, tooltipText, tooltipBorder, fontFamily, tooltipRadius),
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
          Peak hour: <strong>{labels[peakHourData.hour]}</strong> ({msToMinutes(peakHourData.totalMs)} min).
        </p>
      )}
    </>
  );
}
