# Deploying Fruzi Bowl to Cloudflare

This project is a TanStack Start app that builds to a Cloudflare Worker
(with static assets). Recommended path: **Cloudflare Workers** (matches
the build output). Cloudflare Pages also works.

---

## 1. Build locally

```bash
bun install
bun run build
```

Produces `.output/`:
- `.output/server/index.mjs` — Worker entry
- `.output/public/` — static assets

---

## 2. Deploy to Cloudflare Workers (recommended)

Install Wrangler once:

```bash
npm i -g wrangler
wrangler login
```

Deploy:

```bash
wrangler deploy
```

Wrangler reads `wrangler.toml` (already included). Site goes live at
`https://fruzi-bowl.<your-subdomain>.workers.dev`.

### Attach your custom domain `fruzibowl.shop`

1. Cloudflare dashboard → **Websites → Add a site** → enter
   `fruzibowl.shop`. Pick the Free plan.
2. Cloudflare shows **2 nameservers** (e.g. `xxx.ns.cloudflare.com`,
   `yyy.ns.cloudflare.com`).
3. In **GoDaddy** → **My Products → fruzibowl.shop → DNS → Nameservers
   → Change → I'll use my own nameservers** → paste the two Cloudflare
   nameservers → Save. Propagation: minutes to 24h.
4. Once Cloudflare marks the domain **Active**: open your Worker
   (**Workers & Pages → fruzi-bowl → Settings → Domains & Routes → Add
   Custom Domain**) and add:
   - `fruzibowl.shop`
   - `www.fruzibowl.shop`

   Cloudflare auto-creates DNS records and provisions SSL. Done — no
   manual A/CNAME on GoDaddy required.

> Prefer to keep GoDaddy's nameservers? In GoDaddy DNS add
> **CNAME `@` → fruzi-bowl.<subdomain>.workers.dev** and
> **CNAME `www` → same target**. Nameserver delegation is smoother and
> gives you free Cloudflare SSL/CDN, so it's the recommended route.

---

## 3. Alternative: Cloudflare Pages

1. Push repo to GitHub.
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - Framework preset: **None**
   - Build command: `bun run build`
   - Build output directory: `.output/public`
   - Env var: `NODE_VERSION = 20`
4. **Custom domains** tab → add `fruzibowl.shop` and `www.fruzibowl.shop`
   (same GoDaddy nameserver swap as above).

The app is client-rendered after hydration, so static Pages works fine
even without wiring the SSR worker.

---

## 4. GoDaddy checklist

| Task | Where in GoDaddy | Value |
|------|------------------|-------|
| Change nameservers | Domain → DNS → Nameservers → Change | The 2 nameservers Cloudflare gave you |
| Remove parking / forwarding | Domain → Forwarding | Delete any active forward |
| (Only if NOT delegating NS) CNAME `@` | DNS records | `fruzi-bowl.<subdomain>.workers.dev` |
| (Only if NOT delegating NS) CNAME `www` | DNS records | same target |

You do **not** need GoDaddy hosting, SSL, or email add-ons. Cloudflare
issues SSL free.

---

## 5. EmailJS / secrets

EmailJS is client-side; keys live in `src/data/menuData.js`. No
server secrets required. For future server secrets use
`wrangler secret put NAME` (Workers) or the Pages env vars UI.
