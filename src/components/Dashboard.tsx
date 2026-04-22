import { useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ProcessedStats } from '../types';
import { KPICards } from './KPICards';
import { ReadingTimePerBook } from './charts/ReadingTimePerBook';
import { DeviceBreakdown } from './charts/DeviceBreakdown';
import { CalendarHeatmap } from './charts/CalendarHeatmap';
import { TimeOfDay } from './charts/TimeOfDay';
import { ReadingPace } from './charts/ReadingPace';
import { BooksPerMonth } from './charts/BooksPerMonth';
import { ReadingGoals } from './charts/ReadingGoals';
import { ReadingStreaks } from './charts/ReadingStreaks';
import { LongestSessions } from './charts/LongestSessions';
import { useAppearance } from '../hooks/useAppearance';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

if (ChartJS.defaults.animation !== false) {
  ChartJS.defaults.animation.duration = 600;
  ChartJS.defaults.animation.easing = 'easeOutQuart';
}

interface DashboardProps {
  stats: ProcessedStats;
  onReload: () => void;
  onBookSelect: (bookId: string) => void;
}

export function Dashboard({ stats, onReload, onBookSelect }: DashboardProps) {
  const { skin } = useAppearance();

  useEffect(() => {
    const fontFamily = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-ui')
      .trim();
    if (fontFamily) {
      ChartJS.defaults.font.family = fontFamily;
    }
  }, [skin]);

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Your Reading Overview</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {stats.totalBooks} books · {stats.totalDaysActive} days · since {stats.bookStats.length > 0
              ? stats.bookStats[stats.bookStats.length - 1].firstRead.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'N/A'}
          </p>
        </div>
        <button className="reload-btn" onClick={onReload}>
          {skin === 'kindle' ? 'Load new data' : '↻ Load New Data'}
        </button>
      </div>

      <KPICards stats={stats} />

      <div className="chart-grid">
        {/* Calendar Heatmap — Full Width */}
        <div className="chart-card full-width">
          <h3>Reading Calendar</h3>
          <CalendarHeatmap daily={stats.dailyReadings} />
        </div>

        {/* Reading Streaks — Full Width */}
        <div className="chart-card full-width">
          <h3>Reading Streaks</h3>
          <ReadingStreaks streaks={stats.streakInfo} />
        </div>

        {/* Reading Time per Book */}
        <div className="chart-card full-width">
          <h3>Reading Time per Book</h3>
          <ReadingTimePerBook books={stats.bookStats} onBookSelect={onBookSelect} />
        </div>

        {/* Time of Day */}
        <div className="chart-card">
          <h3>Time of Day</h3>
          <TimeOfDay hourly={stats.hourlyReadings} />
        </div>

        {/* Device Breakdown */}
        <div className="chart-card">
          <h3>Devices</h3>
          {stats.deviceBreakdown.length > 0 ? (
            <DeviceBreakdown breakdown={stats.deviceBreakdown} details={stats.deviceDetails} />
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
              No device data available.
            </p>
          )}
        </div>

        {/* Reading Pace */}
        <div className="chart-card">
          <h3>Reading Pace</h3>
          <ReadingPace daily={stats.dailyReadings} />
        </div>

        {/* Books per Month */}
        <div className="chart-card">
          <h3>Monthly Activity</h3>
          <BooksPerMonth monthly={stats.monthlyReadings} />
        </div>

        {/* Reading Goals */}
        <div className="chart-card chart-card-goals">
          <h3>Reading Goals</h3>
          <ReadingGoals
            goals={stats.goals}
            completedTitles={stats.completedTitles}
            totalBooks={stats.totalBooks}
          />
        </div>

        {/* Longest Sessions — overflow visible so hover panels are not clipped */}
        <div className="chart-card chart-card-sessions">
          <h3>Longest Sessions</h3>
          <LongestSessions sessions={stats.topSessions} />
        </div>
      </div>
    </div>
  );
}
