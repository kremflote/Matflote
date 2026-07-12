# MATFLOTE

MATFLOTE is a household meal planning and cookbook app.

## Docker

MATFLOTE runs as two containers:

- `frontend`: nginx serves the built frontend and proxies browser requests.
- `backend`: .NET API, SQLite database access, migrations, and image uploads.

Persistent data lives in Docker volumes:

- `matflote-data`: SQLite database at `/data/dinnerplanner.db`
- `matflote-images`: uploaded and seeded images at `/data/images`

## Run

```powershell
docker compose up -d --build
```

Open:

```text
http://localhost:8080
```

To use another host port, create `.env`:

```env
MATFLOTE_PORT=8095
```

Then open:

```text
http://localhost:8095
```

## LAN Access

On the server, find the local IP.

Windows:

```powershell
ipconfig
```

Linux/Raspberry Pi:

```bash
hostname -I
```

Then open from another device on the same network:

```text
http://<server-ip>:8080
```

If using a custom port:

```text
http://<server-ip>:8095
```

## Stop And Restart

```powershell
docker compose restart
```

```powershell
docker compose down
docker compose up -d
```

Data remains because the database and images are stored in Docker volumes.

Do not use this unless you want to delete all app data:

```powershell
docker compose down -v
```

## Backup

Create a backup folder first:

```powershell
New-Item -ItemType Directory -Force backups
```

Back up the SQLite volume:

```powershell
docker run --rm -v matflote-data:/data -v ${PWD}/backups:/backup alpine tar czf /backup/matflote-data.tar.gz -C /data .
```

Back up the image volume:

```powershell
docker run --rm -v matflote-images:/images -v ${PWD}/backups:/backup alpine tar czf /backup/matflote-images.tar.gz -C /images .
```

On Linux/Raspberry Pi, use shell-style current directory paths:

```bash
docker run --rm -v matflote-data:/data -v "$(pwd)/backups:/backup" alpine tar czf /backup/matflote-data.tar.gz -C /data .
docker run --rm -v matflote-images:/images -v "$(pwd)/backups:/backup" alpine tar czf /backup/matflote-images.tar.gz -C /images .
```

## Restore

Stop MATFLOTE first:

```powershell
docker compose down
```

Restore database volume:

```powershell
docker run --rm -v matflote-data:/data -v ${PWD}/backups:/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/matflote-data.tar.gz -C /data"
```

Restore image volume:

```powershell
docker run --rm -v matflote-images:/images -v ${PWD}/backups:/backup alpine sh -c "rm -rf /images/* && tar xzf /backup/matflote-images.tar.gz -C /images"
```

On Linux/Raspberry Pi:

```bash
docker run --rm -v matflote-data:/data -v "$(pwd)/backups:/backup" alpine sh -c "rm -rf /data/* && tar xzf /backup/matflote-data.tar.gz -C /data"
docker run --rm -v matflote-images:/images -v "$(pwd)/backups:/backup" alpine sh -c "rm -rf /images/* && tar xzf /backup/matflote-images.tar.gz -C /images"
```

Start again:

```powershell
docker compose up -d
```

## Update

```powershell
git pull
docker compose up -d --build
```

## Sync Model

Docker v1 uses shared-server sync. Phones, tablets, and computers stay in sync by connecting to the same MATFLOTE server.

There are no accounts, users, households, or offline multi-device sync in this milestone. Those would be future architecture decisions.

## Shopping List Export

MATFLOTE can export generated shopping lists through a provider model. Vikunja is the first supported provider; other todo systems can be added later as separate exporters without changing the grocery-list builder.

Configure Vikunja through environment variables, not committed files:

```env
SHOPPING_LIST_EXPORT_PROVIDER=Vikunja
VIKUNJA_BASE_URL=https://vikunja.example.com
VIKUNJA_PROJECT_ID=3
VIKUNJA_API_TOKEN=your-token-here
```

For development, `VIKUNJA_BASE_URL` can point at a Tailscale-only address as long as the machine or container running MATFLOTE can reach it.

The API token must have permission to create tasks in the configured Vikunja project. Do not commit real tokens to the repository.

Preview the generated list without exporting:

```text
GET /api/grocerylists/preview?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Export the generated list to the configured provider:

```text
POST /api/grocerylists/export?from=YYYY-MM-DD&to=YYYY-MM-DD
```

The initial Vikunja exporter creates one task with a checklist in the description.
