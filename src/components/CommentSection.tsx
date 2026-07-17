import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Comment {
  id: number;
  day_id: number;
  item_idx: number;
  text: string;
  timestamp: string;
}

interface CommentSectionProps {
  dayId: number;
  itemIdx: number;
}

export default function CommentSection({ dayId, itemIdx }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments/${dayId}/${itemIdx}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [dayId, itemIdx]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayId,
          itemIdx,
          text: newComment,
        }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
      <div className="flex items-center gap-2 text-white font-black text-sm">
        <MessageSquare className="w-4 h-4 text-sky-400" />
        留言對話
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="新增留言..."
          className="w-full bg-slate-800 border-2 border-transparent rounded-xl px-4 py-3 pr-12 text-sm font-medium text-white placeholder:text-slate-500 focus:bg-slate-700 focus:border-sky-500 focus:outline-none transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || !newComment.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-sky-400 hover:bg-sky-900/50 rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 group"
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm text-slate-300 font-medium leading-relaxed break-words flex-1">
                  {comment.text}
                </p>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="刪除留言"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                <Clock className="w-3 h-3" />
                {new Date(comment.timestamp).toLocaleString('zh-TW', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {comments.length === 0 && (
          <p className="text-center text-xs text-slate-500 font-medium italic py-4">
            尚無留言，快來搶頭香！
          </p>
        )}
      </div>
    </div>
  );
}
