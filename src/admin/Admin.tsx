import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData, firebaseEnabled } from '../store/useData';
import type { Birthday, Campaign, Settings, SocialStat } from '../types';
import { ImageInput } from './ImageInput';
import './admin.css';

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;

const isDirty = <T,>(a: T, b: T) => JSON.stringify(a) !== JSON.stringify(b);

// Config portal. Each item shows a compact summary row; clicking it expands the
// full editor. Edits are held in a local draft until you Save (writes to the
// shared store / live wall) or Discard (reverts to the last saved values).

export function Admin() {
  const { data, resetToDemo, saveCampaign, saveBirthday } = useData();
  const [openId, setOpenId] = useState<string | null>(null);

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
      keyVisualUrl: '',
      portraitUrl: '',
      youtubeUrl: '',
      stats: [],
    });
    setOpenId(id);
  };

  const addBirthday = () => {
    const id = newId();
    saveBirthday({ id, name: 'New person', date: '01-01', team: '', photoUrl: '' });
    setOpenId(id);
  };

  return (
    <div className="admin">
      <div className="admin-inner">
        <div className="admin-header">
          <h1>Dashboard config</h1>
          <div className="grow" />
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

        <SectionHeader title="Birthdays" count={data.birthdays.length} onAdd={addBirthday} addLabel="+ Add birthday" />
        <div className="item-list">
          {data.birthdays.length === 0 && <div className="empty-hint">No birthdays yet.</div>}
          {data.birthdays.map((b) => (
            <BirthdayRow key={b.id} birthday={b} open={openId === b.id} onToggle={() => toggle(b.id)} />
          ))}
        </div>
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
  const set = (patch: Partial<Settings>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = isDirty(draft, data.settings);

  return (
    <div className="panel">
      <button className="item-row" onClick={() => setOpen((o) => !o)}>
        <span className="item-icon">⚙️</span>
        <div className="item-main">
          <div className="item-title">Display settings {dirty && <span className="dirty-dot" title="Unsaved" />}</div>
          <div className="item-meta">
            {draft.brandName} · rotate {draft.rotationSeconds}s · birthdays {draft.birthdayWindowDays}d ·{' '}
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

/* ---------------- Campaign ---------------- */

function CampaignRow({ campaign, open, onToggle }: { campaign: Campaign; open: boolean; onToggle: () => void }) {
  const { saveCampaign, deleteCampaign } = useData();
  const [draft, setDraft] = useState<Campaign>(campaign);
  const set = (patch: Partial<Campaign>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = isDirty(draft, campaign);

  const thumb = draft.keyVisualUrl || draft.portraitUrl;

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
            <span className={`pill ${draft.status}`}>{draft.status === 'ongoing' ? 'Ongoing' : 'Upcoming'}</span>
            <span>
              {draft.startDate}
              {draft.endDate && draft.endDate !== draft.startDate ? ` → ${draft.endDate}` : ''}
            </span>
            <span>· {draft.stats.length} stats</span>
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
          <div className="row-3">
            <div className="field">
              <label>Status</label>
              <select value={draft.status} onChange={(e) => set({ status: e.target.value as Campaign['status'] })}>
                <option value="ongoing">Ongoing</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
            <div className="field">
              <label>Start date</label>
              <input type="date" value={draft.startDate} onChange={(e) => set({ startDate: e.target.value })} />
            </div>
            <div className="field">
              <label>End date</label>
              <input type="date" value={draft.endDate} onChange={(e) => set({ endDate: e.target.value })} />
            </div>
          </div>
          <ImageInput
            label="Key visual (landscape)"
            value={draft.keyVisualUrl ?? ''}
            onChange={(url) => set({ keyVisualUrl: url })}
          />
          <div className="row">
            <ImageInput
              label="Portrait image (tall)"
              value={draft.portraitUrl ?? ''}
              onChange={(url) => set({ portraitUrl: url })}
            />
            <div className="field">
              <label>YouTube URL</label>
              <input value={draft.youtubeUrl ?? ''} onChange={(e) => set({ youtubeUrl: e.target.value })} />
            </div>
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
            onDiscard={() => setDraft(campaign)}
            onDelete={() => deleteCampaign(campaign.id)}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- Birthday ---------------- */

function BirthdayRow({ birthday, open, onToggle }: { birthday: Birthday; open: boolean; onToggle: () => void }) {
  const { saveBirthday, deleteBirthday } = useData();
  const [draft, setDraft] = useState<Birthday>(birthday);
  const set = (patch: Partial<Birthday>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = isDirty(draft, birthday);

  return (
    <div className={`panel ${open ? 'is-open' : ''}`}>
      <button className="item-row" onClick={onToggle}>
        {draft.photoUrl ? (
          <img className="item-thumb round" src={draft.photoUrl} alt="" />
        ) : (
          <div className="item-thumb round empty">🎂</div>
        )}
        <div className="item-main">
          <div className="item-title">
            {draft.name || 'Unnamed'} {dirty && <span className="dirty-dot" title="Unsaved" />}
          </div>
          <div className="item-meta">
            <span>{draft.date}</span>
            {draft.team && <span>· {draft.team}</span>}
          </div>
        </div>
        <span className={`chevron ${open ? 'up' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="item-detail">
          <div className="row-3">
            <div className="field">
              <label>Name</label>
              <input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div className="field">
              <label>Date (MM-DD)</label>
              <input value={draft.date} placeholder="06-21" onChange={(e) => set({ date: e.target.value })} />
            </div>
            <div className="field">
              <label>Team</label>
              <input value={draft.team ?? ''} onChange={(e) => set({ team: e.target.value })} />
            </div>
          </div>
          <ImageInput label="Photo" value={draft.photoUrl ?? ''} onChange={(url) => set({ photoUrl: url })} />
          <EditorActions
            dirty={dirty}
            onSave={() => saveBirthday(draft)}
            onDiscard={() => setDraft(birthday)}
            onDelete={() => deleteBirthday(birthday.id)}
          />
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
      <span className="muted">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
      <div className="grow" />
      {onDelete && (
        <button className="btn red" onClick={onDelete}>
          Delete
        </button>
      )}
    </div>
  );
}
