# Deploying Forge on Google Cloud (GCP)

Forge is a full-stack Next.js app (it has a server side), so it needs a host
that runs Node.js — not just static file hosting. Two GCP options:

- **Option A — Firebase App Hosting** ⭐ recommended (git-connected, auto-deploys).
- **Option B — Cloud Run** (you build a container yourself).

Both bill through your existing GCP billing account. Set `minInstances: 0`
(App Hosting) so it scales to zero and costs ~nothing while idle.

---

## Option A — Firebase App Hosting (recommended)

**One-time setup:**

1. Fill in `apphosting.yaml` (in this repo) with your two Supabase values
   (Supabase → Project Settings → API). Commit + push.
2. Go to the **Firebase console** → https://console.firebase.google.com →
   **Add project**, and pick your existing GCP project (or make a new one).
   Make sure it's on the **Blaze** (pay-as-you-go) plan.
3. In the left menu open **App Hosting** → **Get started**.
4. **Connect GitHub** and choose the **`ForgeMot`** repo, branch
   `claude/ai-assistant-visually-impaired-ukk9t2` (or `main` once merged).
5. Firebase reads `apphosting.yaml`, builds the app, and gives you a live URL
   like `https://forge--<id>.web.app`.

**After that:** every `git push` to that branch auto-builds and deploys. Done.

> Supabase step: in Supabase → Authentication → URL Configuration, add your
> new App Hosting URL to the allowed redirect/site URLs.

---

## Option B — Cloud Run (container)

Uses the `Dockerfile` in this repo. You need the **gcloud CLI** installed and
logged in (`gcloud auth login`, `gcloud config set project YOUR_PROJECT_ID`).

The two `NEXT_PUBLIC_*` values must be passed at **build** time because they're
baked into the browser bundle. Easiest with a local Docker build:

```bash
# 1. Build the image (replace PROJECT_ID and the two Supabase values)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT-ref.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key" \
  -t gcr.io/PROJECT_ID/forge .

# 2. Push it to Google's container registry
docker push gcr.io/PROJECT_ID/forge

# 3. Deploy to Cloud Run
gcloud run deploy forge \
  --image gcr.io/PROJECT_ID/forge \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances 2
```

Cloud Run prints your live URL when it finishes. Add that URL to Supabase →
Authentication → URL Configuration.

> No Docker installed? App Hosting (Option A) avoids Docker entirely — prefer it.

---

## Which should I pick?

Use **App Hosting** unless you specifically want to manage containers. It's
simpler, git-connected, and auto-deploys — the closest GCP has to a one-click
Next.js deploy.
