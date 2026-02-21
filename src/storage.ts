// Persists UI-only state that the backend doesn't track:
// icons, notes, and "not-done" day overrides.

const LOCAL_KEY = 'habit-tracker-local'

export interface LocalHabitData {
  icon: string
  notes: { [dateStr: string]: string }
  notDoneDays: { [dateStr: string]: true }
}

export interface LocalState {
  habits: { [habitName: string]: LocalHabitData }
  selectedHabitName: string | null
  currentYear: number
  currentMonth: number
}

function defaultState(): LocalState {
  const now = new Date()
  return {
    habits: {},
    selectedHabitName: null,
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth() + 1,
  }
}

export const localStorage_ = {
  load(): LocalState {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      if (raw) return { ...defaultState(), ...JSON.parse(raw) }
    } catch {}
    return defaultState()
  },

  save(state: LocalState) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
    } catch {}
  },

  getHabit(state: LocalState, habitName: string): LocalHabitData {
    return state.habits[habitName] ?? { icon: '🎯', notes: {}, notDoneDays: {} }
  },

  setHabitIcon(state: LocalState, habitName: string, icon: string): LocalState {
    const existing = localStorage_.getHabit(state, habitName)
    return {
      ...state,
      habits: { ...state.habits, [habitName]: { ...existing, icon } },
    }
  },

  setNote(
    state: LocalState,
    habitName: string,
    dateStr: string,
    note: string,
  ): LocalState {
    const existing = localStorage_.getHabit(state, habitName)
    return {
      ...state,
      habits: {
        ...state.habits,
        [habitName]: {
          ...existing,
          notes: { ...existing.notes, [dateStr]: note },
        },
      },
    }
  },

  setNotDone(
    state: LocalState,
    habitName: string,
    dateStr: string,
    value: boolean,
  ): LocalState {
    const existing = localStorage_.getHabit(state, habitName)
    const notDoneDays = { ...existing.notDoneDays }
    if (value) {
      notDoneDays[dateStr] = true
    } else {
      delete notDoneDays[dateStr]
    }
    return {
      ...state,
      habits: {
        ...state.habits,
        [habitName]: { ...existing, notDoneDays },
      },
    }
  },

  removeHabit(state: LocalState, habitName: string): LocalState {
    const habits = { ...state.habits }
    delete habits[habitName]
    return { ...state, habits }
  },
}
