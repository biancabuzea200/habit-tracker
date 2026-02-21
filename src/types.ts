// HabitData is the merged view of backend data + local UI state.
export interface HabitData {
  id: number      // backend id
  name: string
  icon: string    // stored locally
  days: {
    [dateStr: string]: 'done' | 'not-done' | 'unmarked'
  }
  notes: {
    [dateStr: string]: string
  }
}

export interface AppState {
  habits: HabitData[]
  selectedHabitId: number | null
  currentYear: number
  currentMonth: number
  loading: boolean
  error: string | null
}
