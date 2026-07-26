# BlindAiGlass Reader — server setup

The **Read** feature (reading menus, signs, and labels out loud) uses a smart
cloud AI. That AI needs a secret **API key**, which must **never** live in the
phone's web page. So we put a tiny "middleman" server in between:

```
iPhone (web page)  →  this server (holds the secret key)  →  Claude AI  →  text back
```

The server code is `worker.js` in this folder. Below is how to put it online
for free. It takes about 10 minutes and you only do it once.

> You will need: a free **Cloudflare** account and an **Anthropic** API key.

---

## Step 1 — Get an Anthropic API key (~5 min)

1. Go to **https://console.anthropic.com** and sign up / log in.
2. Add a small amount of credit (a few dollars is plenty for testing —
   each photo read costs only a fraction of a cent to a few cents).
3. Open **API Keys** → **Create Key**. Copy the key (it starts with `sk-ant-`).
   Keep it somewhere private — treat it like a password.

---

## Step 2 — Put the server online with Cloudflare (~5 min)

1. Go to **https://dash.cloudflare.com** and sign up / log in (free).
2. In the left menu, click **Workers & Pages** → **Create** → **Create Worker**.
3. Give it a name, e.g. `blindaiglass-reader`, then **Deploy** (a starter
   version deploys first).
4. Click **Edit code**. Delete everything in the editor, then paste the entire
   contents of **`worker.js`** from this folder. Click **Deploy**.
5. Add the secret key so the server can use it:
   - Go to the Worker's **Settings** → **Variables and Secrets**.
   - Click **Add** → type name **`ANTHROPIC_API_KEY`** → paste your `sk-ant-…`
     key as the value → choose **Encrypt** / **Secret** → **Save**.
6. Copy the Worker's address at the top of the page. It looks like:
   `https://blindaiglass-reader.YOURNAME.workers.dev`

---

## Step 3 — Connect the app to your server

Open `app.js` in the main project folder and set this line near the top:

```js
const BACKEND_URL = "https://blindaiglass-reader.YOURNAME.workers.dev";
```

Save, commit, and push. GitHub Pages will update, and the **Read** button on
your iPhone will start working.

> Tell your developer (that's me!) the address and I can paste it in for you.

---

## Safety & privacy notes

- The **Read** feature sends **one photo** to the cloud only when you press the
  button — the camera is **never** streamed continuously to any server.
- Your secret key stays on Cloudflare's server, never on the phone.
- The model used is `claude-opus-5` at "low" effort (fast and inexpensive for
  reading text). To make reads even cheaper/faster you can change the `model`
  line in `worker.js` to `"claude-haiku-4-5"`.
