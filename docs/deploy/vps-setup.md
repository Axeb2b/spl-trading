# VPS Deployment Guide — SPL Trading

Self-contained guide to deploy this app to a Linux VPS. No Cloudflare, no rewrite — the SQLite file backend works as-is.

## 1. Requirements

| Resource | Minimum | Recommended | Why |
|---|---|---|---|
| CPU | 1 vCPU | 2 vCPU | Build is the heavy part; runtime is light |
| RAM | 2 GB | 4 GB | `next build` peaks ~1.5 GB; runtime ~150 MB |
| Disk | 10 GB | 25 GB | Build tree ~830 MB, deploy ~40 MB, logs + DB growth |
| OS | Ubuntu 22.04 | Ubuntu 24.04 LTS | `node:sqlite` needs glibc; tested path |
| Node | **24.x** | 24.x LTS | `engines.node: ">=24"`; `node:sqlite` is stable |
| Network | 1 public IPv4, ports 80/443 open | + SSH key auth | nginx + certbot |

### Disk breakdown (measured on this repo)

| Path | Size | On VPS? |
|---|---|---|
| `.next/standalone/` (pruned server + bundled deps) | 37 MB | yes |
| `.next/static/` (client JS/CSS) | 1.8 MB | yes |
| `public/` (static assets) | 14 KB | yes |
| `data/spl.sqlite` | 168 KB → grows | yes (persist!) |
| Full `node_modules` | 562 MB | build machine only |
| Full `.next` (webpack cache) | 255 MB | build machine only |
| `src/` + config | 6.9 MB | build machine only |

Two strategies:

- **A. Build on the VPS** — self-contained, needs ~1 GB free during build, ~40 MB after pruning.
- **B. Build locally, rsync the standalone output** — VPS needs only ~50 MB + Node; no build toolchain on the server.

Option B is recommended: the Termux machine already produces a working build, and it keeps the VPS minimal.

---

## 2. Fresh VPS setup (once)

```bash
# as root
apt update && apt upgrade -y
apt install -y curl git build-essential sqlite3

# create deploy user
adduser deploy
usermod -aG sudo deploy
# switch to deploy, then:
```

### Node 24 via nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.bashrc
nvm install 24
nvm alias default 24
node -v   # must print v24.x
```

### pm2 + nginx + certbot

```bash
sudo apt install -y nginx
npm i -g pm2
sudo apt install -y certbot python3-certbot-nginx
```

---

## 3. App deploy

### Option A — build on the VPS

```bash
git clone <repo-url> ~/spl-trading && cd ~/spl-trading
npm ci
npm run build
```

### Option B — build locally, ship artifacts (recommended)

On the **build machine** (this Termux box):

```bash
cd ~/projects/ai-website-cloner-template
npm run build

# assemble a clean deploy bundle
rm -rf /tmp/spl-deploy && mkdir -p /tmp/spl-deploy
cp -r .next/standalone/* /tmp/spl-deploy/
cp -r .next/static  /tmp/spl-deploy/.next/static
cp -r public        /tmp/spl-deploy/public
mkdir -p /tmp/spl-deploy/data
```

To the **VPS**:

```bash
rsync -az --delete /tmp/spl-deploy/ deploy@<VPS_IP>:~/spl-trading/
```

> If you prefer git on the server, clone and run Option A instead — both end at the same `node .next/standalone/server.js`.

### Environment

On the VPS, create `~/spl-trading/.env` (or export in pm2 ecosystem):

```bash
# generate a real secret — do NOT reuse the dev one
openssl rand -hex 32   # paste as SPL_SESSION_SECRET

SPL_SESSION_SECRET=<paste>
SPL_LIVE_MODE=0
SPL_DB_PATH=/home/deploy/spl-trading/data/spl.sqlite
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

- `SPL_LIVE_MODE=0` keeps money-movement POSTs returning 403 (compliance gate). Flip to `1` only when you intentionally enable live money features.
- `SPL_DB_PATH` must point to a persistent, backed-up path — never `/tmp`.

### Seed admin (first run)

```bash
cd ~/spl-trading
ADMIN_EMAIL=admin@spl.local ADMIN_PASSWORD=$(openssl rand -hex 16) \
  node scripts/seed-admin.mjs
# note the password printed — it is not stored anywhere else
```

### Start with pm2

`ecosystem.config.cjs` in the repo root:

```js
module.exports = {
  apps: [{
    name: "spl-trading",
    script: ".next/standalone/server.js",
    cwd: "/home/deploy/spl-trading",
    instances: 1,
    max_memory_restart: "400M",
    env: { NODE_ENV: "production", PORT: 3000, HOSTNAME: "0.0.0.0" },
    error_file: "/home/deploy/spl-trading/logs/err.log",
    out_file: "/home/deploy/spl-trading/logs/out.log",
    merge_logs: true,
  }],
};
```

```bash
mkdir -p ~/spl-trading/logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # follow the printed sudo command
curl -I http://127.0.0.1:3000   # expect 200/307
```

---

## 4. HTTPS via nginx + certbot

`/etc/nginx/sites-available/spl-trading`:

```nginx
server {
    listen 80;
    server_name your.domain.com;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/spl-trading /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your.domain.com
```

---

## 5. SQLite care

The DB is a single file — treat it like a small stateful service.

```bash
# nightly backup (cron)
crontab -e
0 3 * * * sqlite3 /home/deploy/spl-trading/data/spl.sqlite ".backup '/home/deploy/spl-trading/backups/spl-$(date +\%F).sqlite'" && find /home/deploy/spl-trading/backups -mtime +14 -delete
```

- Never edit the live DB while the app is writing (WAL mode helps, but take backups first).
- Migrations live in `src/lib/migrations/` and run on boot; no manual step.

---

## 6. Update / redeploy

**Option B (recommended):**

```bash
# build machine
npm run check && npm run build
# reassemble /tmp/spl-deploy as above, then:
rsync -az --delete /tmp/spl-deploy/ deploy@<VPS_IP>:~/spl-trading/
ssh deploy@<VPS_IP> 'cd ~/spl-trading && pm2 restart spl-trading'
```

**Option A (git on VPS):**

```bash
cd ~/spl-trading && git pull && npm ci && npm run build && pm2 restart spl-trading
```

---

## 7. Health checks

```bash
pm2 status                      # online, not errored
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/   # 200
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:3000/api/auth/login   # expect 410 (local-only stub)
curl -s -o /dev/null -w "%{http_code}\n" https://your.domain.com/  # 200 via nginx+TLS
```

- Signed-in cabinet routes should 200 with a valid session cookie, 307 without.
- Money-movement endpoints (`/api/v1/deposits`, `/api/v1/payouts` POST) should 403 while `SPL_LIVE_MODE=0`.

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `pm2` shows `errored`, log says `Cannot find module ... .next/standalone` | static/public not copied | re-run the `cp -r .next/static` + `cp -r public` steps |
| `ENOTFOUND`/`EAI_AGAIN` during `npm ci` | VPS DNS | `echo 'nameserver 8.8.8.8' \| sudo tee /etc/resolv.conf` |
| 502 from nginx | app not listening on 0.0.0.0 | check `HOSTNAME=0.0.0.0` in pm2 env |
| `SqliteError: unable to open database file` | wrong `SPL_DB_PATH` perms | `chown -R deploy:deploy ~/spl-trading/data` |
| Session cookie rejected after redeploy | `SPL_SESSION_SECRET` changed | keep the secret stable across deploys |
| `node:sqlite` import error | Node < 22.5 or < 24 | `nvm install 24` |
