import { HabitData } from '../types'

interface HabitManagementProps {
  habits: HabitData[];
  selectedHabitId: number | null;
  onSelectHabit: (id: number) => void;
  onDeleteHabit: (id: number) => void;
  onAddHabit: () => void;
  onUpdateHabitName: (id: number, name: string) => void;
  newHabitName: string;
  setNewHabitName: (name: string) => void;
  newHabitIcon: string;
  setNewHabitIcon: (icon: string) => void;
  showAddHabit: boolean;
  setShowAddHabit: (show: boolean) => void;
}

const EMOJI_OPTIONS = ['🏃', '🧘', '📚', '💪', '🚴', '🥗', '💧', '🎵', '📝', '😴', '🧠', '🏋️', '🚶', '🎨', '📱', '🚭', '🎯', '⏰']

export default function HabitManagement({
  habits,
  selectedHabitId,
  onSelectHabit,
  onDeleteHabit,
  onAddHabit,
  onUpdateHabitName,
  newHabitName,
  setNewHabitName,
  newHabitIcon,
  setNewHabitIcon,
  showAddHabit,
  setShowAddHabit,
}: HabitManagementProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>Habits ({habits.length})</h3>
        <button onClick={() => setShowAddHabit(!showAddHabit)}>
          {showAddHabit ? '✕ Cancel' : '+ Add Habit'}
        </button>
      </div>

      {showAddHabit && (
        <div style={{ marginBottom: '15px', background: '#f9f9f9', padding: '12px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="New habit name..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onAddHabit()
                }
              }}
              autoFocus
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
            <button onClick={onAddHabit}>Add</button>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setNewHabitIcon(emoji)}
                style={{
                  padding: '8px',
                  fontSize: '16px',
                  border: newHabitIcon === emoji ? '2px solid #007AFF' : '1px solid #ddd',
                  background: newHabitIcon === emoji ? '#e8f4ff' : 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="habits-list">
        {habits.length === 0 ? (
          <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>No habits yet. Add one to get started!</p>
        ) : (
          habits.map(habit => (
            <div
              key={habit.id}
              className="habit-chip"
              style={{ background: 'white', borderColor: '#007AFF', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ fontSize: '16px' }}>{habit.icon}</span>
              <span>{habit.name}</span>
              <button
                className="secondary"
                style={{
                  padding: '2px 6px',
                  fontSize: '12px',
                  marginLeft: 'auto',
                  minWidth: 'auto',
                  background: 'transparent',
                  color: '#FF3B30',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete "${habit.name}"?`)) {
                    onDeleteHabit(habit.id)
                  }
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
