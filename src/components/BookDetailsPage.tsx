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
  const durationSpreadMs = Math.max(0, book.p75ValidSessionMs - book.p25ValidSessionMs);
  const sessionBuckets = [
    { label: '< 5m', count: book.sessionDurationBuckets.under5m },
    { label: '5-15m', count: book.sessionDurationBuckets.from5To15m },
    { label: '15-30m', count: book.sessionDurationBuckets.from15To30m },
    { label: '30-60m', count: book.sessionDurationBuckets.from30To60m },
    { label: '60m+', count: book.sessionDurationBuckets.over60m },
  ];
  const formatBucketShare = (count: number) => (
    book.validSessionCount > 0 ? `${Math.round((count / book.validSessionCount) * 100)}%` : '0%'
  );

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
          <div className="kpi-sub">{book.sessionCount} total sessions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average Session</div>
          <div className="kpi-value">{formatDurationExactHM(book.avgValidSessionMs)}</div>
          <div className="kpi-sub">Median: {formatDurationExactHM(book.medianValidSessionMs)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Page Flips</div>
          <div className="kpi-value">{book.totalPageFlips.toLocaleString('en-US')}</div>
          <div className="kpi-sub">Avg {Math.round(book.avgPageFlipsPerSession)} per session</div>
        </div>
      </div>

      <div className="book-details-sections">
        <div className="chart-card full-width">
          <h3>Session Quality</h3>
          <div className="book-meta-grid">
            <div><strong>Shortest session:</strong> {formatDurationExactHM(book.shortestSessionMs)}</div>
            <div><strong>Longest session:</strong> {formatDurationExactHM(book.longestSessionMs)}</div>
            <div><strong>Short-session marker (25% point):</strong> {formatDurationExactHM(book.p25ValidSessionMs)}</div>
            <div><strong>Long-session marker (75% point):</strong> {formatDurationExactHM(book.p75ValidSessionMs)}</div>
            <div><strong>Typical range width:</strong> {formatDurationExactHM(durationSpreadMs)}</div>
            <div><strong>Consistency score:</strong> {book.consistencyScore}/100</div>
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>Session Duration Buckets</h3>
          <div className="book-meta-grid">
            {sessionBuckets.map(bucket => (
              <div key={bucket.label}>
                <strong>{bucket.label}:</strong> {bucket.count} sessions ({formatBucketShare(bucket.count)})
              </div>
            ))}
          </div>
        </div>

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
          <h3>Sessions ({book.validSessionCount})</h3>
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
