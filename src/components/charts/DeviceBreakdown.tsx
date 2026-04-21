import { useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { formatDuration, formatDurationExactHM } from '../../data';
import type { DeviceDetailStats } from '../../types';
import { CHART_COLORS, getSharedChartInteraction, getSharedTooltip, setChartPointerCursor, useChartTheme } from './chartTheme';

interface Props {
  breakdown: { device: string; totalMs: number }[];
  details: DeviceDetailStats[];
}

export function DeviceBreakdown({ breakdown, details }: Props) {
  const { textColor, fontFamily, tooltipBg, tooltipText, tooltipBorder } = useChartTheme();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const totalMs = breakdown.reduce((acc, item) => acc + item.totalMs, 0);
  const topDevice = breakdown[0];

  useEffect(() => {
    setSelectedDevice(null);
  }, [breakdown]);

  const detailByDevice = useMemo(() => new Map(details.map(item => [item.device, item])), [details]);
  const selectedDetail = selectedDevice ? detailByDevice.get(selectedDevice) ?? null : null;

  const data = {
    labels: breakdown.map(d => d.device),
    datasets: [{
      data: breakdown.map(d => Math.round(d.totalMs / 60000)),
      backgroundColor: CHART_COLORS.slice(0, breakdown.length),
      borderWidth: 0,
      hoverBorderColor: 'rgba(255, 255, 255, 0.95)',
      hoverBorderWidth: 2,
      hoverOffset: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%',
    ...getSharedChartInteraction('nearest'),
    onHover: setChartPointerCursor,
    onClick: (event: any, elements: any[], chart: any) => {
      const resolved = elements.length > 0
        ? elements
        : chart.getElementsAtEventForMode(event.native ?? event, 'nearest', { intersect: false }, true);
      const first = resolved[0];
      if (!first) return;
      const device = breakdown[first.index];
      if (!device) return;
      setSelectedDevice(device.device);
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
      {selectedDetail && (
        <div className="device-detail-panel">
          <div className="device-detail-header">
            <strong>{selectedDetail.device}</strong>
            <span>{selectedDetail.sessionCount} sessions</span>
            <span>Avg {formatDurationExactHM(selectedDetail.avgSessionMs)} per session</span>
          </div>
          <div className="device-detail-list">
            {selectedDetail.sessions.slice(0, 5).map(session => (
              <div key={session.id} className="device-detail-item">
                <span>{session.endTimestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{formatDurationExactHM(session.durationMs)}</span>
                <span>{session.contentType || 'Unknown'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {topDevice && (
        <p className="chart-insight">
          Dominant device: <strong>{topDevice.device}</strong> ({formatDuration(topDevice.totalMs)}). Click a slice to inspect its sessions.
        </p>
      )}
    </>
  );
}
