import { useState } from 'react';
import { formatDuration } from '../../data';
import type { TopSession } from '../../types';

interface Props {
  sessions: TopSession[];
}

export function LongestSessions({ sessions }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="session-list">
      {sessions.map((s, i) => (
        <div
          key={i}
          className="session-item"
          tabIndex={0}
          onMouseEnter={() => setActiveIndex(i)}
          onMouseLeave={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex(i)}
          onBlur={() => setActiveIndex(null)}
        >
          <div className="session-rank">#{i + 1}</div>
          <div className="session-info">
            <div className="session-name" title={s.productName}>{s.productName}</div>
            <div className="session-date">
              {s.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
          <div className="session-duration">{formatDuration(s.durationMs)}</div>
          {activeIndex === i && (
            <div className="chart-hover-detail">
              <span>Rank #{i + 1}</span>
              <span>{s.productName}</span>
              <span>{s.date.toLocaleDateString('en-US')}</span>
              <span>Duration: {formatDuration(s.durationMs)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
