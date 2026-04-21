import { formatDuration, formatDurationExact, formatDurationExactHM, formatMinutesExact } from '../data';
import type { BookDetailStats } from '../types';

interface BookDetailsPageProps {
  book: BookDetailStats;
  onBack: () => void;
}

function formatDateTime(value: Date | null): string {
  if (!value) return 'Unknown';
  return value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BookDetailsPage({ book, onBack }: BookDetailsPageProps) {
  return (
    <div className="dashboard">
      <div className="book-details-header">
        <button className="reload-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h2 className="book-details-title">{book.name}</h2>
        <p className="book-details-subtitle">
          {book.validSessionCount} sessions · {book.uniqueDays} unique reading days
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Reading</div>
          <div className="kpi-value">{formatDuration(book.totalReadingMs)}</div>
          <div className="kpi-sub">{formatDurationExact(book.totalReadingMs)} exact</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Sessions</div>
          <div className="kpi-value">{book.validSessionCount}</div>
          <div className="kpi-sub">{book.sessionCount} total raw sessions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average Session</div>
          <div className="kpi-value">{formatDurationExactHM(book.avgValidSessionMs)}</div>
          <div className="kpi-sub">Median: {formatDurationExactHM(book.medianValidSessionMs)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Page Flips</div>
          <div className="kpi-value">{book.totalPageFlips.toLocaleString('en-US')}</div>
          <div className="kpi-sub">Avg {Math.round(book.avgPageFlipsPerSession)} per valid session</div>
        </div>
      </div>

      <div className="book-details-sections">
        <div className="chart-card full-width">
          <h3>Book Metadata</h3>
          <div className="book-meta-grid">
            <div><strong>ASIN:</strong> {book.asin || '—'}</div>
            <div><strong>Personal doc ID:</strong> {book.personalDocumentId || '—'}</div>
            <div><strong>First read:</strong> {formatDateTime(book.firstRead)}</div>
            <div><strong>Last read:</strong> {formatDateTime(book.lastRead)}</div>
            <div><strong>Devices:</strong> {book.deviceFamilies.length > 0 ? book.deviceFamilies.join(', ') : 'Unknown'}</div>
            <div><strong>Content types:</strong> {book.contentTypes.length > 0 ? book.contentTypes.join(', ') : 'Unknown'}</div>
            <div><strong>Avg raw session:</strong> {formatMinutesExact(book.avgSessionMs)}</div>
            <div><strong>Median raw session:</strong> {formatMinutesExact(book.medianSessionMs)}</div>
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>All Sessions ({book.validSessionCount})</h3>
          <div className="book-session-list">
            {book.sessions.map((session) => (
              <div key={session.id} className="book-session-item">
                <div className="book-session-main">
                  <div className="book-session-date">{formatDateTime(session.endTime)}</div>
                  <div className="book-session-range">
                    Start: {formatDateTime(session.startTime)} · End: {formatDateTime(session.endTime)}
                  </div>
                </div>
                <div className="book-session-right">
                  <div className="book-session-duration">{formatDurationExact(session.durationMs)}</div>
                  <div className="book-session-meta">
                    {session.readingMarketplace || 'Unknown marketplace'} · {session.deviceFamily || 'Unknown device'} · {session.contentType || 'Unknown type'} · {session.pageFlips} flips
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
