import { useState, useEffect, useCallback } from 'react'
import { AppState, HabitData } from './types'
import { localStorage_, LocalState } from './storage'
import { createHabit, getAllHabits, logHabitCompletion, getHabitHistory } from './api'
import CalendarView from './components/CalendarView'
import StatisticsView from './components/StatisticsView'
import HabitManagement from './components/HabitManagement'

type ViewType = 'calendar' | 'statistics'

async function buildHabits(
  local: LocalState,
): Promise<HabitData[]> {
  const backendHabits = await getAllHabits()
  return Promise.all(
    backendHabits.map(async (bh) => {
      const localData = localStorage_.getHabit(local, bh.name)
      const doneDates = await getHabitHistory(bh.name)
      const days: HabitData['days'] = {}
      for (const dateStr of doneDates) {
        days[dateStr] = localData.notDoneDays[dateStr] ? 'not-done' : 'done'
      }
      for (const dateStr of Object.keys(localData.notDoneDays)) {
        if (!days[dateStr]) days[dateStr] = 'not-done'
      }
      return {
        id: bh.id,
        name: bh.name,
        icon: localData.icon,
        days,
        notes: localData.notes,
      } satisfies HabitData
    }),
  )
}

export default function App() {
  const [local, setLocal] = useState<LocalState>(() => localStorage_.load())
  const [state, setState] = useState<AppState>({
    habits: [],
    selectedHabitId: null,
    currentYear: local.currentYear,
    currentMonth: local.currentMonth,
    loading: true,
    error: null,
  })
  const [view, setView] = useState<ViewType>('calendar')
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitIcon, setNewHabitIcon] = useState('🎯')

  // Persist local state changes
  useEffect(() => {
    localStorage_.save(local)
  }, [local])

  // Load habits from backend on mount
  const reload = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const habits = await buildHabits(local)
      setState(prev => ({
        ...prev,
        habits,
        loading: false,
        selectedHabitId:
          prev.selectedHabitId != null
            ? prev.selectedHabitId
            : habits.length > 0
              ? habits[0].id
              : null,
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Failed to connect to backend: ${err instanceof Error ? err.message : String(err)}`,
      }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    reload()
  }, [reload])

  const addHabit = async () => {
    if (!newHabitName.trim()) return
    try {
      const created = await createHabit(newHabitName.trim())
      setLocal(prev => localStorage_.setHabitIcon(prev, created.name, newHabitIcon))
      setNewHabitName('')
      setNewHabitIcon('🎯')
      setShowAddHabit(false)
      // Reload to get updated list with history
      await reload()
      setState(prev => ({ ...prev, selectedHabitId: created.id }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: `Failed to create habit: ${err instanceof Error ? err.message : String(err)}`,
      }))
    }
  }

  const handleUpdateDay = async (
    habitId: number,
    dateStr: string,
    status: 'done' | 'not-done' | 'unmarked',
  ) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return

    if (status === 'done') {
      try {
        await logHabitCompletion(habit.name, dateStr)
        setLocal(prev => localStorage_.setNotDone(prev, habit.name, dateStr, false))
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: `Failed to log completion: ${err instanceof Error ? err.message : String(err)}`,
        }))
        return
      }
    } else if (status === 'not-done') {
      setLocal(prev => localStorage_.setNotDone(prev, habit.name, dateStr, true))
    } else {
      setLocal(prev => localStorage_.setNotDone(prev, habit.name, dateStr, false))
    }

    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h =>
        h.id === habitId
          ? { ...h, days: { ...h.days, [dateStr]: status } }
          : h,
      ),
    }))
  }

  const handleAddNote = (habitId: number, dateStr: string, note: string) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return
    setLocal(prev => localStorage_.setNote(prev, habit.name, dateStr, note))
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h =>
        h.id === habitId
          ? { ...h, notes: { ...h.notes, [dateStr]: note } }
          : h,
      ),
    }))
  }

  const setCurrentMonth = (year: number, month: number) => {
    setState(prev => ({ ...prev, currentYear: year, currentMonth: month }))
    setLocal(prev => ({ ...prev, currentYear: year, currentMonth: month }))
  }

  const selectedHabit = state.habits.find(h => h.id === state.selectedHabitId)

  return (
    <div className="container">
      <div className="header">
        <h1>🎯 Habit Tracker</h1>
        <div className="view-toggle">
          <button
            className={`secondary ${view === 'calendar' ? 'active' : ''}`}
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
          <button
            className={`secondary ${view === 'statistics' ? 'active' : ''}`}
            onClick={() => setView('statistics')}
          >
            Statistics
          </button>
        </div>
      </div>

      {state.error && (
        <div
          style={{
            background: '#fff0f0',
            border: '1px solid #FF3B30',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '12px',
            fontSize: '13px',
            color: '#c0392b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {state.error}</span>
          <button
            className="secondary"
            style={{ padding: '2px 8px', fontSize: '12px', minWidth: 'auto' }}
            onClick={() => setState(prev => ({ ...prev, error: null }))}
          >
            ✕
          </button>
        </div>
      )}

      <HabitManagement
        habits={state.habits}
        selectedHabitId={state.selectedHabitId}
        onSelectHabit={(id) => setState(prev => ({ ...prev, selectedHabitId: id }))}
        onDeleteHabit={() => {}} // backend has no delete endpoint
        onAddHabit={addHabit}
        onUpdateHabitName={() => {}} // backend has no update endpoint
        newHabitName={newHabitName}
        setNewHabitName={setNewHabitName}
        newHabitIcon={newHabitIcon}
        setNewHabitIcon={setNewHabitIcon}
        showAddHabit={showAddHabit}
        setShowAddHabit={setShowAddHabit}
      />

      {state.loading ? (
        <div className="empty-state">
          <p>Loading habits from backend…</p>
        </div>
      ) : state.habits.length === 0 ? (
        <div className="empty-state">
          <h3>👋 Welcome to Habit Tracker!</h3>
          <p>Add your first habit to get started.</p>
        </div>
      ) : view === 'calendar' ? (
        <CalendarView
          habits={state.habits}
          year={state.currentYear}
          month={state.currentMonth}
          onDateChange={(year, month) => setCurrentMonth(year, month)}
          onUpdateDay={(habitId, dateStr, status) =>
            handleUpdateDay(habitId as unknown as number, dateStr, status)
          }
          onAddNote={(habitId, dateStr, note) =>
            handleAddNote(habitId as unknown as number, dateStr, note)
          }
        />
      ) : selectedHabit ? (
        <StatisticsView
          habit={selectedHabit}
          year={state.currentYear}
          month={state.currentMonth}
        />
      ) : null}
    </div>
  )
}
