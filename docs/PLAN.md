# MATFLOTE implementation plan

Written for the implementation session. It assumes nothing from the planning conversation. Findings and evidence are in `docs/AUDIT.md`; ids such as F1 or B2 refer to that document.

## Ground rules

- **Start from branch `claude/awesome-clarke-h8g3sc`** (or `main` once that branch is merged). It already contains the price removal, a draft assistant API (`/api/assistant`, documented in `backend/Docs/assistant-api.md`) and these documents.
- **One package per pull request, in the order below.** Each package lists what to change, where, and how to tell it is done.
- **How it is deployed.** See "The Pi" below. In short: a Raspberry Pi 4 behind Nginx Proxy Manager, Tailscale-only, single user, built on the Pi from a checkout of this repo. Deploying is: push to GitHub, `git pull` on the Pi, rebuild the two services. Database migrations run when the backend starts.
- **Every migration must be safe to run on the owner's real data.** Do WP0 step 1 first so there is always a copy.
- **Security is not a priority.** The server is Tailscale-only and has one user. Do not add login, tokens or proxies. Two small hygiene fixes are listed in WP7.
- **Toolchain.** Backend: .NET SDK 9 or newer (`dotnet build backend`). Creating migrations needs `dotnet-ef` 9. Frontend: Node 22 or 24, `npm ci`, `npm run build`, `npm run lint`. The frontend dev server expects the backend on `http://localhost:5132`.
- **Verify in a browser, not only with a build.** Several bugs here were only visible when running the app.

## Order and rationale

| Package | Goal | Why this position |
| --- | --- | --- |
| WP0 | Safety net | A database copy before migrations, and tests that the later packages extend |
| WP1 | Make it feel fast | The owner's main complaint; mostly configuration and caching |
| WP2 | Frontend bugs | Small fixes; two of them make data look lost |
| WP3 | The AI path | The owner's main goal |
| WP4 | Stop losing data | API behaviour that silently drops or deletes |
| WP5 | Design | Imageless recipes, planner readability, phone layout |
| WP6 | Runtime and deployment | .NET 10, backups, compose details |
| WP7 | Housekeeping | Shared code, dead code, style tokens, hygiene |

## The Pi

Reported by the agent on the Pi on 2026-11-25, read-only. Treat as the target environment.

