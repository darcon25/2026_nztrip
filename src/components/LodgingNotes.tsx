import React, { useState, useEffect } from 'react';
import { StickyNote, Send, Trash2, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: number;
  lodging_key: string;
  text: string;
  timestamp: string;
}

export default function LodgingNotes({ lodgingKey }: { lodgingKey: string }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/lodging-notes/${encodeURIComponent(lodgingKey)}`);
      if (response.ok) {
        setNotes(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch lodging notes:', error);
    }
  };

  useEffect(() => {
    if (showNotes) fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotes, lodgingKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/lodging-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: lodgingKey, text: newNote }),
      });
      if (response.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to post lodging note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/lodging-notes/${id}`, { method: 'DELETE' });
      if (response.ok) fetchNotes();
    } catch (error) {
      console.error('Failed to delete lodging note:', error);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowNotes((v) => !v)}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full rounded-full bg-camp-bg border-2 border-camp-border text-camp-text text-sm font-black hover:border-camp-brown transition-colors"
      >
        <StickyNote className="w-4 h-4 text-camp-brown" />
        註記（門禁／WiFi 密碼等）
        <ChevronDown className={`w-4 h-4 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
      </button>

      {showNotes && (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-bold text-camp-muted leading-snug">
            僅供家族內部使用，請勿外流連結。
          </p>

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="例如：大門密碼 1234 / WiFi CampHouse 密碼 abc12345"
              className="w-full min-h-[48px] bg-camp-bg border-2 border-camp-border rounded-xl px-4 py-3 pr-12 text-sm font-medium text-camp-text placeholder:text-camp-muted focus:border-camp-brown focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !newNote.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-camp-brown hover:bg-camp-brown/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
            <AnimatePresence initial={false}>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-camp-bg p-3 rounded-xl border border-camp-border group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-camp-text font-medium leading-relaxed break-words flex-1">
                      {note.text}
                    </p>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 text-camp-muted hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"
                      title="刪除註記"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-camp-muted uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {new Date(note.timestamp).toLocaleString('zh-TW', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {notes.length === 0 && (
              <p className="text-center text-sm text-camp-muted font-medium py-4">
                還沒有註記，第一個貼上門禁／WiFi 密碼吧！
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
