'use client';

import { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export default function FeedbackModal({ isOpen, onClose, userEmail }: FeedbackModalProps) {
  const [type, setType] = useState<'feature' | 'bug' | 'review'>('feature');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail || 'Developer User',
          type,
          message: message.trim(),
        }),
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
        onClose();
      }, 2000);
    } catch (e) {
      console.error('Failed to submit feedback:', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans">
      <div className="bg-[#090D16] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>💡</span> Share Beta Feedback
            </h3>
            <p className="text-xs text-slate-400 font-mono">Help us shape the future of SnapTrace</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-xs bg-slate-800 p-1.5 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="text-3xl">🎉</div>
            <h4 className="text-sm font-bold text-emerald-400">Thank you for your feedback!</h4>
            <p className="text-xs text-slate-400">Your ideas help us build a better tool.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'feature', label: '💡 Feature', color: 'hover:border-yellow-400/50' },
                  { id: 'bug', label: '🐛 Bug Report', color: 'hover:border-red-500/50' },
                  { id: 'review', label: '⭐ Review', color: 'hover:border-emerald-400/50' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                      type === item.id
                        ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-300 shadow-sm'
                        : 'bg-[#05070E] border-slate-800 text-slate-400 ' + item.color
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                Your Thoughts & Suggestions
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What features should we add next? Any issues you encountered?"
                className="w-full bg-[#05070E] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition leading-relaxed resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer"
              >
                {sending ? 'Submitting...' : 'Send Feedback →'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}