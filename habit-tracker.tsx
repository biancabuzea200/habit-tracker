import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, TrendingUp, Calendar, Edit2 } from 'lucide-react';

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await window.storage.get('habit-tracker-data');
      if (result && result.value) {
        const data = JSON.parse(result.value);
        setHabits(data.habits || []);
      }
    } catch (error) {
      console.log('No existing data found, starting fresh');
    }
  };

  const saveData = async (updatedHabits) => {
    try {
      await window.storage.set('habit-tracker-data', JSON.stringify({
        habits: updatedHabits
      }));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const addHabit = () => {
    if (newHabitName.trim()) {
      const newHabit = {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        entries: {}
      };
      const updatedHabits = [...habits, newHabit];
      setHabits(updatedHabits);
      saveData(updatedHabits);
      setNewHabitName('');
      setShowAddHabit(false);
    }
  };

  const deleteHabit = (habitId) => {
    const updatedHabits = habits.filter(h => h.id !== habitId);
    setHabits(updatedHabits);
    saveData(updatedHabits);
  };

  const updateHabitName = (habitId, newName) => {
    const updatedHabits = habits.map(h => 
      h.id === habitId ? { ...h, name: newName } : h
    );
    setHabits(updatedHabits);
    saveData(updatedHabits);
    setEditingHabit(null);
  };

  const toggleHabitStatus = (habitId, dateStr, currentStatus) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const newEntries = { ...habit.entries };
        if (currentStatus === undefined) {
          newEntries[dateStr] = { status: 'done', note: '' };
        } else if (currentStatus === 'done') {
          newEntries[dateStr] = { status: 'not-done', note: habit.entries[dateStr]?.note || '' };
        } else {
          delete newEntries[dateStr];
        }
        return { ...habit, entries: newEntries };
      }
      return habit;
    });
    setHabits(updatedHabits);
    saveData(updatedHabits);
  };

  const updateNote = (habitId, dateStr, note) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const newEntries = { ...habit.entries };
        if (newEntries[dateStr]) {
          newEntries[dateStr] = { ...newEntries[dateStr], note };
        } else {
          newEntries[dateStr] = { status: 'not-done', note };
        }
        return { ...habit, entries: newEntries };
      }
      return habit;
    });
    setHabits(updatedHabits);
    saveData(updatedHabits);
  };

  const getDateStr = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const calculateStats = (habit) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());

    let weekDone = 0;
    let monthDone = 0;
    let yearDone = 0;

    // Week calculation - always 7 days
    const weekTotal = 7;
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      const dateStr = getDateStr(date);
      if (habit.entries[dateStr]?.status === 'done') weekDone++;
    }

    // Month calculation - total days in current month
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthTotal = daysInCurrentMonth;
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = getDateStr(date);
      if (habit.entries[dateStr]?.status === 'done') monthDone++;
    }

    // Year calculation - 365 or 366 days
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const yearTotal = isLeapYear ? 366 : 365;
    
    for (let i = 0; i < yearTotal; i++) {
      const date = new Date(currentYear, 0, 1);
      date.setDate(date.getDate() + i);
      const dateStr = getDateStr(date);
      if (habit.entries[dateStr]?.status === 'done') yearDone++;
    }

    return {
      week: Math.round((weekDone / weekTotal) * 100 * 100) / 100,
      month: Math.round((monthDone / monthTotal) * 100 * 100) / 100,
      year: Math.round((yearDone / yearTotal) * 100 * 100) / 100,
      weekDone,
      weekTotal,
      monthDone,
      monthTotal,
      yearDone,
      yearTotal
    };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Habit Tracker</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <TrendingUp size={20} />
                {showStats ? 'Calendar' : 'Statistics'}
              </button>
              <button
                onClick={() => setShowAddHabit(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus size={20} />
                Add Habit
              </button>
            </div>
          </div>

          {showAddHabit && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                placeholder="Enter habit name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={addHabit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Add
                </button>
                <button onClick={() => { setShowAddHabit(false); setNewHabitName(''); }} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {habits.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No habits yet. Click "Add Habit" to get started!</p>
            </div>
          )}

          {!showStats && habits.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-gray-100 rounded">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-semibold">{monthNames[month]} {year}</h2>
                <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-gray-100 rounded">
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-gray-700">Your Habits:</h3>
                <div className="flex flex-wrap gap-2">
                  {habits.map(habit => (
                    <div key={habit.id} className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border">
                      {editingHabit === habit.id ? (
                        <input
                          type="text"
                          defaultValue={habit.name}
                          onBlur={(e) => updateHabitName(habit.id, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && updateHabitName(habit.id, e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="text-sm font-medium">{habit.name}</span>
                          <button onClick={() => setEditingHabit(habit.id)} className="text-gray-400 hover:text-gray-600">
                            <Edit2 size={14} />
                          </button>
                        </>
                      )}
                      <button onClick={() => deleteHabit(habit.id)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2 text-center font-semibold text-gray-600">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month, day);
                  const dateStr = getDateStr(date);
                  
                  return (
                    <div 
                      key={day} 
                      className="border-2 border-gray-300 rounded-lg p-2 hover:border-indigo-400 cursor-pointer transition bg-white"
                      onClick={() => setSelectedDay({ dateStr, date })}
                    >
                      <div className="text-sm font-semibold text-gray-700 mb-1">{day}</div>
                      <div className="space-y-1">
                        {habits.map(habit => {
                          const entry = habit.entries[dateStr];
                          const status = entry?.status;
                          const tooltipText = entry?.note 
                            ? `${habit.name}\n\nNote: ${entry.note}` 
                            : habit.name;
                          return (
                            <div 
                              key={habit.id}
                              className={`text-xs px-1 py-0.5 rounded relative group ${
                                status === 'done' ? 'bg-green-500 text-white' :
                                status === 'not-done' ? 'bg-red-500 text-white' :
                                'bg-gray-200 text-gray-600'
                              }`}
                              title={tooltipText}
                            >
                              {habit.name.length > 8 ? habit.name.substring(0, 8) + '...' : habit.name}
                              {entry?.note && ' 📝'}
                              {entry?.note && (
                                <div className="hidden group-hover:block absolute z-50 left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded p-2 shadow-lg w-48 whitespace-normal">
                                  <div className="font-semibold mb-1">{habit.name}</div>
                                  <div className="text-gray-300">{entry.note}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : showStats && habits.length > 0 ? (
            <div className="space-y-6">
              {habits.map(habit => {
                const stats = calculateStats(habit);
                return (
                  <div key={habit.id} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">{habit.name}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-600 text-sm mb-1">This Week</div>
                        <div className="text-3xl font-bold text-indigo-600">{stats.week}%</div>
                        <div className="text-xs text-gray-500 mt-1">{stats.weekDone}/{stats.weekTotal} days</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-600 text-sm mb-1">This Month</div>
                        <div className="text-3xl font-bold text-indigo-600">{stats.month}%</div>
                        <div className="text-xs text-gray-500 mt-1">{stats.monthDone}/{stats.monthTotal} days</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-gray-600 text-sm mb-1">This Year</div>
                        <div className="text-3xl font-bold text-indigo-600">{stats.year}%</div>
                        <div className="text-xs text-gray-500 mt-1">{stats.yearDone}/{stats.yearTotal} days</div>
                      </div>
                    </div>
                    
                    {Object.entries(habit.entries).filter(([_, entry]) => entry.note).length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Notes & Patterns:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {Object.entries(habit.entries)
                            .filter(([_, entry]) => entry.note)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .map(([dateStr, entry]) => (
                              <div key={dateStr} className="bg-white p-2 rounded text-sm">
                                <span className="font-medium text-gray-600">{new Date(dateStr).toLocaleDateString()}:</span>
                                <span className="ml-2">{entry.note}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <div className="space-y-4">
              {habits.map(habit => {
                const entry = habit.entries[selectedDay.dateStr];
                const status = entry?.status;
                return (
                  <div key={habit.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{habit.name}</h4>
                      <button
                        onClick={() => toggleHabitStatus(habit.id, selectedDay.dateStr, status)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          status === 'done' ? 'bg-green-500 text-white hover:bg-green-600' :
                          status === 'not-done' ? 'bg-red-500 text-white hover:bg-red-600' :
                          'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                      >
                        {status === 'done' ? '✓ Done' : status === 'not-done' ? '✗ Not Done' : 'Mark'}
                      </button>
                    </div>
                    {status === 'not-done' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional):</label>
                        <textarea
                          value={entry?.note || ''}
                          onChange={(e) => updateNote(habit.id, selectedDay.dateStr, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          rows="2"
                          placeholder="Why didn't you complete this habit?"
                        />
                      </div>
                    )}
                    {entry?.note && status !== 'not-done' && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Note:</strong> {entry.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;