import { useMemo, useState, useCallback } from 'react';
import { formatDuration, formatDurationExact } from '../../data';
import type { DailyReading } from '../../types';

interface Props {
  daily: DailyReading[];
}

export function CalendarHeatmap({ daily }: Props) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const { cells, months, maxMs, columns } = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const d of daily) {
      dayMap.set(d.date, d.totalMs);
    }

    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());

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

    const columns = Math.ceil(cells.length / 7);

    const MIN_COLS_BETWEEN = 3;
    const rawMonths: { label: string; col: number }[] = [];
    let lastMonth = -1;
    let col = 0;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].dayOfWeek === 0 && i > 0) col++;
      const m = new Date(cells[i].date).getMonth();
      if (m !== lastMonth && cells[i].dayOfWeek === 0) {
        rawMonths.push({
          label: new Date(cells[i].date).toLocaleDateString('en-US', { month: 'short' }),
          col,
        });
        lastMonth = m;
      }
    }
    const months = rawMonths.filter((entry, idx) => {
      const next = rawMonths[idx + 1];
      if (next && next.col - entry.col < MIN_COLS_BETWEEN) return false;
      if (!next && columns - entry.col < MIN_COLS_BETWEEN) return false;
      return true;
    });

    return { cells, months, maxMs, columns };
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

  function getIntensityLabel(ms: number): string {
    if (ms <= 0) return 'No reading';
    const minutes = Math.round(ms / 60000);
    if (minutes <= 20) return 'Light';
    if (minutes <= 45) return 'Medium';
    if (minutes <= 120) return 'Heavy';
    return 'Very heavy';
  }

  const selectedDate = pinnedDate ?? activeDate ?? null;
  const pinnedCell = pinnedDate ? cells.find(cell => cell.date === pinnedDate) : null;
  const pinnedPercentile = pinnedCell ? getPercentile(pinnedCell.ms) : 0;
  const hoverCell = activeDate ? cells.find(cell => cell.date === activeDate) : null;
  const hoverPercentile = hoverCell ? getPercentile(hoverCell.ms) : 0;
  const showFloatTip = !pinnedDate && hoverCell && pointer;

  const handleWrapperMove = useCallback(
    (e: React.MouseEvent) => {
      if (!pinnedDate && activeDate) {
        setPointer({ x: e.clientX, y: e.clientY });
      }
    },
    [pinnedDate, activeDate],
  );

  const handleWrapperLeave = useCallback(() => {
    if (!pinnedDate) {
      setActiveDate(null);
      setPointer(null);
    }
  }, [pinnedDate]);

  const gridStyle = { '--heatmap-columns': columns } as React.CSSProperties;

  return (
    <div className="heatmap-root" style={gridStyle}>
      {months.length > 0 && (
        <div className="heatmap-months">
          {months.map(month => (
            <span
              key={`${month.label}-${month.col}`}
              style={{ gridColumn: `${month.col + 1} / span 1` }}
            >
              {month.label}
            </span>
          ))}
        </div>
      )}

      {pinnedCell && (
        <div className="heatmap-pinned-bar" aria-live="polite">
          <span className="heatmap-details-title">
            {new Date(pinnedCell.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span>{pinnedCell.ms > 0 ? formatDurationExact(pinnedCell.ms) : 'No reading'}</span>
          <span>Intensity: {getIntensityLabel(pinnedCell.ms)}</span>
          <span>{pinnedPercentile > 0 ? `Top ${100 - pinnedPercentile + 1}% day` : 'Not ranked'}</span>
          <span className="heatmap-pin">
            Pinned — click same day again to clear
          </span>
        </div>
      )}

      <div
        className="heatmap-wrapper"
        onMouseMove={handleWrapperMove}
        onMouseLeave={handleWrapperLeave}
      >
        <div className="heatmap-grid" style={gridStyle}>
          {cells.map((cell, i) => (
            <div
              key={i}
              className="heatmap-cell"
              data-level={getLevel(cell.ms)}
              data-date={cell.date}
              data-active={selectedDate === cell.date ? 'true' : 'false'}
              tabIndex={0}
              role="button"
              aria-label={`${cell.date}, ${cell.ms > 0 ? formatDuration(cell.ms) : 'No reading'}, intensity ${getIntensityLabel(cell.ms)}`}
              onMouseEnter={() => {
                if (!pinnedDate) {
                  setActiveDate(cell.date);
                }
              }}
              onFocus={() => {
                if (!pinnedDate) {
                  setActiveDate(cell.date);
                }
              }}
              onBlur={() => !pinnedDate && setActiveDate(null)}
              onClick={() => {
                setPinnedDate(prev => (prev === cell.date ? null : cell.date));
              }}
            />
          ))}
        </div>
      </div>

      {showFloatTip && hoverCell && pointer && (
        <div
          className="heatmap-cursor-tooltip"
          role="tooltip"
          style={{
            left: pointer.x,
            top: pointer.y,
          }}
        >
          <span className="heatmap-cursor-tooltip-date">
            {new Date(hoverCell.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span>{hoverCell.ms > 0 ? formatDurationExact(hoverCell.ms) : 'No reading'}</span>
          <span>Intensity: {getIntensityLabel(hoverCell.ms)}</span>
          <span>
            {hoverPercentile > 0 ? `Top ${100 - hoverPercentile + 1}% day` : 'Not ranked'}
          </span>
        </div>
      )}

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
