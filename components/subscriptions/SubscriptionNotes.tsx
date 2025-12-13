import React, { useState, useEffect } from 'react';

interface SubscriptionNote {
  id: string;
  content: string;
  createdAt: Date;
}

interface SubscriptionNotesProps {
  subscriptionId: string;
  initialNotes?: SubscriptionNote[];
  onNotesChange?: (notes: SubscriptionNote[]) => void;
}

const SubscriptionNotes: React.FC<SubscriptionNotesProps> = ({
  subscriptionId,
  initialNotes = [],
  onNotesChange,
}) => {
  const [notes, setNotes] = useState<SubscriptionNote[]>(initialNotes);
  const [newNote, setNewNote] = useState<string>('');

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      const newNoteObject: SubscriptionNote = {
        id: Date.now().toString(), // Simple unique ID generation
        content: newNote.trim(),
        createdAt: new Date(),
      };
      const updatedNotes = [...notes, newNoteObject];
      setNotes(updatedNotes);
      setNewNote('');
      if (onNotesChange) {
        onNotesChange(updatedNotes);
      }
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter((note) => note.id !== noteId);
    setNotes(updatedNotes);
    if (onNotesChange) {
      onNotesChange(updatedNotes);
    }
  };

  return (
    <div className="subscription-notes-container" data-testid={`subscription-notes-${subscriptionId}`}>
      <h3 className="text-lg font-semibold mb-4">Internal Notes</h3>
      <div className="mb-4">
        <textarea
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Add an internal note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          aria-label="New subscription note"
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleAddNote}
          aria-label="Add note"
        >
          Add Note
        </button>
      </div>

      {notes.length > 0 ? (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="p-3 border rounded-md bg-gray-50 flex justify-between items-center"
              data-testid={`subscription-note-${note.id}`}
            >
              <div>
                <p className="text-sm text-gray-700">{note.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Added on: {note.createdAt.toLocaleString()}
                </p>
              </div>
              <button
                className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                onClick={() => handleDeleteNote(note.id)}
                aria-label={`Delete note ${note.id}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No internal notes yet.</p>
      )}
    </div>
  );
};

export default SubscriptionNotes;