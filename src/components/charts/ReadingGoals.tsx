import { useState } from 'react';
import type { ReadingGoal, CompletedTitle } from '../../types';

interface Props {
  goals: ReadingGoal[];
  completedTitles: CompletedTitle[];
  totalBooks: number;
}

export function ReadingGoals({ goals, completedTitles, totalBooks }: Props) {
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

  if (goals.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No reading goals found.</p>;
  }

  return (
    <div className="goals-grid">
      {goals.map(goal => {
        // Count unique books read in the goal year
        const booksInYear = completedTitles.filter(t => {
          const year = parseInt(t.date.split('-')[0]);
          return year === goal.year;
        }).length;

        // Use totalBooks as fallback estimation of completion
        const progress = Math.max(booksInYear, 0);
        const pct = Math.min(progress / goal.goalValue, 1);
        const circumference = 2 * Math.PI * 48;
        const offset = circumference * (1 - pct);

        return (
          <div
            key={goal.goalId}
            className="goal-ring"
            tabIndex={0}
            onMouseEnter={() => setActiveGoalId(goal.goalId)}
            onMouseLeave={() => setActiveGoalId(null)}
            onFocus={() => setActiveGoalId(goal.goalId)}
            onBlur={() => setActiveGoalId(null)}
          >
            <svg viewBox="0 0 120 120">
              <circle className="bg" cx="60" cy="60" r="48" />
              <circle
                className="progress"
                cx="60" cy="60" r="48"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
              <text
                x="60" y="55"
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="22"
                fontWeight="700"
                fontFamily="var(--font-family)"
                transform="rotate(90, 60, 60)"
              >
                {progress}
              </text>
              <text
                x="60" y="72"
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="11"
                fontFamily="var(--font-family)"
                transform="rotate(90, 60, 60)"
              >
                of {goal.goalValue}
              </text>
            </svg>
            <div className="goal-label">{goal.year} Goal</div>
            <div className="goal-detail">{progress}/{goal.goalValue} books</div>
            {activeGoalId === goal.goalId && (
              <div className="chart-hover-detail">
                <span>{Math.round(pct * 100)}% complete</span>
                <span>{Math.max(goal.goalValue - progress, 0)} books remaining</span>
                <span>Total books in library: {totalBooks}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
