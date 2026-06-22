import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useData, firebaseEnabled } from '../store/useData';
import type { Birthday, Campaign, Settings, SocialStat } from '../types';
import { campaignImages, youtubeThumb } from '../lib/util';
import { ImageInput } from './ImageInput';
import { ImageGalleryInput } from './ImageGalleryInput';
import { cloudinaryEnabled, uploadImage } from '../lib/cloudinary';
import './admin.css';

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;

const isDirty = <T,>(a: T, b: T) => JSON.stringify(a) !== JSON.stringify(b);

// Canonicalize a campaign to the array image form, folding in any legacy single
// URLs. Keeps draft/compare/save consistent for old and new data alike.
function normalizeCampaign(c: Campaign): Campaign {
  return {
    ...c,
    images: campaignImages(c),
    keyVisualUrls: [],
    portraitUrls: [],
    keyVisualUrl: '',
    portraitUrl: '',
  };
}

// Config portal. Each item shows a compact summary row; clicking it expands the
// full editor. Edits are held in a local draft until you Save (writes to the
// shared store / live wall) or Discard (reverts to the last saved values).

export function Admin() {
  const { data, resetToDemo, saveCampaign } = useData();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('admin-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('admin-theme', adminTheme);
  }, [adminTheme]);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  const addCampaign = () => {
    const id = newId();
    saveCampaign({
      id,
      title: 'New campaign',
      tagline: 'Add a short tagline',
      status: 'upcoming',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      images: [],
      youtubeUrl: '',
      stats: [],
    });
    setOpenId(id);
  };

  return (
    <div className={`admin ${adminTheme === 'dark' ? 'dark' : ''}`}>
      <div className="admin-inner">
        <div className="admin-header">
          <h1>Dashboard config</h1>
          <div className="grow" />
          <button
            className="theme-toggle-btn"
            onClick={() => setAdminTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            aria-label="Toggle dark/light theme"
            title={adminTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {adminTheme === 'light' ? (
              <svg className="theme-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            ) : (
              <svg className="theme-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            )}
            <span>{adminTheme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
          <Link className="link" to="/">
            ↗ Open dashboard
          </Link>
          <button className="btn ghost small" onClick={resetToDemo}>
            Reset to demo
          </button>
        </div>

        <div className="notice">
          {firebaseEnabled ? (
            <>📡 Live sync is on — changes save to Firebase and update every screen instantly.</>
          ) : (
            <>💾 Live sync is off — set up Firebase (see FIREBASE_SETUP.md) so edits reach the TV across devices. For
            now changes are saved on this browser only.</>
          )}{' '}
          🔓 The config page is currently open (no login); password protection will be added in a later phase.
        </div>

        <SettingsSection />

        <SectionHeader title="Campaigns" count={data.campaigns.length} onAdd={addCampaign} addLabel="+ Add campaign" />
        <div className="item-list">
          {data.campaigns.length === 0 && <div className="empty-hint">No campaigns yet — add one to get started.</div>}
          {data.campaigns.map((c) => (
            <CampaignRow key={c.id} campaign={c} open={openId === c.id} onToggle={() => toggle(c.id)} />
          ))}
        </div>

        <BirthdaysSection />

        <div className="section-head">
          <h2>Misc</h2>
        </div>
        <PicturesSection />
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  onAdd,
  addLabel,
}: {
  title: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="section-head">
      <h2>
        {title} <span className="count">{count}</span>
      </h2>
      <div className="grow" />
      <button className="btn small" onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsSection() {
  const { data, updateSettings } = useData();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Settings>(data.settings);

  useEffect(() => {
    setDraft(data.settings);
  }, [data.settings]);

  const set = (patch: Partial<Settings>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = isDirty(draft, data.settings);

  return (
    <div className="panel">
      <button className="item-row" onClick={() => setOpen((o) => !o)}>
        <span className="item-icon">⚙️</span>
        <div className="item-main">
          <div className="item-title">Display settings {dirty && <span className="dirty-dot" title="Unsaved" />}</div>
          <div className="item-meta">
            {draft.brandName} · rotate {draft.rotationSeconds}s · cards {draft.minCards ?? 1}-{draft.maxCards ?? 5} · birthdays {draft.birthdayWindowDays}d · events {draft.eventWindowDays ?? 60}d ·{' '}
            {draft.tickerMessages.length} ticker msgs
          </div>
        </div>
        <span className={`chevron ${open ? 'up' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="item-detail">
          <div className="row">
            <div className="field">
              <label>Brand name</label>
              <input value={draft.brandName} onChange={(e) => set({ brandName: e.target.value })} />
            </div>
            <div className="field">
              <label>Layout rotation (seconds)</label>
              <input
                type="number"
                min={4}
                value={draft.rotationSeconds}
                onChange={(e) => set({ rotationSeconds: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Birthday look-ahead (days)</label>
              <input
                type="number"
                min={1}
                value={draft.birthdayWindowDays}
                onChange={(e) => set({ birthdayWindowDays: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Upcoming events look-ahead (days)</label>
              <input
                type="number"
                min={1}
                value={draft.eventWindowDays ?? 60}
                onChange={(e) => set({ eventWindowDays: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Min campaign cards shown</label>
              <input
                type="number"
                min={1}
                max={5}
                value={draft.minCards !== undefined ? draft.minCards : 1}
                onChange={(e) => set({ minCards: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Max campaign cards shown</label>
              <input
                type="number"
                min={1}
                max={5}
                value={draft.maxCards !== undefined ? draft.maxCards : 5}
                onChange={(e) => set({ maxCards: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label className="checkbox-label" style={{ opacity: 0.6 }}>
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  style={{ cursor: 'not-allowed' }}
                />
                <span>Show Birthdays permanently on dashboard</span>
              </label>
            </div>
            <div className="field">
              <label className="checkbox-label" style={{ opacity: 0.6 }}>
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  style={{ cursor: 'not-allowed' }}
                />
                <span>Show Clock permanently on dashboard</span>
              </label>
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Show seconds on clock</label>
              <select
                value={draft.showSeconds ? 'yes' : 'no'}
                onChange={(e) => set({ showSeconds: e.target.value === 'yes' })}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Ticker messages (one per line)</label>
            <textarea
              value={draft.tickerMessages.join('\n')}
              onChange={(e) => set({ tickerMessages: e.target.value.split('\n').filter((l) => l.trim()) })}
            />
          </div>

          <div className="section-divider" style={{ margin: '18px 0 12px', fontWeight: 700, fontSize: '0.9rem', paddingBottom: '6px', opacity: 0.8 }}>
            Theme & Appearance
          </div>
          <div className="row">
            <div className="field">
              <label>Corner radius (pixels)</label>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="26"
                value={draft.cornerRadius !== undefined && draft.cornerRadius !== null ? draft.cornerRadius : ''}
                onChange={(e) => set({ cornerRadius: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="field">
              <label>Background color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  style={{ width: '42px', height: '42px', padding: '0', border: '1px solid var(--figma-input-border)', borderRadius: 'var(--figma-radius)', cursor: 'pointer', flex: 'none' }}
                  value={draft.backgroundColor || '#e61e2a'}
                  onChange={(e) => set({ backgroundColor: e.target.value })}
                />
                <input
                  type="text"
                  style={{ flex: 1 }}
                  placeholder="#e61e2a"
                  value={draft.backgroundColor || ''}
                  onChange={(e) => set({ backgroundColor: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Navy tile background color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  style={{ width: '42px', height: '42px', padding: '0', border: '1px solid var(--figma-input-border)', borderRadius: 'var(--figma-radius)', cursor: 'pointer', flex: 'none' }}
                  value={draft.navyColor || '#000054'}
                  onChange={(e) => set({ navyColor: e.target.value })}
                />
                <input
                  type="text"
                  style={{ flex: 1 }}
                  placeholder="#000054"
                  value={draft.navyColor || ''}
                  onChange={(e) => set({ navyColor: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>White tile background color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  style={{ width: '42px', height: '42px', padding: '0', border: '1px solid var(--figma-input-border)', borderRadius: 'var(--figma-radius)', cursor: 'pointer', flex: 'none' }}
                  value={draft.whiteColor || '#ffffff'}
                  onChange={(e) => set({ whiteColor: e.target.value })}
                />
                <input
                  type="text"
                  style={{ flex: 1 }}
                  placeholder="#ffffff"
                  value={draft.whiteColor || ''}
                  onChange={(e) => set({ whiteColor: e.target.value })}
                />
              </div>
            </div>
          </div>

          <EditorActions
            dirty={dirty}
            onSave={() => updateSettings(draft)}
            onDiscard={() => setDraft(data.settings)}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- Pictures ---------------- */

function PicturesSection() {
  const { data, updatePictures } = useData();
  const [open, setOpen] = useState(false);
  const pictures = useMemo(() => data.pictures ?? [], [data.pictures]);
  const showPermanently = data.picturesShowPermanently ?? false;

  const [draftPics, setDraftPics] = useState<string[]>(pictures);
  const [draftPinned, setDraftPinned] = useState<boolean>(showPermanently);

  useEffect(() => {
    setDraftPics(pictures);
    setDraftPinned(showPermanently);
  }, [pictures, showPermanently]);

  const dirty = isDirty(draftPics, pictures) || draftPinned !== showPermanently;

  return (
    <div className="panel">
      <button className="item-row" onClick={() => setOpen((o) => !o)}>
        <span className="item-icon">🖼️</span>
        <div className="item-main">
          <div className="item-title">Pictures of the week {dirty && <span className="dirty-dot" title="Unsaved" />}</div>
          <div className="item-meta">
            {draftPics.length} {draftPics.length === 1 ? 'picture' : 'pictures'}
            {draftPinned && <span className="pill pinned">📌 Permanent</span>}
          </div>
        </div>
        <span className={`chevron ${open ? 'up' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="item-detail">
          <div className="field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draftPinned}
                onChange={(e) => setDraftPinned(e.target.checked)}
              />
              <span>Show permanently on dashboard</span>
            </label>
          </div>
          <ImageGalleryInput label="Pictures" value={draftPics} onChange={setDraftPics} />
          <EditorActions
            dirty={dirty}
            onSave={() => updatePictures(draftPics, draftPinned)}
            onDiscard={() => {
              setDraftPics(pictures);
              setDraftPinned(showPermanently);
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- Campaign ---------------- */

function CampaignRow({ campaign, open, onToggle }: { campaign: Campaign; open: boolean; onToggle: () => void }) {
  const { saveCampaign, deleteCampaign } = useData();
  const base = useMemo(() => normalizeCampaign(campaign), [campaign]);
  const [draft, setDraft] = useState<Campaign>(base);
  const set = (patch: Partial<Campaign>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = isDirty(draft, base);

  const images = draft.images ?? [];
  const imageCount = images.length;
  const cycles = images.length > 1;
  const videoThumb = youtubeThumb(draft.youtubeUrl);
  const thumb = videoThumb || images[0];

  const setStat = (id: string, patch: Partial<SocialStat>) =>
    set({ stats: draft.stats.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const addStat = () =>
    set({ stats: [...draft.stats, { id: newId(), label: 'Metric', value: '0', delta: '', trend: 'up', platform: '' }] });
  const removeStat = (id: string) => set({ stats: draft.stats.filter((s) => s.id !== id) });

  return (
    <div className={`panel ${open ? 'is-open' : ''}`}>
      <button className="item-row" onClick={onToggle}>
        {thumb ? <img className="item-thumb" src={thumb} alt="" /> : <div className="item-thumb empty">—</div>}
        <div className="item-main">
          <div className="item-title">
            {draft.title || 'Untitled'} {dirty && <span className="dirty-dot" title="Unsaved" />}
          </div>
          <div className="item-meta">
            {draft.showPermanently && <span className="pill pinned">📌 Permanent</span>}
            <span className={`pill ${draft.status}`}>{draft.status === 'ongoing' ? 'Ongoing' : 'Upcoming'}</span>
            <span>{draft.startDate}</span>
            <span>· {draft.stats.length} stats</span>
            <span>· {imageCount} {imageCount === 1 ? 'image' : 'images'}</span>
            {draft.youtubeUrl && <span>· ▶ video</span>}
          </div>
        </div>
        <span className={`chevron ${open ? 'up' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="item-detail">
          <div className="row">
            <div className="field">
              <label>Title</label>
              <input value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
            <div className="field">
              <label>Tagline</label>
              <input value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Status</label>
              <select value={draft.status} onChange={(e) => set({ status: e.target.value as Campaign['status'] })}>
                <option value="ongoing">Ongoing</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
            <div className="field">
              <label>Start date</label>
              <input
                type="date"
                value={draft.startDate}
                onChange={(e) => set({ startDate: e.target.value, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.showPermanently ?? false}
                onChange={(e) => set({ showPermanently: e.target.checked })}
              />
              <span>Show permanently on dashboard</span>
            </label>
          </div>

          <ImageGalleryInput label="Images" value={images} onChange={(urls) => set({ images: urls })} />

          <div className="row">
            <div className="field">
              <label>Video (YouTube URL) — shown instead of images when set</label>
              <div className="video-input">
                <input
                  placeholder="Paste a YouTube link"
                  value={draft.youtubeUrl ?? ''}
                  onChange={(e) => set({ youtubeUrl: e.target.value })}
                />
                {draft.youtubeUrl && (
                  <button type="button" className="btn ghost small" onClick={() => set({ youtubeUrl: '' })}>
                    ✕ Remove
                  </button>
                )}
              </div>
              {videoThumb && <img className="video-thumb" src={videoThumb} alt="" />}
            </div>
            {cycles && (
              <div className="field">
                <label>Image cycle interval (seconds)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="auto"
                  value={draft.imageIntervalSeconds ? draft.imageIntervalSeconds : ''}
                  onChange={(e) => set({ imageIntervalSeconds: Number(e.target.value) })}
                />
                <span className="muted">Blank = auto (cycles a few before the layout changes).</span>
              </div>
            )}
          </div>

          <label className="muted" style={{ fontWeight: 700 }}>
            Social stats (entered manually)
          </label>
          {draft.stats.map((s) => (
            <div className="stat-edit" key={s.id}>
              <div className="field">
                <label>Label</label>
                <input value={s.label} onChange={(e) => setStat(s.id, { label: e.target.value })} />
              </div>
              <div className="field">
                <label>Value</label>
                <input value={s.value} onChange={(e) => setStat(s.id, { value: e.target.value })} />
              </div>
              <div className="field">
                <label>Delta</label>
                <input value={s.delta ?? ''} onChange={(e) => setStat(s.id, { delta: e.target.value })} />
              </div>
              <div className="field">
                <label>Platform</label>
                <input value={s.platform ?? ''} onChange={(e) => setStat(s.id, { platform: e.target.value })} />
              </div>
              <button className="btn ghost small" onClick={() => removeStat(s.id)}>
                ✕
              </button>
            </div>
          ))}
          <button className="btn ghost small" onClick={addStat}>
            + Add stat
          </button>

          <EditorActions
            dirty={dirty}
            onSave={() => saveCampaign(draft)}
            onDiscard={() => setDraft(base)}
            onDelete={() => deleteCampaign(campaign.id)}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- Birthday Table ---------------- */

function TableImageInput({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {value ? (
        <img style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--figma-border)', flexShrink: 0 }} src={value} alt="" />
      ) : (
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--figma-border)', display: 'grid', placeItems: 'center', fontSize: '0.9rem', flexShrink: 0 }}>🎂</div>
      )}
      <input
        style={{ flex: 1, minWidth: '100px' }}
        placeholder="Image URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {cloudinaryEnabled && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <button
            type="button"
            className="btn ghost small"
            style={{ padding: '4px 8px', fontSize: '0.75rem', flexShrink: 0 }}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? '…' : '⬆'}
          </button>
        </>
      )}
    </div>
  );
}

function BirthdaysSection() {
  const { data, saveBirthday, deleteBirthday } = useData();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Birthday[]>(data.birthdays);

  useEffect(() => {
    setDraft(data.birthdays);
  }, [data.birthdays]);

  const setRow = (id: string, patch: Partial<Birthday>) => {
    setDraft((current) => current.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const addRow = () => {
    const id = newId();
    setDraft((current) => [...current, { id, name: '', date: '01-01', team: '', photoUrl: '' }]);
  };

  const deleteRow = (id: string) => {
    setDraft((current) => current.filter((b) => b.id !== id));
  };

  const dirty = isDirty(draft, data.birthdays);

  const handleSave = () => {
    // 1. Delete removed birthdays
    const draftIds = new Set(draft.map((b) => b.id));
    data.birthdays.forEach((b) => {
      if (!draftIds.has(b.id)) {
        deleteBirthday(b.id);
      }
    });

    // 2. Save new or updated birthdays
    draft.forEach((draftItem) => {
      const original = data.birthdays.find((b) => b.id === draftItem.id);
      if (!original || isDirty(draftItem, original)) {
        saveBirthday(draftItem);
      }
    });
  };

  const handleDiscard = () => {
    setDraft(data.birthdays);
  };

  return (
    <div className="panel">
      <button className="item-row" onClick={() => setOpen((o) => !o)}>
        <span className="item-icon">🎂</span>
        <div className="item-main">
          <div className="item-title">
            Birthdays {dirty && <span className="dirty-dot" title="Unsaved" />}
          </div>
          <div className="item-meta">
            {draft.length} people registered
          </div>
        </div>
        <span className={`chevron ${open ? 'up' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="item-detail">
          {draft.length === 0 ? (
            <div className="empty-hint">No birthdays yet. Click "+ Add Birthday" to start.</div>
          ) : (
            <table className="birthday-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Photo</th>
                  <th style={{ width: '25%' }}>Name</th>
                  <th style={{ width: '15%' }}>Birthday</th>
                  <th style={{ width: '15%' }}>Team</th>
                  <th style={{ width: '5%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {draft.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <TableImageInput value={b.photoUrl ?? ''} onChange={(url) => setRow(b.id, { photoUrl: url })} />
                    </td>
                    <td>
                      <input
                        placeholder="Name"
                        value={b.name}
                        onChange={(e) => setRow(b.id, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={(() => {
                          if (!b.date) return '';
                          const parts = b.date.split('-');
                          if (parts.length !== 2) return '';
                          const [mm, dd] = parts;
                          const dummyYear = new Date().getFullYear();
                          const pad = (s: string) => s.padStart(2, '0');
                          return `${dummyYear}-${pad(mm)}-${pad(dd)}`;
                        })()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const parts = val.split('-');
                            if (parts.length === 3) {
                              setRow(b.id, { date: `${parts[1]}-${parts[2]}` });
                            }
                          }
                        }}
                      />
                    </td>
                    <td>
                      <input
                        placeholder="Team"
                        value={b.team ?? ''}
                        onChange={(e) => setRow(b.id, { team: e.target.value })}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn red small"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => deleteRow(b.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" className="btn small" onClick={addRow}>
              + Add Birthday
            </button>
            <div style={{ flexGrow: 1 }} />
            <button
              type="button"
              className="btn small"
              disabled={!dirty}
              onClick={handleSave}
            >
              Save Changes
            </button>
            <button
              type="button"
              className="btn ghost small"
              disabled={!dirty}
              onClick={handleDiscard}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- shared footer ---------------- */

function EditorActions({
  dirty,
  onSave,
  onDiscard,
  onDelete,
}: {
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="btn-row editor-actions">
      <button className="btn" disabled={!dirty} onClick={onSave}>
        Save
      </button>
      <button className="btn ghost" disabled={!dirty} onClick={onDiscard}>
        Discard
      </button>
      {onDelete && (
        <button className="btn red" onClick={onDelete}>
          Delete
        </button>
      )}
      <div style={{ flexGrow: 1 }} />
      <span className="muted">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
    </div>
  );
}
