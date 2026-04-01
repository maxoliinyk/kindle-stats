import { useMemo, useState } from 'react';
import { formatDuration } from '../../data';
import type { DailyReading } from '../../types';

interface Props {
  daily: DailyReading[];
}

export function CalendarHeatmap({ daily }: Props) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);

  const { cells, months, maxMs } = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const d of daily) {
      dayMap.set(d.date, d.totalMs);
    }

    // Get range: 52 weeks back from today
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    start.setDate(start.getDate() - start.getDay()); // Start on Sunday

    const cells: { date: string; ms: number; dayOfWeek: number }[] = [];
    let maxMs = 0;

    const current = new Date(start);
    while (current <= today) {
      const key = current.toISOString().split('T')[0];
      const ms = dayMap.get(key) || 0;
      maxMs = Math.max(maxMs, ms);
      cells.push({ date: key, ms, dayOfWeek: current.getDay() });
      current.setDate(current.getDate() + 1);
    }

    // Compute month labels
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;
    let col = 0;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].dayOfWeek === 0 && i > 0) col++;
      const m = new Date(cells[i].date).getMonth();
      if (m !== lastMonth && cells[i].dayOfWeek === 0) {
        months.push({
          label: new Date(cells[i].date).toLocaleDateString('en-US', { month: 'short' }),
          col,
        });
        lastMonth = m;
      }
    }

    return { cells, months, maxMs };
  }, [daily]);

  const percentiles = useMemo(() => {
    const withReading = cells.filter(cell => cell.ms > 0).map(cell => cell.ms).sort((a, b) => a - b);
    return withReading;
  }, [cells]);

  function getLevel(ms: number): number {
    if (ms === 0) return 0;
    if (maxMs === 0) return 0;
    const ratio = ms / maxMs;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  }

  function getPercentile(ms: number): number {
    if (ms <= 0 || percentiles.length === 0) return 0;
    const count = percentiles.filter(v => v <= ms).length;
    return Math.round((count / percentiles.length) * 100);
  }

  const selectedDate = pinnedDate ?? activeDate ?? cells[cells.length - 1]?.date ?? null;
  const selectedCell = selectedDate ? cells.find(cell => cell.date === selectedDate) : null;
  const selectedLevel = selectedCell ? getLevel(selectedCell.ms) : 0;
  const selectedPercentile = selectedCell ? getPercentile(selectedCell.ms) : 0;

  return (
    <div>
      {months.length > 0 && (
        <div className="heatmap-months">
          {months.map(month => (
            <span key={`${month.label}-${month.col}`}>{month.label}</span>
          ))}
        </div>
      )}
      <div className="heatmap-wrapper">
        <div className="heatmap-grid">
          {cells.map((cell, i) => (
            <div
              key={i}
              className="heatmap-cell"
              data-level={getLevel(cell.ms)}
              data-active={selectedDate === cell.date ? 'true' : 'false'}
              title={`${cell.date}: ${cell.ms > 0 ? formatDuration(cell.ms) : 'No reading'}`}
              tabIndex={0}
              role="button"
              aria-label={`${cell.date}, ${cell.ms > 0 ? formatDuration(cell.ms) : 'No reading'}`}
              onMouseEnter={() => !pinnedDate && setActiveDate(cell.date)}
              onMouseLeave={() => !pinnedDate && setActiveDate(null)}
              onFocus={() => !pinnedDate && setActiveDate(cell.date)}
              onBlur={() => !pinnedDate && setActiveDate(null)}
              onClick={() => setPinnedDate(prev => (prev === cell.date ? null : cell.date))}
            />
          ))}
        </div>
      </div>
      <div className="heatmap-details" aria-live="polite">
        {selectedCell ? (
          <>
            <span className="heatmap-details-title">
              {new Date(selectedCell.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span>{selectedCell.ms > 0 ? formatDuration(selectedCell.ms) : 'No reading'}</span>
            <span>Level {selectedLevel}/4</span>
            <span>{selectedPercentile > 0 ? `Top ${100 - selectedPercentile + 1}% day` : 'Not ranked'}</span>
            {pinnedDate && <span className="heatmap-pin">Pinned (click cell again to unpin)</span>}
          </>
        ) : (
          <span>No data</span>
        )}
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="heatmap-legend-cell" style={{ background: 'var(--heatmap-empty)' }} />
        <div className="heatmap-legend-cell" style={{ background: 'var(--heatmap-l1)' }} />
        <div className="heatmap-legend-cell" style={{ background: 'var(--heatmap-l2)' }} />
        <div className="heatmap-legend-cell" style={{ background: 'var(--heatmap-l3)' }} />
        <div className="heatmap-legend-cell" style={{ background: 'var(--heatmap-l4)' }} />
        <span>More</span>
      </div>
    </div>
  );
}
