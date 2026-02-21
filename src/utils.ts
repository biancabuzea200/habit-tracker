import { HabitData } from './types'

export const getDateString = (year: number, month: number, day: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate()
}

export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export const getDaysInYear = (year: number): number => {
  return isLeapYear(year) ? 366 : 365
}

export const formatMonthYear = (year: number, month: number): string => {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export const calculateWeekPercentage = (habit: HabitData, date: Date): number => {
  const weekNumber = getWeekNumber(date)
  const year = date.getFullYear()

  // Find start of week
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const weekStart = new Date(d.setDate(diff))

  let completed = 0
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(weekStart)
    checkDate.setDate(checkDate.getDate() + i)
    const dateStr = getDateString(
      checkDate.getFullYear(),
      checkDate.getMonth() + 1,
      checkDate.getDate()
    )
    if (habit.days[dateStr] === 'done') {
      completed++
    }
  }

  return Math.round((completed / 7) * 100)
}

export const calculateMonthPercentage = (
  habit: HabitData,
  year: number,
  month: number
): number => {
  const daysInMonth = getDaysInMonth(year, month)
  let completed = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = getDateString(year, month, day)
    if (habit.days[dateStr] === 'done') {
      completed++
    }
  }

  return Math.round((completed / daysInMonth) * 100)
}

export const calculateYearPercentage = (habit: HabitData, year: number): number => {
  const today = new Date()
  const isCurrentYear = year === today.getFullYear()
  const daysToCheck = isCurrentYear ? today.getDate() : getDaysInYear(year)

  let completed = 0
  for (let month = 1; month <= 12; month++) {
    const daysInMonth = isCurrentYear && month === today.getMonth() + 1
      ? today.getDate()
      : getDaysInMonth(year, month)

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getDateString(year, month, day)
      if (habit.days[dateStr] === 'done') {
        completed++
      }
    }
  }

  const totalDays = isCurrentYear
    ? daysToCheck
    : getDaysInYear(year)

  return Math.round((completed / totalDays) * 100)
}

export const getAllNotesForHabit = (habit: HabitData): Array<{ date: string; note: string }> => {
  return Object.entries(habit.notes)
    .filter(([, note]) => note.trim().length > 0)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, note]) => ({ date, note }))
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const formatDateForDisplay = (dateString: string): string => {
  const [year, month, day] = dateString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
