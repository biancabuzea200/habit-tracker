import { useState } from 'react'
import { HabitData } from '../types'
import {
  getDateString,
  getDaysInMonth,
  formatMonthYear,
} from '../utils'
import NoteModal from './NoteModal'

interface CalendarViewProps {
  habits: HabitData[];
  year: number;
  month: number;
  onDateChange: (year: number, month: number) => void;
  onUpdateDay: (habitId: number, dateStr: string, status: 'done' | 'not-done' | 'unmarked') => void;
  onAddNote: (habitId: number, dateStr: string, note: string) => void;
}

export default function CalendarView({
  habits,
  year,
  month,
  onDateChange,
  onUpdateDay,
  onAddNote,
}: CalendarViewProps) {
  const [noteModal, setNoteModal] = useState<{ show: boolean; dateStr: string | null; habitId: number | null }>({
    show: false,
    dateStr: null,
    habitId: null,
  })

  const daysInMonth = getDaysInMonth(year, month)
  // Get first day of month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOfMonthRaw = new Date(year, month - 1, 1).getDay()
  // Convert to Monday-based (0 = Monday, ..., 6 = Sunday)
  const firstDayOfMonth = firstDayOfMonthRaw === 0 ? 6 : firstDayOfMonthRaw - 1

  const handlePrevMonth = () => {
    if (month === 1) {
      onDateChange(year - 1, 12)
    } else {
      onDateChange(year, month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      onDateChange(year + 1, 1)
    } else {
      onDateChange(year, month + 1)
    }
  }

  const handleHabitClick = (habitId: number, day: number) => {
    const dateStr = getDateString(year, month, day)
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    
    const currentStatus = habit.days[dateStr] || 'unmarked'
    const nextStatus =
      currentStatus === 'unmarked'
        ? 'done'
        : currentStatus === 'done'
          ? 'not-done'
          : 'unmarked'
    onUpdateDay(habitId, dateStr, nextStatus)
  }

  const handleHabitRightClick = (e: React.MouseEvent, habitId: number, day: number) => {
    e.preventDefault()
    const dateStr = getDateString(year, month, day)
    setNoteModal({ show: true, dateStr, habitId })
  }

  const getStatusColor = (status: string) => {
    if (status === 'done') return '#34C759'
    if (status === 'not-done') return '#FF3B30'
    return '#e8e8e8'
  }

  const getStatusSymbol = (status: string) => {
    if (status === 'done') return '✓'
    if (status === 'not-done') return '✗'
    return ''
  }

  // Generate calendar grid with proper week structure
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const days: (number | null)[] = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2>All Habits - {formatMonthYear(year, month)}</h2>
        <div className="month-nav">
          <button onClick={handlePrevMonth}>← Previous</button>
          <button onClick={handleNextMonth}>Next →</button>
        </div>
      </div>

      {habits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          No habits yet. Add one to get started!
        </div>
      ) : (
        <>
          <div className="calendar-grid">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div key={`header-${day}`} className="week-day-header">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="day-cell empty"></div>
              }

              return (
                <div key={`day-${day}`} className="day-cell">
                  <div className="day-number">{day}</div>
                  <div className="habit-indicators">
                    {habits.map((habit) => {
                      const dateStr = getDateString(year, month, day)
                      const status = habit.days[dateStr] || 'unmarked'
                      const hasNote = !!(habit.notes[dateStr]?.trim())

                      return (
                        <div
                          key={`${habit.id}-${dateStr}`}
                          className={`habit-indicator ${status} ${hasNote ? 'has-note' : ''}`}
                          onClick={() => handleHabitClick(habit.id, day)}
                          onContextMenu={(e) => handleHabitRightClick(e, habit.id, day)}
                          title={`${habit.name}: ${status}${hasNote ? ' - ' + habit.notes[dateStr] : ''}`}
                          style={{ background: getStatusColor(status) }}
                        >
                          <span className="habit-icon">{habit.icon}</span>
                          {status !== 'unmarked' && <span className="status-symbol">{getStatusSymbol(status)}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
            <p style={{ margin: 0 }}>💡 <strong>Tip:</strong> Click a habit box to cycle through states. Right-click to add a note.</p>
          </div>

          {noteModal.show && noteModal.dateStr && noteModal.habitId && (
            <NoteModal
              dateStr={noteModal.dateStr}
              habitId={noteModal.habitId}
              habits={habits}
              existingNote={habits.find(h => h.id === noteModal.habitId)?.notes[noteModal.dateStr] || ''}
              onSave={(note) => {
                onAddNote(noteModal.habitId!, noteModal.dateStr!, note)
                setNoteModal({ show: false, dateStr: null, habitId: null })
              }}
              onClose={() => setNoteModal({ show: false, dateStr: null, habitId: null })}
            />
          )}
        </>
      )}
    </div>
  )
}
