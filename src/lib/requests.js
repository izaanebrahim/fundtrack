// Shared labels and badge styles for client investment / withdrawal requests.

export const REQUEST_STATUS_LABELS = {
  PENDING: 'Pending',
  CONTACTED: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const REQUEST_STATUS_STYLES = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CONTACTED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  COMPLETED: 'bg-[#12C98B]/10 text-[#12C98B] border-[#12C98B]/20',
  CANCELLED: 'bg-white/5 text-[#7E8D91] border-white/10',
};

export function formatRequestAmount(request) {
  if (request.withdraw_all) return 'Full balance';
  return `₹${Number(request.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// wa.me needs digits only with a country code; assume India for 10-digit numbers.
export function whatsappLink(phone) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 11) return null;
  return `https://wa.me/${digits}`;
}
