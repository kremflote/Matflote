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

## Verify A Local Build

Use the smoke script before Docker work or before committing backend/frontend integration changes:

```powershell
.\scripts\smoke-test.ps1
```

The smoke script builds the frontend, builds the backend in Release mode, starts the backend on a temporary port with a temporary SQLite database and image folder, then checks:

- `/health`
- `/api/recipes`
- `/api/ingredients`
- `/api/mealplans`
- `/api/grocerylists/preview`
- `/api/app-settings`
- image upload storage

It does not call Vikunja, because that would require a real external server and token.

To inspect the Docker configuration without starting containers:

```powershell
docker compose config
```

To rebuild the Docker images:

```powershell
docker compose build
```

For a fresh-container check, start MATFLOTE with new volumes or after `docker compose down -v`. The backend applies migrations on startup, creates the SQLite database if needed, and seeds missing bundled images into the configured image storage volume.

## Sync Model

Docker v1 uses shared-server sync. Phones, tablets, and computers stay in sync by connecting to the same MATFLOTE server.

There are no accounts, users, households, or offline multi-device sync in this milestone. Those would be future architecture decisions.

## Shopping List Export

MATFLOTE can export generated shopping lists through a provider model. Vikunja is the first supported provider; other todo systems can be added later as separate exporters without changing the grocery-list builder.

Configure Vikunja through environment variables, not committed files. These values seed first-run/server config, and can later be overridden from the MATFLOTE Settings page:

```env
SHOPPING_LIST_EXPORT_PROVIDER=Vikunja
SHOPPING_LIST_EXPORT_TASK_MODE=SingleTask
VIKUNJA_BASE_URL=https://vikunja.example.com
VIKUNJA_PROJECT_ID=3
VIKUNJA_API_TOKEN=your-token-here
```

For development, `VIKUNJA_BASE_URL` can point at a Tailscale-only address as long as the machine or container running MATFLOTE can reach it.

The API token must have permission to create tasks in the configured Vikunja project. Do not commit real tokens to the repository.

The Settings page never shows a saved token value. Leave the token field blank to keep the existing token, or enter a new token to replace it.

The task mode can be changed from the Settings page:

- `SingleTask`: one Vikunja task with a checklist in the description.
- `SeparateTasks`: one Vikunja task per ingredient, formatted with amount, source meals, and brand when available.

Preview the generated list without exporting:

```text
GET /api/grocerylists/preview?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Export the generated list to the configured provider:

```text
POST /api/grocerylists/export?from=YYYY-MM-DD&to=YYYY-MM-DD
```

The Settings page also includes a connection test that uses the current form values and the saved token when the token field is left blank.
