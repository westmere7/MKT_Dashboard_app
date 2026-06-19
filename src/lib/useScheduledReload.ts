import { useEffect } from 'react';

// Reloads the page once a day at a fixed local hour (default 4am). For a screen
// that runs 24/7 this clears any slow memory growth, drops a stale tab, and
// pulls a fresh build if one was deployed overnight — all while nobody's
// watching. setTimeout handles sub-24h delays fine.
export function useScheduledReload(hour = 4) {
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();
    const t = setTimeout(() => window.location.reload(), delay);
    return () => clearTimeout(t);
  }, [hour]);
}
