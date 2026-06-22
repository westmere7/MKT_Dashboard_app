import { useRef, useState } from 'react';
import { cloudinaryEnabled, uploadImage } from '../lib/cloudinary';

// A field for a LIST of images: upload one or many (to Cloudinary) and/or paste
// URLs. Thumbnails show the gallery in order, each with a quick ✕ to remove.
// Falls back to URL-only when Cloudinary isn't configured.

export function ImageGalleryInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [uploadState, setUploadState] = useState<{ current: number; total: number; percent: number } | null>(null);

  const removeAt = (i: number) => onChange(value.filter((_, j) => j !== i));

  const addUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    onChange([...value, u]);
    setUrlDraft('');
  };

  const onPick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const fileArray = Array.from(files);
    setUploadState({ current: 1, total: fileArray.length, percent: 0 });
    try {
      const urls: string[] = [];
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadState({ current: i + 1, total: fileArray.length, percent: 0 });
        const url = await uploadImage(file, (p) => {
          setUploadState({ current: i + 1, total: fileArray.length, percent: p });
        });
        urls.push(url);
      }
      onChange([...value, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      setUploadState(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="field">
      <label>
        {label}
        {value.length > 0 && <span className="gallery-count"> · {value.length}</span>}
      </label>

      <div className="gallery">
        {value.map((url, i) => (
          <div className="gallery-thumb" key={`${url}-${i}`}>
            <img src={url} alt="" />
            <button type="button" className="gallery-remove" title="Remove" onClick={() => removeAt(i)}>
              ✕
            </button>
          </div>
        ))}
        {cloudinaryEnabled && (
          <button
            type="button"
            className="gallery-add"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            title="Upload image(s)"
          >
            {busy ? <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '1.5px' }}></span> : '＋'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onPick(e.target.files)} />
      </div>

      <div className="gallery-url-row">
        <input
          placeholder="…or paste an image URL"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button type="button" className="btn ghost small" onClick={addUrl} disabled={!urlDraft.trim()}>
          Add
        </button>
      </div>

      {uploadState && (
        <span className="upload-progress-info" style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--rmit-red)', marginTop: '4px', display: 'block' }}>
          Uploading {uploadState.total > 1 ? `${uploadState.current} of ${uploadState.total}` : ''} ({uploadState.percent}%)…
        </span>
      )}

      {!cloudinaryEnabled && (
        <span className="muted">Image upload off — set up Cloudinary (see CLOUDINARY_SETUP.md) to upload files.</span>
      )}
      {error && <span className="image-error">{error}</span>}
    </div>
  );
}