- **Hardware.** Raspberry Pi 4, 8 GB RAM, Debian 13. The OS, the checkout and MATFLOTE's database and images are on the **SD card**. 33 containers share the machine.
- **Deployment.** `~/infra/docker-compose.yml` builds `matflote-backend` and `matflote-frontend` from `~/infra/matflote` (currently `main` at `97cca55`). This repo's own `docker-compose.yml` is not used there. Data is bind-mounted: `~/infra/config/matflote/data` → `/data`, `~/infra/config/matflote/images` → `/data/images`. No host ports, no health checks. A build takes about five minutes.
- **Front door.** `https://<hostname>` → Nginx Proxy Manager (TLS, HTTP/2) → `http://matflote-frontend:80` (this repo's nginx) → `http://backend:8080`.
- **The proxy does not compress.** It has `gzip on` with nginx's default types, which is HTML only. JavaScript, CSS and JSON reach the browser uncompressed. Compression has to come from this repo's nginx.
- **The proxy overrides cache headers.** The proxy host has "Cache Assets" switched on. For css, js and image files that setting caches responses in the proxy for 30 minutes, discards any `Cache-Control` the app sends, and tells browsers the file expires at 00:30 UTC. So static files and photos are re-downloaded in full once a day, and nothing this repo sets on `/assets` or `/images` reaches the browser until the owner turns that switch off (see the deployment checklist).
- **Database.** 352 KB, already in WAL mode. 53 recipes, 180 ingredients, 349 recipe lines, 21 components, 134 planned meals, 38 tags. It also holds 117 price points and 10 stores, which the price-removal migration deletes.
- **Images.** 103 files, 19 MB. Only 12 have a row in `UploadedImages`; the rest arrived through package import, which does not register them. The two bundled sample PNGs (2.6 MB and 2.2 MB) are there. The largest uploads are about 390 KB.
- **Backups.** A daily Restic job copies `~/infra/config`, which includes the live SQLite file with no dump step, to a USB disk in the same machine. There is no offsite copy.
- **The agent on the Pi** can call MATFLOTE over HTTPS by hostname with no authentication. It has no MCP servers. Anything that restarts, pulls or builds needs the owner's approval there.

## Measured baseline

**On the Pi, with the owner's real data** (curl on the Pi, second of two runs):

| Request | Size | Server time |
| --- | --- | --- |
| `GET /api/recipes` | 590 KB (11 KB per recipe) | 0.89 s |
| `GET /api/ingredients` | 178 KB | 0.06 s |
| `GET /api/ingredient-tag-categories` | 4.5 KB | 0.01 s |
| `GET /api/brands` | 1.7 KB | under 0.01 s |
| `GET /api/grocerylists/preview` for an empty week | 0.1 KB | 0.45 s |
| `/assets/index-*.js` through the proxy | 583 KB, not compressed | |
| `/assets/index-*.css` through the proxy | 81 KB, not compressed | |

So every page load, on every page, transfers about 775 KB of JSON and waits about a second for the recipe list, and the first visit of the day adds 664 KB of script and styles. None of it is compressed anywhere in the chain. The empty-week shopping list takes 0.45 s because it loads every recipe before looking at the plan.

**In a browser on a development machine** (36 ingredients, 19 recipes, two planned weeks):

| What | Now |
| --- | --- |
| Every page load, API | 4 catalog requests on every page including Settings; the planner adds the week. A reload fetches all of it again: the API sends no validators |
| Compressibility | `GET /api/recipes` 65 KB → 4.1 KB with gzip (16×). JS 557 KB → 141 KB, CSS 80 KB → 14 KB |
| Generate a week | 42 requests: 21 `POST /api/mealplans`, each followed by a full `GET` of the week |
| Save one meal | `PUT` then a full `GET` of the week; all 21 slots show skeletons for at least 450 ms |
| Images | Served by the backend with `ETag` only. Uploaded photos are used at every size down to 28 px |

Re-measure both after WP1 with the same steps.

---

## WP0. Safety net

1. **Copy the database before migrating.** In `backend/Program.cs` `PrepareDatabaseAsync`, before `MigrateAsync()`: if `GetPendingMigrationsAsync()` returns any and the SQLite file exists, copy it to `<name>.<yyyyMMdd-HHmmss>.bak` in the same folder and keep the newest five. Use `VACUUM INTO` through a raw connection rather than a file copy so the copy is consistent.
2. **Backend test project** `backend.Tests` (xUnit, `Microsoft.AspNetCore.Mvc.Testing`), each test class on its own temporary SQLite file. The backend has top-level statements in `Program.cs`; add `public partial class Program;` so `WebApplicationFactory<Program>` works. First tests, all against HTTP endpoints:
   - recipe create, update and delete, including a component and a rejected cycle;
   - meal plan create, replace and delete;
   - shopping-list totals for a planned recipe with a component and scaled portions;
   - assistant API: context, import (create, skip, update, dry run, each error path in `backend/Docs/assistant-api.md`), meal plan (replace, fill, clearRange, errors).
3. **Frontend tests** with Vitest for the pure modules: `utils/plannerDate.ts`, `utils/plannerGenerator.ts` (inject the random source so it can be seeded), `utils/plannerPrepHelper.ts`.
4. **Lint to zero.** Set `argsIgnorePattern`, `varsIgnorePattern` and `caughtErrorsIgnorePattern` to `^_` in `frontend/eslint.config.js` (removes 7 errors). Fix the remaining `react-hooks/set-state-in-effect` and `react-refresh/only-export-components` errors as the files are touched in later packages; do not disable the rules.
5. **CI.** A GitHub Actions workflow that builds and tests the backend, and lints, type-checks, tests and builds the frontend.

*Done when:* starting the backend against a database with a pending migration leaves a `.bak` beside it; `dotnet test` and `npm test` pass locally and in CI.

---

## WP1. Make it feel fast

Ordered by payoff for effort. Steps 1–4 are independent and can be separate commits.

### 1. Compression and caching for static files and JSON (`frontend/nginx.conf`)

- `gzip on; gzip_comp_level 5; gzip_min_length 1024; gzip_proxied any; gzip_http_version 1.0; gzip_vary on; gzip_types text/css application/javascript application/json image/svg+xml;` This also compresses the proxied `/api/` responses. `gzip_http_version 1.0` and `gzip_proxied any` matter because requests arrive from another nginx.
- `location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; try_files $uri =404; }` File names there carry a content hash.
- `location = /index.html { add_header Cache-Control "no-cache"; }` and the same for `/` so a new build is picked up.
- `client_max_body_size 25m;` (the default of 1 MB blocks larger uploads and the package import; O1).

Expected on the Pi: script and styles 664 KB → about 160 KB; the two big catalog responses 768 KB → roughly 50 KB on the wire. This step alone removes about 90% of the bytes of every page load and needs no application change.

### 2. Stop refetching what has not changed (conditional GET)

Give the four catalog endpoints an `ETag` that changes only when their data changes, so a reload costs four empty `304` responses and no database work.

- Add a singleton `CatalogVersion` holding a counter per group (`recipes`, `ingredients`, `tags`, `brands`) and a random process id. Bump the relevant counters from a `SaveChangesInterceptor` by looking at the changed entity types (a change to `Ingredient`, `Brand` or tag entities also bumps `recipes`, because recipe responses embed them).
- Add an endpoint filter or small middleware for `GET /api/recipes`, `/api/ingredients`, `/api/ingredient-tag-categories`, `/api/brands`: compute `W/"<process>-<group>-<counter>"`; if it equals `If-None-Match`, return `304` before running the action; otherwise set `ETag` and `Cache-Control: no-cache` on the response.
- No frontend change is needed: the browser's HTTP cache revalidates and hands the cached body to `fetch`.

### 3. Keep data on screen while refreshing

- In each provider under `frontend/src/contexts/`, show the loading state only when there is no data yet. A refresh keeps the current list visible. Today `isLoading` flips on every refresh and the cookbook grid is replaced by "Loading recipes".
- `frontend/src/components/MealCalendar.tsx:84-93` holds skeletons for 450 ms after every load, including after each save. Show skeletons only for a week that has never been loaded.
- After a create or update, put the returned object into context state instead of refetching the list. `POST` already returns the DTO; change the `PUT` endpoints for recipes, ingredients and meal plans to return the updated DTO (200) instead of 204.

### 4. One request for multi-meal operations

- Add `PUT /api/mealplans/batch` (id-based; share the validation and write code with `AssistantService.SetMealPlanAsync`): a list of entries to upsert, a list of entry ids to delete, and an optional range to clear, applied in one transaction. Return the resulting entries for the affected range.
- Use it for Generate (`PlannerPage.tsx:391-394`), Clear (`MealPlanContext.tsx:65-88`), and move and swap (`PlannerPage.tsx:214-260`).

Expected: Generate goes from 42 requests to 1, and a failure can no longer leave half a week (F13).

### 5. Week cache and request sequencing

- In `MealPlanContext`, keep loaded weeks in a map keyed by range. Navigating shows the cached week at once and revalidates in the background. Prefetch the previous and next week after a load.
- Ignore any response that is not for the latest requested range (fixes F1).

### 6. Slimmer, faster recipe list

On the Pi this endpoint is 590 KB and takes 0.89 s, which is most of the wait on a first load. Do this step early if steps 1 and 2 leave the first load of a session feeling slow.

- `RecipesController.RecipeDetails()` (`backend/Controllers/RecipesController.cs:177-204`): add `AsSplitQuery()`.
- In the recipe response, replace the embedded full ingredient with a slim one: id, name, brand, image URL, tags, colour. Drop description and the 20 nutrition fields. The only frontend reader of nested nutrition is `RecipeDetailContent.tsx:264`; look the ingredient up in `useIngredients()` by id there.

Also embed components as id, name, amount, unit and preparation only; today each component repeats the child recipe's full ingredient list.

Expected: `GET /api/recipes` shrinks by roughly two thirds before compression, and the query stops multiplying rows. Measure the server time on the Pi before and after; the target is under 0.2 s.

### 7. Images

- Serve `/images` with `Cache-Control: public, max-age=31536000, immutable` (`StaticFileOptions.OnPrepareResponse` in `backend/Program.cs`). Uploaded files have GUID names and never change. This only reaches browsers once "Cache Assets" is off in the proxy.
- Thumbnails: when the browser prepares an upload it already draws an 800×800 JPEG on a canvas (`ImageCropPicker.tsx:69-95`). Produce a second 320 px JPEG the same way and upload both; store the pair in `UploadedImages` and return `thumbnailUrl` beside `imageUrl` in recipe and ingredient DTOs (nullable, falling back to `imageUrl`). Use the thumbnail in grids, planner cards and day previews; the full image only in the detail view. Add a button under Settings → Maintenance that creates missing thumbnails for existing images in the browser. Drive it from the image URLs that recipes and ingredients reference, not from the `UploadedImages` table: on the Pi only 12 of 103 image files have a row there. Register the missing rows while doing so.
- Add `loading="lazy"` and `decoding="async"` to `IngredientThumbnail`, `RecipeLineThumbnail` and the planner card image (`RecipeThumbnail` already has it).
- Replace the two bundled sample PNGs in `backend/SeedImages/recipes/` (2.6 MB and 2.2 MB) with JPEGs under 200 KB at 800 px. Keep the old `.png` names working for existing databases: add a migration that rewrites `Recipes.ImageUrl` from the old seed URLs to the new ones.

### 8. Database write speed

The database is on an SD card. It is already in WAL mode (EF Core's SQLite provider enables it when it creates the file). What remains: set `PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000;` on each connection through a `DbConnectionInterceptor`. In WAL mode `NORMAL` is safe against corruption and avoids an `fsync` on every commit, which is the slow part on SD storage.

### 9. Smaller items

- Self-host Nunito and Ubuntu (`frontend/src/index.css:1` imports them from Google). Removes three cross-origin requests from every cold load and lets the app render without internet. Load only the weights in use.
- `GroceryListService.BuildAsync` loads every recipe (0.45 s on the Pi for an empty week); load the planned recipes and the components they reach, and return early when nothing is planned (P2). `AppSettingsService.GetAsync` reads eleven keys one at a time; read the table once (P4).
- `React.lazy` for the Scanner, Nutrition and Settings pages so the first load carries only planner and cookbook.
- `public/icon.png` is a 175 KB 380 px PNG used as favicon; replace with a small one.

*Done when,* measured with the browser's network panel against the Docker build and again on the Pi after deployment:
- a reload of any page transfers under 5 KB in total, with the catalog requests answered `304`;
- a first load of the day transfers under 250 KB in total with the owner's data;
- `/assets/*.js` arrives gzipped with `immutable`;
- generating a week is one request, and saving one meal does not blank the other slots;
- switching to a week visited before shows it without a loading state;
- the cookbook grid loads thumbnails, not 800 px images.

---

## WP2. Frontend bugs

Each is a few lines. Details and evidence: AUDIT F1–F8.

1. **F2 and F21.** Move focus-on-open (once), focus trap, focus restore, Escape and scroll lock into `components/Modal.tsx`; delete the per-dialog copies in `ConfirmationDialog`, `GroceryExportDialog`, `PrepHelperDialog`, `BrowserDetailModal`, `AddButton`. This fixes the Generate dialog cancelling itself when typing.
2. **F3.** Delete the date helpers at the bottom of `pages/NutritionPage.tsx` and use `toDateInputValue`, `addDays` and the week-start helper from `utils/plannerDate.ts`.
3. **F4.** `plannerRecipePickerFilters.ts:58-64`: meal tags (`Breakfast`, `Lunch`, `Dinner`) match if the recipe has any of the selected ones; other tags keep "all".
4. **F5.** `RecipeDetailContent.tsx:468`: format scaled amounts with up to two decimals instead of `Math.round`.
5. **F6.** Open the planner on the current week on a fresh visit; add a Today button to `PlannerControls`. Keep the last-viewed week only within a browser session.
6. **F7.** A visible error state with Retry when a load fails; disable planner slots while the plan is unknown; in `services/apiClient.ts` never surface a non-JSON body (show a generic message with the status); add an error boundary in `main.tsx`.
7. **F8.** Reset `lastScannedEanRef` on stop and after a failed lookup; use the ISO week-year in the week label; pass a recipe id, not a fresh object, to the detail modal opened from the planner; show "open recipe" and "remove" on touch devices.
8. **F11.** Move the camera lifecycle in `ScannerPage.tsx:249-306` into a hook that can cancel during start-up, and use the decode callback's own controls argument.
9. **F24.** Move the remaining English strings into `i18n/en.ts` and `i18n/nb.ts`.

*Done when:* each of F1–F6 has a test or a scripted browser check that fails before and passes after. F1 is fixed in WP1 step 5.

---

## WP3. The AI path

The intended user is an agent that can make HTTP requests to MATFLOTE, such as the agent already running on the Pi. No MCP server is needed for that; a short instruction file plus the self-describing API is enough.

1. **Review the draft** in commit `c192a8b` (`backend/Services/AssistantService.cs`, `backend/Controllers/AssistantController.cs`, `backend/Dtos/AssistantDtos.cs`, `backend/Docs/assistant-api.md`). Cover it with the tests from WP0.
2. **Household planning preferences.** Add a `PlanningPreferences` settings record: people eating, minimum fish and chicken dinners per week, tags and ingredients to avoid, how many weeks before a dinner may repeat, free-text notes. Edit it on the Settings page. Return it from `GET /api/assistant/context`. Make `frontend/src/utils/plannerGenerator.ts` read the minimums from it instead of the constants at lines 23-26.
3. **Feedback signal.** Add an optional rating (1–5) and note to a recipe, editable in the recipe view, and include the rating in the assistant context. Optional: a "cooked / skipped" mark on a past planned meal.
4. **Record and undo.** Log every assistant write (time, endpoint, summary, counts) in a small table and show the last few on the Settings page. For meal plans, store the previous state of the affected range with the log row and add `POST /api/assistant/meal-plan/undo` to restore the most recent one.
5. **Nutrition for new ingredients.** When the import creates an ingredient without nutrition, optionally look it up with `MatvaretabellenNutritionLookupService` and attach the best match above a confidence threshold, reporting what was matched in the result. Off by default; enabled with `"lookupNutrition": true`.
6. **Images.** Accept an optional `imageUrl` on assistant recipes; when it is an external URL, download it server-side into image storage (size and type checked) rather than hot-linking.
7. **Agent instructions.** Add `docs/agent-guide.md`: how to find the base URL (the agent on the Pi reaches MATFLOTE over HTTPS by its hostname; leave the hostname as a placeholder the owner fills in), the four-step session from `assistant-api.md`, and house rules (ask before replacing a week that already has meals, prefer existing ingredients, always dry-run first). This is the file the owner points an agent at. The Pi agent runs read-only requests without asking; whether writes to this API should be pre-approved there is the owner's call.
8. **Later, only if wanted:** an MCP server with five tools mapping one-to-one to the endpoints, for chat clients that cannot make HTTP calls to the Pi.

*Done when:* an agent given only `docs/agent-guide.md` can add three new recipes and plan next week's dinners with two fish days and nothing planned in the last three weeks, in at most five requests, with every new ingredient carrying tags.

---

## WP4. Stop losing data

Evidence: AUDIT B1–B6. Share validation with `AssistantService` rather than writing it a third time.

1. **B1.** `DELETE /api/ingredients/{id}` returns 409 listing the recipes and planned meals that use the ingredient. Add `POST /api/ingredients/{id}/replace-with/{otherId}` that repoints recipe lines and planned items and then deletes; the UI offers it in the 409 case. Never a 500.
2. **B2.** Recipe and ingredient writes return 400 naming unknown tags, repeated ingredient lines and invalid preparations. The forms show the message.
3. **B3.** `POST /api/seed-catalog/import-package` only synchronises tags when called with `?syncTags=true`. Update the README.
4. **B4.** Creating or renaming a recipe to an existing name, or an ingredient to an existing name plus brand, returns 409.
5. **B5.** A meal entry with no items is rejected on create and treated as delete on update.
6. **B6 and F15.** Shopping list: convert to grams or millilitres before grouping, round up to sensible steps, and choose sections from the tag's category or system key. Replace the other English tag-name checks in the frontend (`plannerPrepHelper.ts:38`, `plannerRecipePickerFilters.ts:112-122`, `GroceryExportDialog.tsx:29-30`, `BrowserDetailModal.tsx:194`) with system keys; add system tags where one is missing.

*Done when:* each case has a backend test that fails before and passes after.

---

## WP5. Design

Evidence and screenshots: AUDIT section 3.7 and the report page.

1. **Header.** Raise the two `min-[1401px]` offsets in `styles/appStyles.ts:182` and `:426` to about 1500 px, or remove them.
2. **Recipes without a photo.** A deliberate fallback in `RecipeThumbnail.tsx:64` and `MealSlot.tsx:121`: a tile built from the colours of the recipe's two or three heaviest ingredients with the recipe's initials, in the style `IngredientThumbnail` already uses. In the planner, give imageless cards a text-first layout instead of reserving half the card.
3. **Week view.** Restore the commented-out header row in `MealCalendar.tsx:157-168` using `t.enums.mealSlots`; highlight today's row; reduce row height so Monday to Sunday fits a 900 px screen; make portions legible.
4. **Month view.** Show planned meals as chips; reveal "add" on hover or tap instead of three buttons in every cell.
5. **Recipe view.** A full-height sheet (or page) instead of a 480 px dialog; one column on phones; ingredients fully listed, never in a nested scroll box.
6. **Phone.** Dock the cookbook search row instead of floating it; fold the Recipes/Ingredients switch into the page header; two-line titles on cookbook cards; move the floating planner button so it does not cover cards; make the day previews read as previews.
7. **Addresses.** Hash routes for the pages and for an open recipe, so links, bookmarks and the back button work.
8. **Accessibility basics.** Touch targets of at least 44 px; text contrast of at least 4.5:1 (the light theme's `#7A8864` on `#FAF7F2` is 3.55:1); a distinct accessible name for each planner slot.
9. **Install to home screen.** A web app manifest and icons.

*Done when:* screenshots at 390, 1280, 1440 and 1920 px in both themes show no clipped or overlapping controls, and a week of imageless recipes is readable at a glance.

---

## WP6. Runtime and deployment

1. **.NET 10.** Retarget `backend/backend.csproj`, update both Dockerfile base images, move EF Core and OpenAPI to their 10.x releases, update QuestPDF. Run the test suite.
2. **Backups.** The owner's daily Restic job copies `~/infra/config`, which picks up the live WAL-mode SQLite file with no dump step. Add `POST /api/maintenance/backup` that writes a consistent copy with `VACUUM INTO` to `/data/backups/dinnerplanner.latest.db` (replacing the previous one), so the copy sits inside the folder Restic already covers and the backup script only needs one `curl` line before it runs, the way it already dumps the MariaDB databases. Document the call in the README. The backup disk is in the same machine and there is no offsite copy; that is outside this repo.
3. **Compose.** In this repo's `docker-compose.yml`: `TZ=Europe/Oslo` on both services, a health check on `/health`, and `depends_on` with `condition: service_healthy`. Note in the README which of these the owner should mirror in `~/infra/docker-compose.yml`.
4. **README.** Describe the bind-mount deployment the owner actually uses, the update procedure (pull, rebuild, check the `.bak`), and remove instructions that no longer apply.
5. `UseHttpsRedirection()` in `backend/Program.cs:91-94` does nothing behind the proxy except log a warning; remove it.

---

## WP7. Housekeeping

1. Two hygiene fixes, cheap even on a private network: enable CORS only in Development (`backend/Program.cs:19-27`; production is same-origin through nginx), and make the two "test connection" endpoints use a stored token only when the requested base URL equals the stored one (S2). Limit package import to image file types (S3).
2. Move mapping and validation out of controllers into services; one ingredient-to-DTO mapper; ProblemDetails for every error.
3. Theme tokens: define colours and the 1100 px breakpoint once in `frontend/src/index.css` with Tailwind's `@theme`, switch themes with a `data-theme` attribute on the shell, and delete the unreachable `light` theme. Convert one style group at a time (F17–F19).
4. Split the four large frontend files along the seams in AUDIT F20; remove the triplicated tag-management callbacks and `nullableNumber`.
5. Remove dead code: the `IngredientTag` enum, compatibility-only nutrition fields, the sample rows in `HasData`, unused style entries, and the boilerplate file-header comments. Fix `frontend/README.md`.

---

## Deployment checklist for the Pi

For the owner, or the agent on the Pi with the owner's approval. Nothing here is done by the implementation session.

1. **Before the first deployment of this branch:** copy `~/infra/config/matflote/data/dinnerplanner.db` somewhere safe, or confirm last night's Restic snapshot. The price-removal migration deletes the 117 price points and 10 stores for good.
2. `git pull` in `~/infra/matflote`, then from `~/infra`: `sudo docker compose up -d --build matflote-backend matflote-frontend`. Expect about five minutes.
3. **Once, in Nginx Proxy Manager:** open the MATFLOTE proxy host and switch **Cache Assets off**. Until then the proxy discards the app's cache headers and re-serves files it cached for up to 30 minutes after a deployment.
4. In `~/infra/docker-compose.yml`, add `TZ=Europe/Oslo` to both MATFLOTE services, as the other services have.
5. After WP6: add one line to `~/scripts/backup-critical.sh` before the Restic step that calls the backup endpoint.
6. Check: `curl -s -o /dev/null -D - -H 'Accept-Encoding: gzip' https://<hostname>/api/recipes` shows `content-encoding: gzip`; the same for the `/assets/*.js` file shows `cache-control: public, max-age=31536000, immutable`; a `.bak` file appeared beside the database if a migration ran.

## Open decisions for the owner

These change what gets built. Defaults are what the plan assumes if nothing is said.

| Decision | Default |
| --- | --- |
| Pieces as a unit ("2 eggs"), or keep grams and millilitres only (AUDIT B7) | Keep as is; revisit after WP3 |
| May the agent create new tags, or only use existing ones | Existing only |
| Recipe name limit (30 characters) | Keep; cards get two lines in WP5 |
| Rating on recipes (WP3 step 3) | Build it |
