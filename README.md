# MATFLOTE

MATFLOTE is a household meal planning and cookbook app.

## Current App Features

- Cookbook with recipes, ingredients, cuisines, brands, tags, and image uploads.
- Planner with week/month views, main dish selection, and up to 6 supplements such as sides, sauces, dips, spice mixes, and salads.
- Recipe ingredients store both measurement unit and preparation, such as chopped, diced, julienned, grated, or crushed.
- Prep helper for the current week. It lists produce-style ingredients only when an explicit preparation exists or one can be inferred from recipe instructions.
- Shopping list preview and export through the provider-based grocery-list system. Vikunja is the first supported provider.
- Scanner/Skanner page for looking up Norwegian grocery products by barcode/EAN through Kassalapp.

Lunch and Dinner are still accepted as backend recipe tag values for older saved recipes, but they are not selectable as new recipe tags. Breakfast remains selectable.

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

## Deploy To Raspberry Pi Infra Stack

Normal flow from the development PC:

```powershell
git add .
git commit -m "Describe the change"
git push
.\scripts\deploy-pi.ps1
```

The deploy script SSHes to `kremflote@krem-pi`, pulls `~/infra/matflote`, then rebuilds and restarts the MATFLOTE services from `~/infra/docker-compose.yml`.

Deploy only the frontend:

```powershell
.\scripts\deploy-pi.ps1 -Target frontend
```

Deploy only the backend:

```powershell
.\scripts\deploy-pi.ps1 -Target backend
```

Preview what would run without touching the Pi:

```powershell
.\scripts\deploy-pi.ps1 -DryRun
```

If the Pi already has the latest code and you only want to restart services without rebuilding:

```powershell
.\scripts\deploy-pi.ps1 -NoBuild -SkipPull
```

To build a fresh Docker version from local source without starting it:

```powershell
docker compose build
```

To rebuild and restart the running app:

```powershell
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
- `/api/seed-catalog/export`
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

For a fresh-container check, start MATFLOTE with new volumes or after `docker compose down -v`. The backend applies migrations on startup, including recipe ingredient preparation migrations, creates the SQLite database if needed, and seeds missing bundled images into the configured image storage volume.

Before committing a feature chunk, run:

```powershell
npm run build --prefix frontend
dotnet build backend -c Release --no-restore
.\scripts\smoke-test.ps1
docker compose config
```

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

## Product Scanner

The Scanner/Skanner page uses Kassalapp through the backend. The frontend never receives the Kassalapp API key.

For local development, store the key with .NET user-secrets:

```powershell
dotnet user-secrets set "Kassalapp:ApiKey" "your-api-key-here" --project backend
```

For Docker/server use, set the key in your private `.env` or server environment:

```env
KASSALAPP_API_KEY=your-api-key-here
```

Manual EAN lookup and camera barcode scanning both use the same backend endpoint:

```text
GET /api/product-lookup/ean/{ean}
```

Camera scanning uses ZXing in the browser and is loaded only when the scan button is used. Phone browsers normally require MATFLOTE to be opened from a secure origin such as HTTPS before camera access works.

On phone/tablet widths, scanned product results become suggested ingredients. Choose a suggestion, edit the name, brand, price, tags, or color, then confirm to save it through the normal ingredient API.

## Starter Data Catalog

Starter ingredients and recipes can be shipped through `backend/SeedData/catalog.json`.

On backend startup, after database migrations, MATFLOTE imports that JSON file if it exists. Import is intentionally additive:

- Brands and cuisines are created when missing.
- Ingredients are matched by ingredient name plus optional brand name.
- Recipes are matched by recipe name plus recipe type.
- Existing matching ingredients and recipes are left alone, so user edits are not overwritten.

This means you can safely keep a starter catalog in the repository while allowing each household instance to evolve independently.

To create starter data through the app:

1. Run MATFLOTE locally.
2. Add ingredients and recipes in the UI.
3. Export the current catalog:

```text
GET /api/seed-catalog/export
```

The endpoint downloads `matflote-seed-catalog.json`. Review it, remove anything personal or experimental, then copy the curated content into `backend/SeedData/catalog.json`.

The catalog uses string enum values, for example:

```json
{
  "brands": [],
  "cuisines": [{ "name": "Norwegian" }],
  "ingredients": [
    {
      "ingredientName": "Carrot",
      "description": "Sweet root vegetable for soups, stews, salads, and sides.",
      "brandName": null,
      "imageUrl": null,
      "price": null,
      "tags": ["Vegetable"],
      "nutritionPer100": null,
      "color": "#f28c28"
    }
  ],
  "recipes": [
    {
      "recipeType": "Side",
      "name": "Carrot sticks",
      "imageUrl": null,
      "description": "Simple crunchy side.",
      "instructions": "Cut carrots into batons.",
      "ingredients": [
        {
          "ingredientName": "Carrot",
          "brandName": null,
          "amount": 2,
          "unit": "Piece",
          "preparation": "Batons"
        }
      ],
      "tags": ["Other"],
      "cuisineName": null,
      "dessertType": null
    }
  ]
}
```
