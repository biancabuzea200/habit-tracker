import { HabitData } from '../types'
import {
  calculateWeekPercentage,
  calculateMonthPercentage,
  calculateYearPercentage,
  getAllNotesForHabit,
  formatDateForDisplay,
} from '../utils'

interface StatisticsViewProps {
  habit: HabitData;
  year: number;
  month: number;
}

export default function StatisticsView({
  habit,
  year,
  month,
}: StatisticsViewProps) {
  const today = new Date()
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  const weekPercentage = calculateWeekPercentage(habit, currentDate)
  const monthPercentage = calculateMonthPercentage(habit, year, month)
  const yearPercentage = calculateYearPercentage(habit, year)
  
  const allNotes = getAllNotesForHabit(habit)

  const StatCard = ({
    title,
    stats,
  }: {
    title: string
    stats: Array<{ label: string; value: string | number; progress?: number }>
  }) => (
    <div className="stat-card">
      <h3>{title}</h3>
      {stats.map((stat, idx) => (
        <div key={idx}>
          <div className="stat-row">
            <span className="stat-label">{stat.label}</span>
            <span className={`stat-value ${stat.progress && stat.progress >= 75 ? 'high' : ''}`}>
              {stat.value}
            </span>
          </div>
          {stat.progress !== undefined && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, stat.progress)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="statistics-view">
      <StatCard
        title="📅 Current Week"
        stats={[
          {
            label: 'Completion',
            value: `${weekPercentage}%`,
            progress: weekPercentage,
          },
        ]}
      />

      <StatCard
        title="📆 Current Month"
        stats={[
          {
            label: 'Completion',
            value: `${monthPercentage}%`,
            progress: monthPercentage,
          },
        ]}
      />

      <StatCard
        title="📊 This Year"
        stats={[
          {
            label: 'Completion',
            value: `${yearPercentage}%`,
            progress: yearPercentage,
          },
        ]}
      />

      {allNotes.length > 0 && (
        <div
          className="stat-card"
          style={{ gridColumn: '1 / -1' }}
        >
          <div className="notes-section">
            <h4>📝 Your Notes & Patterns</h4>
            {allNotes.map(({ date, note }) => (
              <div key={date} className="note-item">
                <div className="note-date">{formatDateForDisplay(date)}</div>
                <div className="note-text">{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allNotes.length === 0 && (
        <div
          className="stat-card"
          style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}
        >
          <p>No notes yet. Add notes to your habit days to track patterns!</p>
        </div>
      )}
    </div>
  )
}
