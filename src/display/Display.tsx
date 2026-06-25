import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../store/useData';
import type { Connection } from '../store/useData';
import { useScheduledReload } from '../lib/useScheduledReload';
import { buildCampaignUnits, buildUtilities } from './cards';
import type { Card, CampaignUnit } from './cards';
import { TEMPLATES_BY_COUNT, TEMPLATES_BY_COUNT_SHORT_BDAY } from './layouts';
import type { PlacedTile } from './layouts';
import { TileContent } from './Tile';
import { daysUntil, daysUntilBirthday } from '../lib/util';

// The always-on TV view. Each scene = three utility tiles (brand, clock,
// birthday) + one tile per DISTINCT campaign, so a campaign never appears twice.
// The template family is chosen by how many distinct campaigns there are, so
// fewer campaigns means fewer, bigger tiles. Tiles morph between templates.

const MAX_SUPPORTED_TILES = 5;

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Which of a campaign's cards to show this scene. The choice is offset by the
// tile's slot AND a per-campaign hash, so within one scene different campaigns
// land on different card types — a varied mix of visuals and stats, never an
// all-stats or all-visuals screen. It still rotates over time so everything
// gets airtime, and a campaign is only ever shown once per scene.
function pickVariant(unit: CampaignUnit, cycle: number, slot: number): Card {
  const v = unit.variants;
  if (v.length <= 1) return v[0];
  return v[(cycle + slot + hashId(unit.id)) % v.length];
}

