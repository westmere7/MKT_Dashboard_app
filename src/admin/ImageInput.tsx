import { useRef, useState } from 'react';
import { cloudinaryEnabled, uploadImage } from '../lib/cloudinary';

// A field for a single image: upload a file (to Cloudinary) or paste a URL.
// Falls back to URL-only when Cloudinary isn't configured, so the admin keeps
// working before image hosting is set up.

export function ImageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div className="image-input">
        {value ? (
          <img className="image-thumb" src={value} alt="" />
        ) : (
          <div className="image-thumb empty">No image</div>
        )}
        <div className="image-input-main">
          <input
            placeholder="Paste an image URL, or upload →"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="image-input-row">
            {cloudinaryEnabled ? (
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
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  {busy ? 'Uploading…' : '⬆ Upload image'}
                </button>
                {value && (
                  <button type="button" className="btn ghost small" onClick={() => onChange('')}>
                    Clear
                  </button>
                )}
              </>
            ) : (
              <span className="muted">Image upload off — set up Cloudinary (see CLOUDINARY_SETUP.md) to upload files.</span>
            )}
          </div>
          {error && <span className="image-error">{error}</span>}
        </div>
      </div>
    </div>
  );
}
