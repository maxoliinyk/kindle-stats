import { Doughnut } from 'react-chartjs-2';
import { formatDuration, formatDurationExactHM } from '../../data';
import { CHART_COLORS, getSharedChartInteraction, getSharedTooltip, useChartTheme } from './chartTheme';

interface Props {
  breakdown: { device: string; totalMs: number }[];
}

export function DeviceBreakdown({ breakdown }: Props) {
  const { textColor, fontFamily, tooltipBg, tooltipText, tooltipBorder } = useChartTheme();
  const totalMs = breakdown.reduce((acc, item) => acc + item.totalMs, 0);
  const topDevice = breakdown[0];

  const data = {
    labels: breakdown.map(d => d.device),
    datasets: [{
      data: breakdown.map(d => Math.round(d.totalMs / 60000)),
      backgroundColor: CHART_COLORS.slice(0, breakdown.length),
      borderWidth: 0,
      hoverBorderColor: 'rgba(255, 255, 255, 0.95)',
      hoverBorderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%',
    ...getSharedChartInteraction('nearest'),
    onHover: (_event: any, elements: any[], chart: any) => {
      chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: textColor,
          font: { family: fontFamily, size: 12 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        ...getSharedTooltip(tooltipBg, tooltipText, tooltipBorder, fontFamily),
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex ?? 0;
            return breakdown[idx]?.device ?? '';
          },
          label: (ctx: any) => {
            const item = breakdown[ctx.dataIndex];
            const share = totalMs > 0 ? Math.round((item.totalMs / totalMs) * 100) : 0;
            return [`Reading time: ${formatDurationExactHM(item.totalMs)}`, `Share: ${share}%`];
          },
        },
      },
    },
  };

  return (
    <>
      <div className="chart-container" style={{ maxWidth: '360px', margin: '0 auto' }}>
        <Doughnut data={data} options={options} />
      </div>
      {topDevice && (
        <p className="chart-insight">
          Dominant device: <strong>{topDevice.device}</strong> ({formatDuration(topDevice.totalMs)})
        </p>
      )}
    </>
  );
}
