import { useState } from 'react'
import { HabitData } from '../types'
import { formatDateForDisplay } from '../utils'

interface NoteModalProps {
  dateStr: string;
  habitId: number;
  habits: HabitData[];
  existingNote: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

export default function NoteModal({
  dateStr,
  habitId,
  habits,
  existingNote,
  onSave,
  onClose,
}: NoteModalProps) {
  const [note, setNote] = useState(existingNote)
  const habit = habits.find(h => h.id === habitId)

  const handleSave = () => {
    onSave(note)
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Add Note - {habit?.name} ({formatDateForDisplay(dateStr)})</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened? (e.g., 'Too busy', 'Forgot this morning', 'Great progress!')"
          autoFocus
        />
        <div className="modal-buttons">
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button onClick={handleSave}>Save Note</button>
        </div>
      </div>
    </div>
  )
}
