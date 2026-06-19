import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { Campaign, Birthday, DashboardData, Settings } from '../types';
import { demoData } from '../data/demoData';
import { db, firebaseEnabled, DASHBOARD_COLLECTION, DASHBOARD_DOC } from '../lib/firebase';

// Phase-2 data layer. The public contract is unchanged from Phase 1 — the
// display reads `data` and the admin calls the mutators — but it is now backed
// by a single Firestore document (`dashboards/main`) with a real-time
// `onSnapshot` listener, so edits on /admin appear on every screen instantly.
//
// localStorage is kept as a fast offline cache: it paints the last-known state
// before the first snapshot arrives, and (when Firebase is not configured) it
// preserves the Phase-1 behaviour of syncing live across tabs in one browser.

const STORAGE_KEY = 'mkt-dashboard-data-v1';

function loadCache(): DashboardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DashboardData;
  } catch {
    /* ignore corrupt cache, fall back to demo */
  }
  return demoData;
}

function writeCache(data: DashboardData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

const docRef = db ? doc(db, DASHBOARD_COLLECTION, DASHBOARD_DOC) : null;

// Connection state powers the on-screen heartbeat so the team can tell at a
// glance whether the wall is showing fresh data:
//   local      - Firebase not configured; running on this browser only
//   connecting - Firebase configured, waiting for the first snapshot
//   live        - receiving data straight from the server
//   cached     - offline / showing the last-known data from the local cache
export type Connection = 'local' | 'connecting' | 'live' | 'cached';

interface DataContextValue {
  data: DashboardData;
  connection: Connection;
  lastSyncAt: number | null;
  saveCampaign: (campaign: Campaign) => void;
  deleteCampaign: (id: string) => void;
  saveBirthday: (birthday: Birthday) => void;
  deleteBirthday: (id: string) => void;
  updateSettings: (settings: Settings) => void;
  updatePictures: (pictures: string[], showPermanently?: boolean) => void;
  resetToDemo: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData>(loadCache);
  const [gotSnapshot, setGotSnapshot] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  // Keep a ref to the latest data so mutators can compute the next state
  // synchronously without taking `data` as a dependency.
  const dataRef = useRef(data);
  dataRef.current = data;

  // Persist a new state everywhere: optimistic local update + cache, then push
  // to Firestore if configured. When Firestore is the source of truth, the
  // onSnapshot listener below will also echo this back (idempotent).
  const persist = useCallback((next: DashboardData) => {
    setData(next);
    writeCache(next);
    if (docRef) {
      void setDoc(docRef, next).catch((err) => console.error('[mkt-dashboard] Firestore write failed', err));
    }
  }, []);

  // Real-time source of truth: Firestore when configured, else cross-tab
  // localStorage events (Phase-1 behaviour).
  useEffect(() => {
    if (docRef) {
      const unsub = onSnapshot(
        docRef,
        { includeMetadataChanges: true },
        (snap) => {
          setGotSnapshot(true);
          setFromCache(snap.metadata.fromCache);
          if (!snap.metadata.fromCache) setLastSyncAt(Date.now());
          if (snap.exists()) {
            const next = snap.data() as DashboardData;
            setData(next);
            writeCache(next);
          } else if (!snap.metadata.fromCache) {
            // First run against an empty project — seed with demo data.
            void setDoc(docRef, demoData).catch((err) =>
              console.error('[mkt-dashboard] Firestore seed failed', err),
            );
          }
        },
        (err) => console.error('[mkt-dashboard] Firestore listener error', err),
      );
      return unsub;
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setData(JSON.parse(e.newValue) as DashboardData);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const saveCampaign = useCallback(
    (campaign: Campaign) => {
      const d = dataRef.current;
      const exists = d.campaigns.some((c) => c.id === campaign.id);
      persist({
        ...d,
        campaigns: exists
          ? d.campaigns.map((c) => (c.id === campaign.id ? campaign : c))
          : [...d.campaigns, campaign],
      });
    },
    [persist],
  );

  const deleteCampaign = useCallback(
    (id: string) => {
      const d = dataRef.current;
      persist({ ...d, campaigns: d.campaigns.filter((c) => c.id !== id) });
    },
    [persist],
  );

  const saveBirthday = useCallback(
    (birthday: Birthday) => {
      const d = dataRef.current;
      const exists = d.birthdays.some((b) => b.id === birthday.id);
      persist({
        ...d,
        birthdays: exists
          ? d.birthdays.map((b) => (b.id === birthday.id ? birthday : b))
          : [...d.birthdays, birthday],
      });
    },
    [persist],
  );

  const deleteBirthday = useCallback(
    (id: string) => {
      const d = dataRef.current;
      persist({ ...d, birthdays: d.birthdays.filter((b) => b.id !== id) });
    },
    [persist],
  );

  const updateSettings = useCallback(
    (settings: Settings) => {
      persist({ ...dataRef.current, settings });
    },
    [persist],
  );

  const updatePictures = useCallback(
    (pictures: string[], showPermanently?: boolean) => {
      persist({
        ...dataRef.current,
        pictures,
        picturesShowPermanently: showPermanently !== undefined ? showPermanently : dataRef.current.picturesShowPermanently,
      });
    },
    [persist],
  );

  const resetToDemo = useCallback(() => persist(demoData), [persist]);

  // Track browser connectivity for the heartbeat.
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const connection: Connection = !firebaseEnabled
    ? 'local'
    : !gotSnapshot
      ? 'connecting'
      : fromCache || !online
        ? 'cached'
        : 'live';

  const value = useMemo(
    () => ({
      data,
      connection,
      lastSyncAt,
      saveCampaign,
      deleteCampaign,
      saveBirthday,
      deleteBirthday,
      updateSettings,
      updatePictures,
      resetToDemo,
    }),
    [
      data,
      connection,
      lastSyncAt,
      saveCampaign,
      deleteCampaign,
      saveBirthday,
      deleteBirthday,
      updateSettings,
      updatePictures,
      resetToDemo,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}

// Re-exported so UI can show whether live sync is active.
export { firebaseEnabled };
