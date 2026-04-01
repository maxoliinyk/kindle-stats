import { Doughnut } from 'react-chartjs-2';
import { formatDuration } from '../../data';
import { CHART_COLORS, getSharedChartInteraction, getSharedTooltip, useChartTheme } from './chartTheme';

interface Props {
  breakdown: { device: string; totalMs: number }[];
}

export function DeviceBreakdown({ breakdown }: Props) {
  const { textColor, fontFamily } = useChartTheme();
  const totalMs = breakdown.reduce((acc, item) => acc + item.totalMs, 0);
  const topDevice = breakdown[0];

  const data = {
    labels: breakdown.map(d => d.device),
    datasets: [{
      data: breakdown.map(d => Math.round(d.totalMs / 60000)),
      backgroundColor: CHART_COLORS.slice(0, breakdown.length),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%',
    ...getSharedChartInteraction('nearest'),
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
        ...getSharedTooltip(textColor, fontFamily),
        callbacks: {
          label: (ctx: any) => {
            const item = breakdown[ctx.dataIndex];
            const share = totalMs > 0 ? Math.round((item.totalMs / totalMs) * 100) : 0;
            return [`${item.device}: ${formatDuration(item.totalMs)}`, `Share: ${share}%`];
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
