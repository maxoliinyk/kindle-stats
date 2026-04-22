import type { StreakInfo } from '../../types';

interface Props {
  streaks: StreakInfo;
}

export function ReadingStreaks({ streaks }: Props) {
  const cards = [
    {
      id: 'current',
      value: streaks.currentStreak,
      label: 'Current Streak',
    },
    {
      id: 'longest',
      value: streaks.longestStreak,
      label: 'Longest Streak',
    },
    {
      id: 'total',
      value: streaks.totalDaysRead,
      label: 'Total Days Read',
    },
  ];

  return (
    <div className="streak-grid">
      {cards.map(card => (
        <div key={card.id} className="streak-card">
          <div className="streak-value">{card.value}</div>
          <div className="streak-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
