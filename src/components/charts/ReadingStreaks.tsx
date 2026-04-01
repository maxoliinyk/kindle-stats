import { useState } from 'react';
import type { StreakInfo } from '../../types';

interface Props {
  streaks: StreakInfo;
}

export function ReadingStreaks({ streaks }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const cards = [
    {
      id: 'current',
      value: streaks.currentStreak,
      label: 'Current Streak',
      detail: 'Consecutive days ending today or yesterday.',
    },
    {
      id: 'longest',
      value: streaks.longestStreak,
      label: 'Longest Streak',
      detail: 'Best run of consecutive reading days.',
    },
    {
      id: 'total',
      value: streaks.totalDaysRead,
      label: 'Total Days Read',
      detail: 'Unique calendar days with any reading activity.',
    },
  ];

  return (
    <div className="streak-grid">
      {cards.map(card => (
        <div
          key={card.id}
          className="streak-card"
          tabIndex={0}
          title={card.detail}
          onMouseEnter={() => setActive(card.id)}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(card.id)}
          onBlur={() => setActive(null)}
        >
          <div className="streak-value">{card.value}</div>
          <div className="streak-label">{card.label}</div>
          {active === card.id && <div className="streak-detail">{card.detail}</div>}
        </div>
      ))}
    </div>
  );
}
