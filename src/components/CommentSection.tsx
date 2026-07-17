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
    <div className="mt-6 pt-6 border-t border-camp-border space-y-4">
      <div className="flex items-center gap-2 text-camp-text font-black text-sm">
        <MessageSquare className="w-4 h-4 text-camp-brown" />
        留言對話
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="新增留言..."
          className="w-full min-h-[48px] bg-camp-bg border-2 border-camp-border rounded-xl px-4 py-3 pr-12 text-sm font-medium text-camp-text placeholder:text-camp-muted focus:border-camp-brown focus:outline-none transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || !newComment.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-camp-brown hover:bg-camp-brown/10 rounded-lg transition-colors disabled:opacity-50"
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
              className="bg-camp-bg p-3 rounded-xl border border-camp-border group"
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm text-camp-text font-medium leading-relaxed break-words flex-1">
                  {comment.text}
                </p>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-1.5 text-camp-muted hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"
                  title="刪除留言"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-camp-muted uppercase tracking-widest">
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
          <p className="text-center text-sm text-camp-muted font-medium py-4">
            尚無留言，快來搶頭香！
          </p>
        )}
      </div>
    </div>
  );
}
