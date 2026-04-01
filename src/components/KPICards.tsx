import { formatDuration } from '../data';
import type { ProcessedStats } from '../types';

interface KPICardsProps {
  stats: ProcessedStats;
}

export function KPICards({ stats }: KPICardsProps) {
  const totalHours = Math.round(stats.totalReadingMs / 3600000);
  const avgPerDay = formatDuration(stats.avgPerDayMs);
  const avgPerSession = formatDuration(stats.avgPerSessionMs);

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-label">Total Read</div>
        <div className="kpi-value">{totalHours}h</div>
        <div className="kpi-sub">{formatDuration(stats.totalReadingMs)} total</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Books</div>
        <div className="kpi-value">{stats.totalBooks}</div>
        <div className="kpi-sub">unique titles</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Days Active</div>
        <div className="kpi-value">{stats.totalDaysActive}</div>
        <div className="kpi-sub">{avgPerDay} avg / day</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Avg / Session</div>
        <div className="kpi-value">{avgPerSession}</div>
        <div className="kpi-sub">{stats.completedTitles.length} completed</div>
      </div>
    </div>
  );
}