// Tiny seeded RNG (mulberry32) + Fisher-Yates shuffle, so a scene's contents are
// random per page-load yet stable within a render (no flicker).
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const r = rng(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// How the heartbeat reads to someone glancing at the wall.
const HEARTBEAT: Record<Connection, { dot: string; label: string }> = {
  live: { dot: 'ok', label: 'live' },
  connecting: { dot: 'wait', label: 'connecting…' },
  cached: { dot: 'stale', label: 'offline — last known' },
  local: { dot: 'ok', label: 'local' },
};

function syncLabel(lastSyncAt: number | null): string {
  if (!lastSyncAt) return '';
  const mins = Math.floor((Date.now() - lastSyncAt) / 60000);
  if (mins < 1) return 'updated just now';
  if (mins < 60) return `updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `updated ${hrs}h ago`;
}

export function Display() {
  const { data, connection, lastSyncAt } = useData();
  const units = useMemo(() => buildCampaignUnits(data), [data]);
  const utils = useMemo(() => buildUtilities(data), [data]);

  const displayStyle = useMemo<React.CSSProperties>(() => {
    const s = data.settings;
    const styles: Record<string, string> = {};
    if (s.cornerRadius !== undefined && s.cornerRadius !== null) {
      styles['--radius'] = `${s.cornerRadius}px`;
    }
    if (s.backgroundColor) {
      styles['--bg-color'] = s.backgroundColor;
    }
    if (s.navyColor) {
      styles['--navy-color'] = s.navyColor;
    }
    if (s.whiteColor) {
      styles['--white-color'] = s.whiteColor;
    }
    return styles as React.CSSProperties;
  }, [data.settings]);

  // Self-heal: reload the wall once a day at 4am.
  useScheduledReload(4);

  // Random phase per page-load so a refresh doesn't always show the same scene.
  const [seed] = useState(() => (Math.random() * 0x7fffffff) | 0);

  const [sceneIdx, setSceneIdx] = useState(0);
  useEffect(() => {
    const ms = Math.max(4, data.settings.rotationSeconds) * 1000;
    const t = setInterval(() => setSceneIdx((i) => i + 1), ms);
    return () => clearInterval(t);
  }, [data.settings.rotationSeconds, sceneIdx]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setSceneIdx((i) => i + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const minCards = data.settings.minCards ?? 1;
  const maxCards = data.settings.maxCards ?? 5;
  // Show a RANDOM number of campaign tiles between the configured min and max,
  // re-rolled each scene (seeded by the page seed + scene index, so it's stable
  // within a render yet varies as the wall rotates). Clamped to how many
  // campaigns actually exist and to the templates we support.
  const loCards = Math.max(1, Math.min(minCards, maxCards));
  const hiCards = Math.min(MAX_SUPPORTED_TILES, units.length, Math.max(minCards, maxCards));
  const countRoll = rng((seed ^ ((sceneIdx + 1) * 0x9e3779b1)) >>> 0)();
  const count = hiCards <= loCards ? hiCards : loCards + Math.floor(countRoll * (hiCards - loCards + 1));
  const isBirthdayShort = utils.birthday.people ? utils.birthday.people.length <= 5 : true;
  const family = isBirthdayShort ? TEMPLATES_BY_COUNT_SHORT_BDAY[count] : TEMPLATES_BY_COUNT[count];
  const tick = sceneIdx + seed;
  const template = family[tick % family.length];
  const contentCycle = Math.floor(tick / family.length);

  const [h_clock, h_bday] = useMemo(() => {
    const campaigns = data.campaigns || [];
    const settings = data.settings;
    const eventWindowDays = settings.eventWindowDays ?? 60;
    
    const upcomingEventsCount = campaigns.filter((c) => {
      if (c.status !== 'upcoming') return false;
      const d = daysUntil(c.startDate);
      return d >= 0 && d <= eventWindowDays;
    }).length;

    const birthdays = data.birthdays || [];
    const windowDays = settings.birthdayWindowDays;
    
    const upcomingBirthdaysCount = birthdays.filter((b) => {
      const d = daysUntilBirthday(b.date);
      return d <= windowDays;
    }).length;

    if (upcomingBirthdaysCount === 0) {
      return [4, 2];
    }
    if (upcomingEventsCount === 0) {
      return [2, 4];
    }
    // Both have items. A long birthday list needs the extra row — give the clock
    // h:2 (its content is compact) and the birthday h:4 so the card sits right
    // under the events with room for more names. Short lists keep the even 3/3
    // split. Either way the birthday tile auto-fits / cycles its own contents.
    if (upcomingBirthdaysCount > 4) {
      return [2, 4];
    }
    return [3, 3];
  }, [data.campaigns, data.birthdays, data.settings]);

  const tiles = useMemo<PlacedTile[]>(() => {
    const pinnedUnits = units.filter((u) => u.showPermanently);
    const unpinnedUnits = units.filter((u) => !u.showPermanently);
    const shuffledPinned = shuffle(pinnedUnits, seed + contentCycle);
    const shuffledUnpinned = shuffle(unpinnedUnits, seed + contentCycle);
    const chosen = [...shuffledPinned, ...shuffledUnpinned].slice(0, count);

    const utilCards = [utils.clock, utils.birthday];
    return template.map((geom, i) => {
      let finalGeom = { ...geom };
      if (i === 0) {
        finalGeom.col = 1;
        finalGeom.row = 1;
        finalGeom.w = 3;
        finalGeom.h = h_clock;
      } else if (i === 1) {
        finalGeom.col = 1;
        finalGeom.row = 1 + h_clock;
        finalGeom.w = 3;
        finalGeom.h = h_bday;
      }
      return {
        ...finalGeom,
        role: i,
        card: i < 2 ? utilCards[i] : pickVariant(chosen[i - 2], contentCycle + seed, i - 2),
      };
    });
  }, [template, units, utils, count, contentCycle, seed, h_clock, h_bday]);

  // Rotate ticker message alongside the layout.
  const messages = data.settings.tickerMessages;
  const tickerMsg = messages.length ? messages[sceneIdx % messages.length] : '';

  return (
    <div className="display" style={displayStyle}>
      <div className="bento">
        {tiles.map((tile) => {
          const isImage = tile.card.kind === 'hero' || tile.card.kind === 'portrait';
          const isVideo = tile.card.kind === 'video';
          // The clock has no card chrome — it reads as time on the red background.
          const isClock = tile.card.kind === 'clock';
          const isBirthday = tile.card.kind === 'birthday';

          // Determine vertical alignment based on midpoint row position
          const midRow = tile.row + tile.h / 2;
          const isLowerHalf = tile.h < 6 && midRow > 3.5;
          const alignClass = tile.h >= 6 ? 'align-center' : (isLowerHalf ? 'align-top' : 'align-bottom');

          return (
            <motion.div
              // Keyed by role, not card id: the tile persists across templates and
              // Framer Motion animates it sliding/resizing to its new slot.
              key={tile.role}
              layout
              transition={{ type: 'spring', stiffness: 200, damping: 26, mass: 0.9 }}
              className={`tile ${isClock ? 'tile-plain' : isBirthday ? 'tile-birthday' : tile.card.tone} ${isImage ? 'tile-image' : ''} ${isVideo ? 'tile-video' : ''} ${tile.h <= 3 ? 'tile-short' : ''} ${alignClass}`}
              style={{
                gridColumn: `${tile.col} / span ${tile.w}`,
                gridRow: `${tile.row} / span ${tile.h}`,
              }}
            >
              {/* Inner crossfade swaps the content when the card rotates, while
                  the outer tile keeps morphing in place. */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tile.card.id}
                  className="tile-inner"
                  initial={{ y: -60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 60, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20, mass: 0.8 }}
                >
                  <TileContent card={tile.card} w={tile.w} h={tile.h} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="ticker">
        <span className={`live-dot ${HEARTBEAT[connection].dot}`} title={syncLabel(lastSyncAt)} />
        <span className="ticker-msg">{tickerMsg}</span>
        <span className="ticker-time">
          {data.settings.brandName} · {HEARTBEAT[connection].label}
        </span>
      </div>
    </div>
  );
}
