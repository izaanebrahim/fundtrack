// Tracks which manager's notices a client has already seen, per browser.
// localStorage can be unavailable (private windows, blocked storage), so
// every access is guarded and falls back to "nothing seen yet".

const SEEN_KEY = 'barakah-notices-seen-at';

export function getNoticesSeenAt() {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

export function markNoticesSeen() {
  try {
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
    window.dispatchEvent(new Event('notices-seen'));
  } catch {
    // ignore
  }
}

// Pinned notices first, then newest first.
export function sortNotices(notices) {
  return [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}
