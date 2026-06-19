# Image uploads setup (Cloudinary)

This lets the team **upload images directly** from the `/admin` page instead of
pasting URLs. We use Cloudinary's free tier — generous, no credit card, and the
images are served fast over a CDN (ideal for the TV). You do this once.

Until it's set up, the image fields still work as plain URL boxes (paste a link).

---

## 1. Create a free Cloudinary account

1. Go to <https://cloudinary.com/users/register_free> and sign up.
2. When asked, you can skip/ignore framework questions.
3. On the dashboard, note your **Cloud name** (also called "Product environment").
   It's a short string like `rmitvn-mkt` — you'll need it in step 3.

## 2. Create an UNSIGNED upload preset

This is what lets the browser upload without a secret key.

1. Go to **Settings** (gear icon) → **Upload** tab.
2. Scroll to **Upload presets** → **Add upload preset**.
3. Set **Signing Mode** to **Unsigned**.
4. Copy the **preset name** it generates (e.g. `ml_default` or one you rename like
   `mkt_dashboard`).
5. (Recommended) On the same preset, set **Folder** to `mkt-dashboard` to keep
   uploads tidy, and under **Allowed formats** restrict to `jpg,png,webp,gif`.
6. **Save**.

## 3. Add the two values to the app

1. Open the project's `.env.local` (the same file with the Firebase keys).
2. Add these two lines:

   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-preset-name
   ```

3. Save the file and **restart** the dev server (Vite only reads env vars at
   startup).

## 4. Confirm it works

1. Open <http://localhost:5173/admin>.
2. On any campaign, the image fields now show an **"⬆ Upload image"** button.
3. Click it, pick a photo — it uploads and the URL fills in automatically. The
   image appears on the live wall within ~1 second.

---

## Deploying (Netlify)

Add the same two `VITE_CLOUDINARY_*` variables under **Site settings →
Environment variables**, then redeploy.

## Notes

- The "Upload image" button only appears once the two env vars are set; otherwise
  the field stays a plain URL box.
- Uploaded image URLs are stored in Firestore just like pasted URLs, so existing
  links keep working — uploading is simply an easier way to get a URL.
- Free tier is ~25 GB storage and ~25 GB/month delivery. For a dashboard with a
  handful of campaign images this is far more than enough.
