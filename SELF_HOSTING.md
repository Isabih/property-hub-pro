# NOVAWORKS — Full Self-Hosting Guide (macOS)

This guide walks you through running the **entire system** (frontend + backend + database + storage + email + AI) on your own MacBook / your own infrastructure, with **no dependency on Lovable Cloud**.

> Stack: TanStack Start (React 19 + Vite 7) · Supabase (Postgres + Auth + Storage) · Cloudflare R2 (media) · Resend (email) · Lovable AI Gateway *(or any OpenAI-compatible provider)*

---

## 0. What you are hosting

| Layer | Tech | Where it runs |
|---|---|---|
| Frontend (SSR) | TanStack Start (Vite, Node/Bun server) | Your Mac → later: VPS / Cloudflare / Vercel |
| Backend (server functions) | Same TanStack Start server | Same process as frontend |
| Database + Auth | Supabase (Postgres) | Self-host via Docker OR keep cloud Supabase |
| File storage (photos/videos) | Cloudflare R2 (S3-compatible) | Cloudflare (free tier OK) |
| Email sending | Resend | Resend.com |
| AI chat (NOVA AI) | Lovable AI Gateway or OpenAI/Gemini | External API |

There is **no separate backend project** — `createServerFn` handlers and `/api/*` routes live inside the same TanStack Start app. One build, one process.

---

## 1. Install prerequisites on macOS

Open Terminal and install Homebrew if you don't have it:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install everything you'll need:

```bash
brew install git node bun docker
brew install --cask docker      # Docker Desktop (needed for self-hosting Supabase)
npm i -g supabase                # Supabase CLI (for migrations)
```

Verify:

```bash
node -v   # >= 20
bun -v    # >= 1.1
docker -v
supabase -v
```

Start Docker Desktop once (from Applications) so the daemon is running.

---

## 2. Get the code

```bash
git clone <your-repo-url> novaworks
cd novaworks
bun install
```

---

## 3. Database + Auth (choose ONE)

### Option A — Keep using Lovable Cloud's Supabase (easiest)
You already have it. Skip to step 4. Your existing `.env` values for
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the matching `VITE_*` keys work as-is.

> Note: `SUPABASE_SERVICE_ROLE_KEY` is **not retrievable** from a Lovable-managed project. If you need it, switch to Option B or to your own Supabase Cloud project.

### Option B — Your own Supabase Cloud project (recommended)
1. Go to https://supabase.com → New Project (free tier).
2. After it provisions, open **Project Settings → API**. Copy:
   - `Project URL` → `SUPABASE_URL` (and `VITE_SUPABASE_URL`)
   - `anon public` key → `SUPABASE_PUBLISHABLE_KEY` (and `VITE_SUPABASE_PUBLISHABLE_KEY`)
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(secret — server only)*
   - Project ref (`abcd1234`) → `SUPABASE_PROJECT_ID` (and `VITE_SUPABASE_PROJECT_ID`)
3. Push your schema:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
4. In Supabase Dashboard → **Authentication → URL Configuration**, add `http://localhost:8080` and your future production URL to *Site URL* and *Redirect URLs*.
5. Enable any providers you want under **Authentication → Providers** (Email is on by default; add Google if needed).

### Option C — Fully self-hosted Supabase via Docker (most control)
```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# Edit .env: change POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, SITE_URL
docker compose up -d
```
- Studio (DB UI): http://localhost:54323
- API: http://localhost:8000
- Use those URL/keys as `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
- Run `supabase db push` against the local DB to apply the project's migrations.
- Full docs: https://supabase.com/docs/guides/self-hosting/docker

---

## 4. Cloudflare R2 (media uploads)

Used for property photos/videos. Free tier: 10 GB storage + 1M reads/month.

1. Create a Cloudflare account → https://dash.cloudflare.com
2. Sidebar → **R2** → enable it (asks for a credit card but the free tier won't charge).
3. **Create bucket** → name it e.g. `novaworks-media` → this is `R2_BUCKET`.
4. Bucket → **Settings → Public access** → enable **R2.dev subdomain** (or attach a custom domain). Copy the public URL → `R2_PUBLIC_BASE_URL` (e.g. `https://pub-xxxxxxxx.r2.dev`).
5. R2 home → right sidebar → **Account ID** → `R2_ACCOUNT_ID`.
6. R2 home → **Manage R2 API Tokens → Create API Token**:
   - Permission: **Object Read & Write**
   - Specify bucket: select your bucket
   - Create → copy `Access Key ID` → `R2_ACCESS_KEY_ID`
   - Copy `Secret Access Key` → `R2_SECRET_ACCESS_KEY` *(shown only once!)*
7. **CORS** (bucket → Settings → CORS Policy):
   ```json
   [{
     "AllowedOrigins": ["http://localhost:8080", "https://yourdomain.com"],
     "AllowedMethods": ["PUT","GET","HEAD"],
     "AllowedHeaders": ["*"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3600
   }]
   ```

---

## 5. Resend (email)

Used for password-reset OTPs, staff notifications, service-request emails.

1. Sign up at https://resend.com
2. **API Keys → Create API Key** → name it `novaworks-prod` → permission `Full access` → copy → `RESEND_API_KEY` *(shown once)*.
3. **Domains → Add Domain** → enter e.g. `novaworks.rw` → Resend shows DNS records (SPF, DKIM, optional DMARC).
4. Add those records at your domain registrar (Cloudflare DNS, Namecheap, etc.) and wait until Resend marks the domain **Verified** (usually < 30 min).
5. In the IT dashboard → **Settings**, set `from_email` to e.g. `noreply@novaworks.rw`.

