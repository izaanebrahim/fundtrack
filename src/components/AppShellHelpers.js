'use client';

import { useEffect, useRef, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

// Registers the offline service worker (production only, so dev reloads stay simple)
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}

// Thin banner while the phone has no connection
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 bg-amber-500/15 text-amber-300 text-xs font-bold px-4 py-2 border-b border-amber-500/20">
      <WifiOff className="w-3.5 h-3.5" /> You&apos;re offline. Figures may be out of date.
    </div>
  );
}

const PULL_TRIGGER = 70;

// Pull down at the top of the page to reload, like a native app.
// Attach to the scrolling element; touch devices only.
export function usePullToRefresh(scrollRef, active) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !('ontouchstart' in window)) return;

    const onStart = (e) => {
      start.current = el.scrollTop <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null;
    };
    const onMove = (e) => {
      if (start.current === null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0 || el.scrollTop > 0) { pullRef.current = 0; setPull(0); return; }
      // Resist the pull so it feels elastic
      pullRef.current = Math.min(dy * 0.5, PULL_TRIGGER * 1.4);
      setPull(pullRef.current);
    };
    const onEnd = () => {
      if (pullRef.current >= PULL_TRIGGER) {
        setRefreshing(true);
        window.location.reload();
      } else {
        setPull(0);
      }
      pullRef.current = 0;
      start.current = null;
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [scrollRef, active]);

  return { pull, refreshing, ready: pull >= PULL_TRIGGER };
}

export function PullIndicator({ pull, refreshing, ready }) {
  if (!pull && !refreshing) return null;
  const size = refreshing ? PULL_TRIGGER : pull;
  return (
    <div className="lg:hidden flex items-end justify-center overflow-hidden shrink-0" style={{ height: size }}>
      <div className={`mb-2 h-8 w-8 rounded-full flex items-center justify-center bg-[#101917] border border-white/10 ${ready || refreshing ? 'text-[#12C98B]' : 'text-[#7E8D91]'}`}>
        <RefreshCw
          className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
          style={refreshing ? undefined : { transform: `rotate(${(pull / PULL_TRIGGER) * 270}deg)` }}
        />
      </div>
    </div>
  );
}
