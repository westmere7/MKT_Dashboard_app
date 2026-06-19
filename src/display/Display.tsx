import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../store/useData';
import type { Connection } from '../store/useData';
import { useScheduledReload } from '../lib/useScheduledReload';
import { buildPools } from './cards';
import { buildScene, TEMPLATES } from './layouts';
import { TileContent } from './Tile';

// The always-on TV view. Rotates through layout templates on an interval; tiles
// morph between layouts via Framer Motion's shared-layout animations.

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
  const pools = useMemo(() => buildPools(data), [data]);

  // Self-heal: reload the wall once a day at 4am.
  useScheduledReload(4);

  const [sceneIdx, setSceneIdx] = useState(0);
  useEffect(() => {
    const ms = Math.max(4, data.settings.rotationSeconds) * 1000;
    const t = setInterval(() => setSceneIdx((i) => i + 1), ms);
    return () => clearInterval(t);
  }, [data.settings.rotationSeconds]);

  // Geometry rotates every tick (smooth rearrange); content advances only once
  // per full loop of templates, so cards cycle without fighting the morph.
  const template = TEMPLATES[sceneIdx % TEMPLATES.length];
  const contentCycle = Math.floor(sceneIdx / TEMPLATES.length);
  const tiles = useMemo(() => buildScene(template, pools, contentCycle), [template, pools, contentCycle]);

  // Rotate ticker message alongside the layout.
  const messages = data.settings.tickerMessages;
  const tickerMsg = messages.length ? messages[sceneIdx % messages.length] : '';

  return (
    <div className="display">
      <div className="bento">
        {tiles.map((tile) => {
          const isImage = tile.card.kind === 'hero' || tile.card.kind === 'portrait';
          const isVideo = tile.card.kind === 'video';
          return (
            <motion.div
              // Keyed by role, not card id: the tile persists across templates and
              // Framer Motion animates it sliding/resizing to its new slot.
              key={tile.role}
              layout
              transition={{ type: 'spring', stiffness: 200, damping: 26, mass: 0.9 }}
              className={`tile ${tile.card.tone} ${isImage ? 'tile-image' : ''} ${isVideo ? 'tile-video' : ''}`}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <TileContent card={tile.card} />
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