> For testing only, you can send from `onboarding@resend.dev` without a verified domain.

---

## 6. AI key (NOVA AI chatbot)

The current code uses Lovable's AI Gateway. For self-hosted you have two choices:

**A. Keep Lovable AI Gateway** — request a `LOVABLE_API_KEY` from Lovable support (paid).

**B. Switch to OpenAI or Google Gemini** (recommended for self-host):
1. Get a key from https://platform.openai.com/api-keys or https://aistudio.google.com/apikey
2. Edit `src/lib/ai-gateway.server.ts` to point at the provider's base URL:
   ```ts
   // OpenAI
   baseURL: "https://api.openai.com/v1",
   headers: { Authorization: `Bearer ${apiKey}` },
   ```
   And in `src/routes/api/chat.ts` change the model id (e.g. `gpt-4o-mini`).
3. Put the key in `LOVABLE_API_KEY` (name kept for compatibility) or rename the env var across both files.

If you don't need AI chat, leave the key empty — the `/api/chat` endpoint will just return 500 when called; the rest of the app still works.

---

## 7. Create your `.env`

At the project root, create a file named `.env`:

```env
# --- Supabase (client-visible) ---
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi...anon-key"
VITE_SUPABASE_PROJECT_ID="YOUR-PROJECT"

# --- Supabase (server-only) ---
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi...anon-key"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi...service-role-key"   # SECRET
SUPABASE_PROJECT_ID="YOUR-PROJECT"

# --- Cloudflare R2 ---
R2_ACCOUNT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
R2_ACCESS_KEY_ID="xxxxxxxxxxxxxxxxxxxx"
R2_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
R2_BUCKET="novaworks-media"
R2_PUBLIC_BASE_URL="https://pub-xxxxxxxx.r2.dev"

# --- Email ---
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"

# --- AI ---
LOVABLE_API_KEY="sk-..."   # OpenAI/Gemini/Lovable key
```

Add `.env` to `.gitignore` (it already is). **Never commit it.**

---

## 8. Run it locally

```bash
bun run dev
```

Open http://localhost:8080

- Frontend, server functions, and `/api/*` routes are all served from this one process.
- Hot reload on save.
- First-time: create a user via `/auth`, then in Supabase Studio insert a row into `public.user_roles` with `role='it'` for that user to access the IT dashboard.

---

## 9. Production build

```bash
bun run build
bun run start    # serves the built app
```

The build output is a Node/Edge server bundle. Deploy options:

| Target | How |
|---|---|
| **Your Mac / a VPS** | `bun run start` behind nginx + PM2/systemd |
| **Cloudflare Workers** | `wrangler deploy` (vite.config already targets Workers) |
| **Vercel / Netlify** | Detects TanStack Start automatically |
| **Docker** | Wrap `bun run start` in a `Dockerfile` (Node 20-alpine base) |

On the production host, set every env var from step 7 in the host's env (Cloudflare dashboard → Workers → Settings → Variables, Vercel → Project → Settings → Environment Variables, etc.). **No `.env` file gets deployed.**

---

## 10. Where to get each key — quick reference

| Variable | Source |
|---|---|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_…` | Same page → `anon public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` *(secret)* |
| `SUPABASE_PROJECT_ID` / `VITE_…` | The `xxxx` part of `xxxx.supabase.co` |
| `R2_ACCOUNT_ID` | Cloudflare dashboard → R2 → right sidebar |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare → R2 → Manage R2 API Tokens → Create |
| `R2_BUCKET` | The bucket name you created in R2 |
| `R2_PUBLIC_BASE_URL` | R2 bucket → Settings → Public R2.dev URL or custom domain |
| `RESEND_API_KEY` | https://resend.com/api-keys → Create API Key |
| `LOVABLE_API_KEY` | OpenAI/Gemini/Lovable provider account |

---

## 11. Common issues

- **Blank page / 500 on `/auth`** → missing `VITE_SUPABASE_*` vars. Restart `bun run dev` after editing `.env`.
- **Uploads fail** → R2 CORS policy missing your domain, or `R2_PUBLIC_BASE_URL` wrong.
- **Emails not sending** → domain not verified in Resend, or `from_email` uses an unverified domain.
- **"Unauthorized: No authorization header"** in server logs → user isn't signed in; the auth middleware is working as designed.
- **Service-role queries fail with "Expected 3 parts in JWT"** → you pasted the wrong key shape. Use the JWT-style `eyJ…` key from Supabase, not a `sb_secret_…` value.

---

## 12. Minimum monthly cost (self-hosted)

| Service | Free tier covers | Paid starts at |
|---|---|---|
| Supabase Cloud | 500 MB DB, 1 GB storage, 50k MAU | $25/mo (Pro) |
| Cloudflare R2 | 10 GB + 1M reads | $0.015/GB after |
| Resend | 3,000 emails/mo, 1 domain | $20/mo (50k emails) |
| OpenAI/Gemini | Pay-as-you-go | ~$0.15 / 1M tokens (gpt-4o-mini) |
| Hosting (Cloudflare Workers free) | 100k req/day | $5/mo (Workers Paid) |

You can run the entire system on free tiers while you test.

---

**Done.** Once `.env` is filled in and `bun run dev` starts cleanly, the system is fully self-hosted end-to-end.