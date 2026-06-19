// Direct browser image uploads to Cloudinary via an UNSIGNED upload preset.
// No backend needed: the browser POSTs the file straight to Cloudinary and gets
// back a hosted, CDN-delivered URL that we store in Firestore like any other
// image URL. Config comes from env vars (see .env.example / CLOUDINARY_SETUP.md).
//
// These values are not secret — an unsigned preset is designed to be used from
// the browser. Keep the preset restricted to images in the Cloudinary console.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryEnabled = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export async function uploadImage(file: File): Promise<string> {
  if (!cloudinaryEnabled) {
    throw new Error('Cloudinary is not configured — see CLOUDINARY_SETUP.md');
  }

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET as string);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status}). ${detail}`);
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error('Upload succeeded but no URL was returned.');
  return data.secure_url;
}
