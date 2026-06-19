import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData, firebaseEnabled } from '../store/useData';
import type { Birthday, Campaign, Settings, SocialStat } from '../types';
import { ImageInput } from './ImageInput';
import './admin.css';

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;

// Phase-1 config portal. Password is intentionally stubbed for now (see the
// notice banner) — real Firebase Auth lands in a later phase. Everything edited
// here writes to the shared store and updates the live display instantly.

export function Admin() {
  const { data, resetToDemo, saveCampaign, saveBirthday } = useData();

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

        <SettingsEditor />

        <div className="admin-header" style={{ marginTop: 8 }}>
          <h2 style={{ margin: 0, border: 'none' }}>Campaigns</h2>
          <div className="grow" />
          <button
            className="btn small"
            onClick={() =>
              saveCampaign({
                id: newId(),
                title: 'New campaign',
                tagline: 'Add a short tagline',
                status: 'upcoming',
                startDate: new Date().toISOString().slice(0, 10),
                endDate: new Date().toISOString().slice(0, 10),
                keyVisualUrl: '',
                portraitUrl: '',
                youtubeUrl: '',
                stats: [],
              })
            }
          >
            + Add campaign
          </button>
        </div>
        {data.campaigns.map((c) => (
          <CampaignEditor key={c.id} campaign={c} />
        ))}

        <div className="admin-header" style={{ marginTop: 8 }}>
          <h2 style={{ margin: 0, border: 'none' }}>Birthdays</h2>
          <div className="grow" />
          <button
            className="btn small"
            onClick={() => saveBirthday({ id: newId(), name: 'New person', date: '01-01', team: '', photoUrl: '' })}
          >
            + Add birthday
          </button>
        </div>
        {data.birthdays.map((b) => (
          <BirthdayEditor key={b.id} birthday={b} />
        ))}
      </div>
    </div>
  );
}

function SettingsEditor() {
  const { data, updateSettings } = useData();
  const [draft, setDraft] = useState<Settings>(data.settings);
  const set = (patch: Partial<Settings>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <>
      <h2>Display settings</h2>
      <div className="card">
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
        <div className="btn-row">
          <button className="btn" onClick={() => updateSettings(draft)}>
            Save settings
          </button>
          <span className="muted">Changes apply to the live screen immediately.</span>
        </div>
      </div>
    </>
  );
}

function CampaignEditor({ campaign }: { campaign: Campaign }) {
  const { saveCampaign, deleteCampaign } = useData();
  const [draft, setDraft] = useState<Campaign>(campaign);
  const set = (patch: Partial<Campaign>) => setDraft((d) => ({ ...d, ...patch }));

  const setStat = (id: string, patch: Partial<SocialStat>) =>
    set({ stats: draft.stats.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const addStat = () =>
    set({ stats: [...draft.stats, { id: newId(), label: 'Metric', value: '0', delta: '', trend: 'up', platform: '' }] });
  const removeStat = (id: string) => set({ stats: draft.stats.filter((s) => s.id !== id) });

  return (
    <div className="card">
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

      <div className="btn-row">
        <button className="btn" onClick={() => saveCampaign(draft)}>
          Save campaign
        </button>
        <button className="btn red" onClick={() => deleteCampaign(campaign.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

function BirthdayEditor({ birthday }: { birthday: Birthday }) {
  const { saveBirthday, deleteBirthday } = useData();
  const [draft, setDraft] = useState<Birthday>(birthday);
  const set = (patch: Partial<Birthday>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="card">
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

      <div className="btn-row">
        <button className="btn" onClick={() => saveBirthday(draft)}>
          Save birthday
        </button>
        <button className="btn red" onClick={() => deleteBirthday(birthday.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
