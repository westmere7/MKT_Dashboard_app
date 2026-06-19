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

export function uploadImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
  if (!cloudinaryEnabled) {
    return Promise.reject(new Error('Cloudinary is not configured — see CLOUDINARY_SETUP.md'));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', UPLOAD_PRESET as string);

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, true);

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { secure_url?: string };
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new Error('Upload succeeded but no URL was returned.'));
          }
        } catch {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status}). ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Upload network error occurred.'));
    };

    xhr.send(form);
  });
}
