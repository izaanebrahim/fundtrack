'use client';

import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, X, CheckCircle2, AlertCircle } from 'lucide-react';

// Lets a client ask the fund manager for a new investment or a withdrawal.
// Nothing moves money here: the admin contacts the client and records the
// actual transaction manually from the admin Requests page.
export default function RequestModal({ type, clientId, portfolioValue = 0, onClose, onSubmitted }) {
  const isInvest = type === 'INVEST';
  const [amount, setAmount] = useState('');
  const [withdrawAll, setWithdrawAll] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    const value = Number(amount);
    if (!withdrawAll && (!amount || value <= 0)) {
      setMessage({ text: 'Please enter an amount greater than zero.', type: 'error' });
      return;
    }
    if (!isInvest && !withdrawAll && value > portfolioValue) {
      setMessage({
        text: `You can withdraw up to ₹${portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}.`,
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('requests').insert([{
        client_id: clientId,
        type,
        amount: withdrawAll ? null : value,
        withdraw_all: !isInvest && withdrawAll,
        note: note.trim() || null
      }]);
      if (error) throw error;

      setDone(true);
      onSubmitted?.();
    } catch (error) {
      console.error('Error submitting request:', error);
      setMessage({ text: error.message || 'Could not send your request. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = isInvest ? ArrowUpRight : ArrowDownLeft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-2xl shadow-black/20 w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-white/5 bg-gray-950/50">
          <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest flex items-center">
            <Icon className={`w-5 h-5 mr-2 ${isInvest ? 'text-[#12C98B]' : 'text-red-400'}`} />
            {isInvest ? 'Request to Invest' : 'Request a Withdrawal'}
          </h2>
          <button onClick={onClose} className="text-[#7E8D91] hover:text-[#F3F1E8] transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg flex items-start text-sm bg-emerald-900/40 text-emerald-300 border border-emerald-800">
                <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>Request sent. The fund manager will contact you shortly to complete it.</span>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black text-sm rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.text && (
                <div className="mb-6 p-4 rounded-lg flex items-start text-sm bg-red-900/40 text-red-300 border border-red-800">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  {message.text}
                </div>
              )}

              <p className="text-xs text-[#7E8D91] mb-5">
                {isInvest
                  ? 'Tell us how much you would like to invest. The fund manager will contact you with payment details, and units are allotted once the money is received.'
                  : 'Tell us how much you would like to withdraw. The fund manager will contact you to confirm, and the amount paid out depends on the NAV on the day it is processed.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isInvest && (
                  <div className="flex items-center justify-between text-xs text-[#7E8D91] bg-black/20 border border-white/5 rounded-xl px-4 py-3">
                    <span>Current balance</span>
                    <span className="text-[#F3F1E8] font-bold">
                      ₹{portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#7E8D91] mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 50000"
                    value={withdrawAll ? '' : amount}
                    disabled={withdrawAll}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50 disabled:opacity-40"
                  />
                </div>

                {!isInvest && (
                  <label className="flex items-center gap-2 text-sm text-[#7E8D91] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={withdrawAll}
                      onChange={(e) => setWithdrawAll(e.target.checked)}
                      className="accent-[#12C98B]"
                    />
                    Withdraw my full balance
                  </label>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#7E8D91] mb-1">Note (optional)</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Best time to call, preferred payment method, etc."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50 resize-none"
                  />
                </div>

                <div className="pt-4 mt-6 border-t border-gray-800 flex justify-end space-x-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#7E8D91] hover:text-[#F3F1E8] transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
