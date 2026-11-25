# MATFLOTE audit and implementation plan

November 2026. Covers the backend, frontend, deployment, design, and how well the app works as a target for an AI that creates recipes and plans weeks.

This document has two readers. Sections 1–3 are for the owner. Section 4 is a work plan written so a separate implementation session can pick up any package without the rest of this conversation.

## 1. Summary

MATFLOTE is in better shape than most one-person apps of its size. The domain model is thought through (recipes as components of recipes, system tags that survive renames, additive seed import), migrations are disciplined, secrets are write-only in the API, and the UI has a consistent visual language in two languages. The problems are concentrated in four places:

1. **Nothing controls who can call the API.** There is no login, CORS allows every origin, and two "test connection" endpoints will send the stored Vikunja and Kassalapp tokens to any URL a caller names. On a home network this is a moderate risk; if the Pi is reachable from outside without a proxy in front, it is serious. (S1, S2)
2. **Several writes lose data without saying so, and a few frontend bugs make data look lost.** Deleting an ingredient strips it from every recipe. Unknown tags, repeated ingredient lines and bad preparations are dropped on save. Importing a package deletes tags the package does not contain. In the browser, a slow response can replace the current week with an empty one, and the nutrition week is a day short in Norway. (B1–B3, F1, F3)
3. **The deployment has gaps that will bite on a Pi**: uploads over 1 MB are refused by nginx, assets are served uncompressed and uncached, the runtime is on a .NET version that has left support, migrations run with no safety copy, and there are no tests or CI. (O1–O6)
4. **The design works against recipes without photos**, and that is exactly what an AI will produce. Planner and cookbook cards reserve most of their area for an image; without one they are blank blocks. (D2)

For the AI goal specifically: before this branch, having an agent add 12 recipes and plan two weeks took 86 API calls with numeric IDs, and reading a 15-recipe cookbook cost 63 KB. The draft assistant API on this branch does the same job in 3 calls and describes the cookbook in under 7 KB. What remains is deciding how the agent reaches the Pi, and putting access control in front before it does.

### The ten things to do first

| # | What | Why | Package |
| --- | --- | --- | --- |
| 1 | Put access control in front of the app and stop CORS in production | Everything else in security depends on it | WP1 |
| 2 | Stop test-connection endpoints sending stored tokens to caller-supplied URLs | Confirmed token leak | WP1 |
| 3 | Make ingredient delete refuse when the ingredient is in use | Confirmed silent data loss and a 500 | WP2 |
| 4 | Set `client_max_body_size`, gzip and asset caching in nginx | Uploads and restore fail; pages are 4× heavier than needed | WP3 |
| 5 | Copy the database before migrations run; add a real backup | The price-removal migration on this branch is destructive | WP3 |
| 6 | Add tests and CI before more features land | Nothing guards regressions today | WP4 |
| 7 | Fix the six small frontend bugs F1–F6 | A week that appears empty, a dialog that cancels itself, Sunday missing from nutrition | WP6 |
| 8 | Design a card for recipes without an image; label planner columns, mark today, fix the clipped header | AI-created recipes all look blank otherwise; the rest is cheap and visible every day | WP7 |
| 9 | Review and merge the assistant API, then wrap it as an MCP server | This is the AI goal | WP5 |
| 10 | Move to .NET 10 | .NET 9 is out of support | WP3 |

## 2. What is on this branch

Branch `claude/awesome-clarke-h8g3sc` holds two commits on top of `main`. They were started before the owner said implementation would happen in a separate session, so they are parked here as a head start. Each can be kept, changed or reverted independently.

**`9aaf9cb` Remove price tracking.** Complete. Removes the Prices page, price points, stores, the ingredient price field, price and store in scanner results, and the related seed-format field, translations, styles and README text.

- The `RemovePriceTracking` migration drops the `IngredientPricePoints` and `Stores` tables and `Ingredients.Price`. **Existing price history is deleted when the new backend first starts.** Back up the `matflote-data` volume before deploying if that history matters.
- Checked: the migration was applied to a populated SQLite database (34 ingredients, 62 recipe lines, 42 planned items); all rows survived and `foreign_key_check` and `integrity_check` were clean. Backend builds with 0 warnings. Frontend `tsc` and `vite build` pass. Lint went from 30 errors to 28 (none new).
- Not checked: the Docker build (no Docker daemon in the audit environment) and the scanner against the live Kassalapp API (no key).
- Old exported catalogs that still contain `"price"` import fine; the field is ignored.

**`c192a8b` Add assistant API.** A working draft of the AI-facing surface described in section 3.8. Read `backend/Docs/assistant-api.md` for the contract; the same text is served at `GET /api/assistant`.

- Checked by hand against a local database: context read, batch create, update by id and by name, rename, skip, dry run, unit conversion, duplicate-line merging, component cycles, week replace with `clearRange`, `fill` mode, and the error paths for unknown tags, units, slots, recipes and misspelled JSON fields.
- Not done: automated tests, an MCP wrapper, authentication. It inherits the app's lack of access control.

## 3. Findings

Severity is about consequence for a household app on a home server: **High** loses data, leaks secrets or blocks a documented feature; **Medium** will cause a real problem under plausible conditions; **Low** is friction or debt.

Each finding says how it was established: **confirmed** means reproduced against a running instance, **read** means established from the code or config without running it.

### 3.1 Security and exposure

**S1. No authentication, and CORS allows every origin. High. Confirmed.**
`backend/Program.cs:19-27` registers `AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()` and no endpoint requires a credential. A preflight from `https://evil.example` for `DELETE /api/recipes` came back with `Access-Control-Allow-Origin: *`. Two consequences: anyone on the network can read and change everything, and any web page open in a browser on that network can do the same by calling the Pi's address from script. In the Docker setup the frontend reaches the API through nginx on the same origin, so CORS is not needed in production at all. `.gitignore` lists `.cloudflared/`, which suggests a Cloudflare Tunnel has been used; if the tunnel has no Access policy the app is public.
*Fix:* enable CORS only in Development. Then pick one access-control approach: an authenticating proxy (Cloudflare Access, Tailscale, Authelia, or basic auth in the existing nginx), or a shared secret checked by the backend. A proxy is less code and covers the static files too.

**S2. Stored API tokens can be sent to an attacker's server. High. Confirmed.**
`POST /api/app-settings/test-shopping-list-export` and `POST /api/app-settings/test-kassalapp` take a base URL from the request and, when the request has no token, fall back to the stored one (`backend/Services/VikunjaOptionsResolver.cs:19-32`, `backend/Services/KassalappProductLookupService.cs:26-37`). With test values saved in settings, posting `{"vikunja":{"baseUrl":"http://127.0.0.1:9999","projectId":3,"apiToken":null}}` made the backend send `Authorization: Bearer <stored token>` to a local listener; the Kassalapp endpoint did the same. Combined with S1 this needs no credentials. The same endpoints let a caller make the server issue requests to arbitrary internal addresses.
*Fix:* use the stored secret only when the requested base URL equals the stored base URL; otherwise require the secret in the request. Changing a base URL through `PUT /api/app-settings` should clear the matching stored secret for the same reason.

**S3. Package import writes any file type into a folder that is served to browsers. Medium. Read.**
`ExtractPackageImagesAsync` (`backend/Services/SeedCatalogService.cs:248-276`) guards against path traversal but not file type, and the image folder is served as static files under `/images` (`backend/Program.cs:96-100`). An `.html` or `.svg` entry becomes a page on the app's own origin. The endpoint accepts 250 MB without authentication (`backend/Controllers/SeedCatalogController.cs:57`), and export builds the whole zip in memory (`SeedCatalogService.cs:246`), which is a lot to ask of a Pi once there are many photos.
*Fix:* accept only `.jpg`, `.jpeg`, `.png`, `.webp`; cap per-file and total extracted size; stream the export to the response.

**S4. Containers run as root with no limits. Low. Read.**
Neither Dockerfile sets `USER`, and `docker-compose.yml` sets no memory limit or health check.
*Fix:* `USER $APP_UID` in the backend image (with volume ownership to match), the unprivileged nginx image for the frontend, and a `healthcheck` on `/health`.

**S5. Secrets are stored in plain text in SQLite. Low. Read.**
The `AppSettings` table holds the tokens, so they travel with every volume backup. The API never returns them, and the export package leaves them out, which is right. Worth knowing when backups are copied off the Pi.

### 3.2 Data integrity and API behaviour

**B1. Deleting an ingredient silently removes it from every recipe, or crashes. High. Confirmed.**
`DeleteIngredient` (`backend/Controllers/IngredientsController.cs:123-139`) deletes all recipe lines for the ingredient and returns 204. Deleting "Chicken breast" left "Chicken wraps" and "Chicken rice bowl" with no chicken and no trace. If the ingredient is planned directly in a meal, the delete hits a restricting foreign key (`backend/Contexts/DinnerPlannerContext.cs:282`) and returns 500 "An unexpected server error occurred."
*Fix:* return 409 with the recipes and meals that use it. Offer an explicit `?force=true`, or better a "replace with another ingredient" operation, since merging duplicates is the common reason to delete.

**B2. Writes drop invalid input and report success. Medium. Confirmed.**
`POST /api/recipes` with tag `"NoSuchTag"` and the same ingredient twice returned 201 with the tag gone and one line kept (`backend/Services/TagCatalogService.cs:20-41`, `backend/Controllers/RecipesController.cs:361-378`). An invalid preparation becomes `None`. The seed import skips recipe lines whose ingredient is missing and only writes a log line (`backend/Services/SeedCatalogService.cs:571-577`).
*Fix:* reject with 400 and say what was wrong, or return the dropped items as warnings. The assistant API already does this; the regular API should match.

**B3. `import-package` deletes tags, contrary to the README. Medium. Read.**
The README says import is additive. The package path calls `ImportCatalogAsync(..., synchronizeTagCategories: true)` (`backend/Services/SeedCatalogService.cs:216`), and `SynchronizeTagCatalogAsync` (`:408-455`) deletes every tag and category not named in the package. Tag assignments cascade, so recipes and ingredients lose those tags.
*Fix:* make synchronisation an explicit option (`?syncTags=true`) that defaults to off, and say so in the README.

**B4. Names are matched but not unique. Medium. Confirmed.**
Two `POST /api/recipes` calls with the same name both succeeded. The seed import, the assistant API and any person looking at a list all identify recipes by name. Ingredients have the same gap for name plus brand.
*Fix:* check for duplicates on create and update and return 409. Add unique indexes on a normalised name once existing duplicates are resolved.

**B5. Empty meals can be saved. Low. Confirmed.**
`POST /api/mealplans` with `"recipes": []` returns 201 and occupies the date and slot, so a later create for that slot gets 409.
*Fix:* reject, or treat as delete.

**B6. Shopping-list arithmetic is rough. Low. Read, one part confirmed.**
Lines are grouped by unit, so 200 g and 1 kg of the same ingredient become two lines (`backend/Services/GroceryListService.cs:86-93`). Amounts are not rounded: the export dialog showed "Canned tomatoes 733.33 g". Sections are chosen by matching English tag names such as `"Vegetable"` and `"Dairy"` (`:141-170`), although tags can be renamed and system keys exist for exactly that reason; a renamed or Norwegian tag lands in "Other". A component measured in millilitres of a recipe whose ingredients are all in grams falls back to "the whole child recipe" without saying so (`:253-262`).
*Fix:* convert to a base unit before grouping, round up to shop-sized steps, and choose sections from the tag's category or system key.

**B7. Only weight and volume exist. Low. Design decision to revisit.**
`MeasurementUnit` is gram, kilogram, millilitre, litre. "2 eggs" or "3 cloves" cannot be stored, and the conversion rules that bridge the gap are free text (`"1 yellow onion" → "170 g"`) that only a person can apply. This is the largest source of friction for an AI writing recipes and for a person reading them.
*Fix options:* a `Piece` unit with grams-per-piece on the ingredient, or keep storage as is and make conversion rules structured (ingredient, grams) so both the UI and the assistant API can apply them.

### 3.3 Performance on a Raspberry Pi

**P1. The recipe list is heavy and built by one cartesian query. Medium. Confirmed.**
`RecipeDetails()` (`backend/Controllers/RecipesController.cs:177-204`) includes ingredients, their tags, recipe tags, and components with their ingredients and tags in a single SQL statement; EF Core logs `MultipleCollectionIncludeWarning` for it on every start. Each recipe embeds full ingredient objects with all nutrition fields, so 15 recipes are 63 KB of JSON (4.2 KB per recipe). At 200 recipes that is roughly 0.85 MB parsed on every page load, and the row count behind it grows with ingredients × tags × components.
*Fix:* `AsSplitQuery()` now; then a list endpoint that returns ingredient ids and amounts without nested nutrition.

**P2. Every shopping-list preview loads every recipe. Low. Confirmed.**
`GroceryListService.BuildAsync` (`backend/Services/GroceryListService.cs:38-58`) loads all recipes with deep includes. With 15 recipes it took 175 ms on a development machine; expect several times that on a Pi, growing with the cookbook.
*Fix:* load the planned recipes and the components they reach.

**P3. Assets are uncompressed and uncached. Medium. Read.**
`frontend/nginx.conf` has no `gzip` and no cache headers, and nginx's default is gzip off. The app is one 557 KB JavaScript file (142 KB gzipped) with a content hash in its name, re-validated on every visit.
*Fix:* `gzip on` for JS, CSS and JSON, and `Cache-Control: public, max-age=31536000, immutable` for `/assets/`.

**P4. Settings are read one key at a time. Low. Read.**
`AppSettingsService.GetAsync` (`backend/Services/AppSettingsService.cs:18-63`) runs eleven separate queries.
*Fix:* read the table once.

### 3.4 Deployment and operations

**O1. nginx refuses request bodies over 1 MB. High. Read.**
`frontend/nginx.conf` sets no `client_max_body_size`, so nginx's 1 MB default applies. The backend allows 5 MB images and 250 MB packages. The restore command in the README posts the package to port 8080, which is nginx, so any real package returns 413. This was established from the config and nginx's documented default; it was not run, because the audit environment has no Docker daemon. Cropped photos are compressed to well under the limit in the browser, but three upload paths are not (F9).
*Fix:* `client_max_body_size 25m;` for the server and a larger value on the `/api/seed-catalog/` location.

**O2. Migrations run at startup with no safety copy. Medium. Read.**
`backend/Program.cs:123` calls `MigrateAsync()` on every start. A migration that drops data, like the one on this branch, runs the moment the new container starts.
*Fix:* when migrations are pending, copy the database file to `dinnerplanner.<timestamp>.bak` first and keep the last few.

**O3. The documented backup can produce a corrupt copy, and nothing is scheduled. Medium. Read.**
The README backs up by tarring the live volume; SQLite can be mid-write. The app-level export leaves out meal plans and settings.
*Fix:* a backup endpoint or small sidecar that runs `VACUUM INTO` (or `sqlite3 .backup`) to a dated file, on a schedule, with the images folder alongside.

**O4. .NET 9 is out of support and packages are pinned to 9.0.0. Medium. Read.**
.NET 9 is a short-term release whose support ended in November 2026 (check Microsoft's support page for the exact date). `backend/backend.csproj:11-16` pins EF Core and OpenAPI to 9.0.0, the first release, so no servicing fixes were ever picked up. QuestPDF is at 2024.12.
*Fix:* move to .NET 10, the current long-term release, and let package patch versions float. The audit environment built and ran the backend on the .NET 10 SDK and runtime with roll-forward and found no problems, which is a good sign for the upgrade.

**O5. No tests, no CI, lint fails. Medium. Confirmed.**
There are no test files in either project and no workflow. `npm run lint` fails with 28 errors on this branch (30 on `main`): 13 `react-hooks/set-state-in-effect`, 8 `react-refresh/only-export-components`, 7 unused variables. Nothing stops a change from breaking the planner or the shopping list, which matters more once an implementation session and an AI are both making changes.
*Fix:* see WP4.

**O6. Smaller items. Low. Read.**
- `UseHttpsRedirection()` runs in production (`backend/Program.cs:91-94`) behind plain-HTTP nginx. With no HTTPS port configured it only logs a warning. Remove it or configure forwarded headers.
- The UI loads fonts from Google at runtime (`frontend/src/index.css:1`): the app needs internet to look right, and every visit tells Google. Self-host the two families.
- The container clock is UTC unless `TZ` is set, so "today" is wrong for an hour or two around midnight in Norway. Set `TZ=Europe/Oslo` in compose.
- Images are built on the Pi. Building multi-arch images in CI and pulling them is much faster.
- `frontend/README.md` points to `../master-document.txt`, which is not in the repository (it is git-ignored).

### 3.5 Backend code health

- **C1. Controllers carry the business rules, with duplication.** The ingredient-to-DTO mapping exists twice (`RecipesController.cs:417-433`, `IngredientsController.cs:157-173`); meal-plan create and update repeat the same six validation steps (`MealPlansController.cs:52-86` and `:103-145`). Move rules into services so the regular API, the assistant API and any future MCP server share them.
- **C2. Three error shapes.** Hand-written `BadRequest("text")`, ProblemDetails from model validation, and `{ "error": ... }` from the exception handler. The frontend's `getErrorMessage` has to guess. Use ProblemDetails everywhere.
- **C3. Naming debt.** The namespace is `DinnerPlanner.Api`, migrations are in `backend.Migrations`, and the product is MATFLOTE. Tags shared by recipes and ingredients live in `IngredientTagDefinition` and `IngredientTagCategory`. The `IngredientTag` enum (`backend/Models/Enums/IngredientTag.cs`) is no longer referenced. `NutritionFacts.Vitamins`, `VitaminKMicrograms` and `CholineMilligrams` are kept "for compatibility" and never shown.
- **C4. Three seeding mechanisms.** `HasData` in the context (five sample ingredients that migrations keep touching), `SeedData/catalog.json` (empty), and `SeedImages/`. Sample data belongs in the catalog file only.
- **C5. Boilerplate file headers.** Every model starts with the same two comment lines about navigation properties, including enums and constants where they are false. They hide the comments that do carry information.

What the backend does well: path-traversal guard on zip extraction, cycle detection for recipe components, write-only secrets, typed HTTP clients, cancellation tokens passed through, string enums in the database, and 46 small, readable migrations.

### 3.6 Frontend code

The frontend was reviewed separately: all of `frontend/src` was read, a production build was driven in headless Chrome against a mock API, and the date helpers were run under `TZ=Europe/Oslo`. I re-checked the code behind F1–F7, F10 and F12 myself. **Confirmed** below means reproduced in that browser run; **read** means established from the code. Line numbers are from this branch.

#### Bugs a user will hit

**F1. A slow response for the previous week overwrites the week on screen. High. Confirmed.**
`loadMealPlan` (`frontend/src/contexts/MealPlanContext.tsx:16-28`) has no request sequencing, and the previous/next buttons stay enabled while loading. Clicking Next twice with a slow first response left week 50 showing none of its 7 meals, with the context believing it had loaded week 49, so later saves refetch the wrong range. On a Pi this looks like a week that lost its plan.
*Fix:* ignore responses that are not the latest request. `NutritionPage.tsx:23-76` already does this with an `ignore` flag.

**F2. Typing in the "people eating" field jumps focus to the close button, and Enter then cancels. High. Confirmed.**
`ConfirmationDialog.tsx:33-46` focuses the close button in an effect that depends on `onCancel`. Callers pass inline arrow functions, so every re-render refocuses it. In the Generate dialog one keystroke moved focus to Close; Enter closed the dialog without generating. The move-portions dialog, `GroceryExportDialog` and `PrepHelperDialog` share the pattern.
*Fix:* focus once on mount; keep the Escape handler in a ref.

**F3. The Nutrition page leaves out Sunday in Norway. High. Confirmed.**
`NutritionPage.tsx:290-292` formats a local-midnight date with `toISOString()`, which is the previous day in UTC for anyone east of Greenwich. Monday plus six days comes out as Saturday, so the weekly summary covers Monday to Saturday. Just after midnight the week start is also wrong.
*Fix:* use `toDateInputValue` from `utils/plannerDate.ts:114-120`, which is correct.

**F4. The lunch picker hides lunch-only recipes. Medium. Confirmed.**
The picker preselects both `Lunch` and `Dinner` for a lunch slot (`PlannerRecipePickerModal.tsx:858-868`) and the filter requires every selected tag (`plannerRecipePickerFilters.ts:58-64`). A recipe tagged only Lunch does not appear. The generator treats dinner recipes as valid lunches, so "either" is clearly what was meant.

**F5. Recipe amounts are rounded to whole numbers. Medium. Read.**
`RecipeDetailContent.tsx:468`: `Math.round(amount * multiplier)`. The form accepts two decimals and kilograms, so 0.5 kg displays as "1 kg" and 0.4 l as "0 l".

**F6. The planner reopens on the last week viewed and has no Today button. Medium. Confirmed.**
The anchor date is restored from `localStorage` (`PlannerPage.tsx:72-83`) and the controls offer only previous and next. Each Monday starts on last week.

**F7. With the backend down, the planner looks like an empty, editable week. Medium. Confirmed.**
All 21 slots stay enabled; the only message is a 12 px "Could not load meal plan." below the fold. The cookbook prints nginx's raw `502 Bad Gateway` HTML, because `apiClient.ts:58-70` returns the response text for non-JSON errors. There is no retry, no error boundary (`main.tsx:7-13`), and no `role="alert"`.

**F8. Smaller bugs. Read unless noted.**
- Scanning the same barcode twice does nothing: `lastScannedEanRef` is never reset (`ScannerPage.tsx:282-283`). After a failed lookup the camera stays open with no feedback.
- The week label uses the ISO week but the calendar year (`plannerDate.ts:81-88`): 29 December 2025 shows "Week 1 / 2025". Confirmed.
- A recipe opened from the planner gets a new `detail` object each render (`PlannerPage.tsx:484`), which resets the edit form (`BrowserDetailModal.tsx:38-47`). Creating a tag while editing closes the form and loses the edits.
- On touch devices "open recipe" and "remove" on a planner card are hidden (`MealSlot.tsx:169`, `:180`); removing a meal means open picker, clear, save.
- Every planner save blanks all 21 slots for at least 450 ms (`MealCalendar.tsx:85-94`); a generated week flashes once per entry.
- Edit forms close on backdrop click or Escape with no unsaved-changes check (`Modal.tsx:52`).

#### Root causes for the design observations in 3.7

- **Clipped header (D1). Confirmed.** `typographyClasses.logo` (`appStyles.ts:182`) and `headerStyles.actions` (`appStyles.ts:426`) each shift 8.5 rem outward from 1401 px, but the content column only has a 120 px margin until about 1488 px, and the shell clips overflow (`appStyles.ts:415`). Measured: 16 px cut on each side from 1401 to about 1472 px. Raise both breakpoints to about 1500 px.
- **No meal labels (D3). Read.** The header row exists and is commented out (`MealCalendar.tsx:157-168`, "Meal labels are hidden for now"). Nothing in the calendar compares a date to today.
- **Blank image blocks (D2). Read.** `RecipeThumbnail.tsx:64` and `MealSlot.tsx:121` render an empty grey div (`recipeImageFallback`, `appStyles.ts:265`). `IngredientThumbnail.tsx` already draws initials on a colour.
- **The three squares on phones (D6). Confirmed.** They are not buttons. They are 28 px previews of the day's three meals inside the day's collapse toggle (`MealCalendar.tsx:200-210`, `267-292`); a planned meal without an image is a solid blank square. The floating button is `fixed bottom-30 right-8` (`appStyles.ts:1032-1033`) with only bottom padding to compensate, so mid-scroll it always covers a card. The cookbook stacks three fixed layers above the navigation: 61 px of header and about 156 px of bottom chrome on a 390×844 screen.
- **Truncated names (D6). Confirmed.** Cookbook titles are single-line `truncate` (`appStyles.ts:280`) at 149 px, about 18 characters. The planner card already uses a two-line clamp.

#### Risks

- **F9. Uploads over 1 MB (see O1). Read.** Cropped photos are safe: the crop picker always emits an 800×800 JPEG. Three paths can exceed 1 MB: the scanner's image input uploads the raw file (`ScannerPage.tsx:547-551`), `imageUploadService.ts:37` passes files up to 1.5 MB through untouched, and the catalog import in Settings.
- **F10. A stale `index.html` after an upgrade can blank the app. Suspected.** No cache headers, and `try_files` answers a missing `/assets/*.js` with HTML and status 200. Fix with O1/P3: `no-cache` on `index.html`, `try_files $uri =404` under `/assets/`.
- **F11. The camera can stay on. Read.** `startCamera` stores its controls only after three awaits (`ScannerPage.tsx:255-293`); Stop or leaving the page during that window does nothing. The decode callback also uses `controls` before it is assigned (`:276-286`), which throws if the first frame already holds a barcode.
- **F12. Camera scanning cannot work on the default deployment. Read.** Compose publishes plain HTTP and browsers only expose the camera on HTTPS. The README says so; the in-app message says only "camera unsupported".
- **F13. Planner operations are sequences of requests. Read.** Swap is two PUTs, move is POST then DELETE, clear is N parallel DELETEs, and generating a week is up to 42 requests (one POST and one full reload per meal). A failure midway leaves duplicated or lost meals. The assistant API's bulk endpoint would make these single atomic calls.
- **F14. Nothing refreshes after load. Read.** Recipes, ingredients, tags and brands load once; a phone tab left open never sees what was added on the desktop, or by an AI.
- **F15. Behaviour keyed to English tag names. Read.** Beyond the shopping-list sections in B6: the prep helper (`plannerPrepHelper.ts:38`: Vegetable, Fruit, Herb, LeafyGreen), meal roles in the picker (`plannerRecipePickerFilters.ts:112-122`: Sauce, Dip, Side, Salad), the default shopping-list exclusion (`GroceryExportDialog.tsx:29-30`: Spice), and the recipe header chips (`BrowserDetailModal.tsx:194`), which never show custom tags. Renaming "Vegetable" to "Grønnsak" silently empties the prep helper.
- **F16. Unguarded `localStorage`. Read.** `utils/localPreferences.ts:28-73` runs during first render; blocked storage means a blank page.

#### The week generator and prep helper

`plannerGenerator.ts` fills empty breakfast, lunch and dinner slots from recipes that carry the slot's system tag and have at least as many portions as people eating. Dinners avoid repeats, satisfy fixed minimums (fish 1, chicken 2; lines 24-25), then prefer the least-used protein. Leftover portions are placed into following slots. A bread breakfast gets a 50 g topping. Tag matching is by system key, which is right.

- The minimums and "no repeated dinner" apply per run, not per week. A month run asks for one fish dinner in the whole month and runs out of dinners after as many days as there are dinner recipes.
- Leftovers have no day limit and skip filled slots, so Monday's batch can land on Friday. Past days are filled too. Recipes with fewer portions than people are never scaled up.
- Randomness comes straight from `Math.random` with a biased shuffle (lines 529-535), so results cannot be seeded or tested.
- There is no preview; the plan is written immediately.

`plannerPrepHelper.ts` lists produce-tagged ingredients with a preparation, taken from the recipe line or guessed from the instructions by regex. The guess matches only bare imperatives (`chop`, not `chopped`); when no sentence mentions the ingredient it searches the whole text, so every vegetable inherits every verb. Rows are grouped by ingredient, unit and action but keyed in React by ingredient and unit (`PrepHelperDialog.tsx:79`), so the same onion chopped and sliced collides.

#### Styling system and structure

- **F17. Themes are three-way ternaries in TypeScript strings.** 287 style functions take a `theme` argument, with about 193 `dark ? … : paletteLight ? … : …` expressions; `theme={theme}` is passed 165 times across 34 files. `#7A8864` is written 117 times although a palette constant exists. `statusError` is defined identically five times.
- **F18. The `light` theme cannot be reached.** `Header.tsx:33` toggles only dark and paletteLight; `"light"` is honoured only if already in `localStorage`. A third of every ternary is dead code that still has to be written for each new style.
- **F19. One custom breakpoint repeated by hand.** `max-[1100px]` appears 178 times beside 257 `max-sm`. The mismatched pair behind the clipped header is this problem in miniature.
- *Proportionate fix:* define semantic colour tokens and the breakpoint once in `index.css` with Tailwind's `@theme`, override them under `[data-theme]`, and set `data-theme` on the shell. `text-muted` then replaces 26 copies of one ternary, the `theme` prop disappears, and the unused theme can be deleted. This can be done one style group at a time.
- **F20. Four files carry most of the logic.** `ScannerPage.tsx` (1474 lines): move the camera lifecycle to a hook (which also fixes F11) and the draft editor to its own file. `PlannerRecipePickerModal.tsx` (944), `RecipeCreateForm.tsx` (922) and `PlannerPage.tsx` (781) each mix state, request building and dialogs. About 60 lines of tag-management callbacks exist three times; `nullableNumber` exists three times and only one copy accepts a comma decimal; ISO week and date formatting are each implemented twice, plus the broken third copy in F3.

#### Accessibility

- **F21. `Modal` has no focus trap, focus restore, Escape handling or scroll lock. Confirmed.** In the Generate dialog the fourth Tab left the dialog. Only the recipe picker implements these, by hand; Escape handlers are copied into about seven components. Putting them in `Modal` also removes F2.
- **F22. All 21 planner slots are announced as "Open meal slot"** (`MealSlot.tsx:86`). Drag and drop is mouse-only, with no keyboard or touch way to move a meal. "Open recipe" and "Remove" appear only on hover.
- **F23. Small targets and low contrast. Confirmed by measurement.** On a 390 px screen: settings, week arrows, cookbook add and filter are 36×36; the Recipes/Ingredients switch is 26 px high. In the light theme, `#7A8864` text on `#FAF7F2` is 3.55:1 against the 4.5:1 guideline, including the 11–12 px navigation labels. No `prefers-reduced-motion` handling.

#### Language

- **F24. English strings in the Norwegian UI. Read.** The delete confirmation (`BrowserDetailModal.tsx:295`, `:299`), "Name" (`RecipeCreateForm.tsx:318`), "per 100g" (`RecipeDetailContent.tsx:123`), several labels in `RecipeIngredientPicker.tsx` and `CreatableSelect.tsx`, and raw unit names "Gram" and "Kilogram" in the picker grid. The two dictionaries themselves have no missing keys.

What the frontend does well: it type-checks cleanly under strict unused-variable rules with no `any` or `@ts-ignore`; translations are typed so a missing key is a compile error; the planner's date maths is DST-safe; there are only three runtime dependencies and the barcode library loads on demand; photos are cropped to 800×800 in the browser with EXIF orientation respected and object URLs revoked; every clickable element is a real button with a translated label.

### 3.7 Design and user experience

Based on screenshots of every page at 1440×900, 1920×1080 and 390×844 in both themes, with 15 recipes and two planned weeks. Screenshots are in the report page that accompanies this document.

**D1. The header is clipped at laptop widths. High visibility.**
At 1440 px the "M" of the logo is cut off at the left edge and the theme switch at the right. At 1920 px it is fine. The cause is two mismatched breakpoints; see section 3.6.

**D2. Recipes without a photo render as blank blocks. High for the AI goal.**
A planner card gives about 45% of its width to the image, a cookbook card about 78% of its height. Without an image that area is a flat dark or beige rectangle, so a week of AI-created meals is a wall of empty boxes with small text beside them. The ingredient list already solves this well with a coloured chip and initials.
*Recommendation:* a deliberate imageless card. Either a compact text-first variant (name, tags, portions, main ingredients) or a generated tile built from the colours of the recipe's main ingredients. Then decide whether the assistant API should accept an image URL.

**D3. The week view does not label its columns or mark today.**
Three unlabeled columns stand for breakfast, lunch and dinner; you learn which is which from the food. The label row exists in the code and is commented out. Wednesday 25 November looked like every other row. Rows are about 155 px tall, so a 900 px screen shows four days and the week needs scrolling. The portion count is a small "2x" in the corner.
*Recommendation:* column headers, a highlighted today row, and a denser row so Monday to Sunday fits one laptop screen.

**D4. The month view is mostly "Add" buttons.**
Each day shows three outlined "Add breakfast / lunch / dinner" buttons whether or not anything is planned: over ninety low-contrast controls on screen, among which planned meals are hard to find.
*Recommendation:* show planned meals as chips and reveal "add" on hover or tap.

**D5. The recipe view is too small for the thing people do with it.**
On a 1440 px screen the recipe opens in a dialog about 480 px wide. Ingredients sit in a scroll box that shows two rows; instructions get a narrow column. On a phone the description is squeezed beside the photo at about ten characters per line, and ingredients again scroll inside a small box. Cooking from this means scrolling two nested areas with wet hands.
*Recommendation:* a full-height sheet or its own page; one column on phones; ingredients fully listed; a cook mode with large text and the screen kept awake.

**D6. Phone layout has overlapping and unlabeled controls.**
The planner shows three small squares beside each day name with no label. They are previews of that day's three meals, and without photos they are blank. A floating round button sits on top of card text. In the cookbook a floating search row covers the cards and two stacked bars (Recipes/Ingredients, then navigation) take about 150 px of an 844 px screen. Names such as "Baked salmon with potatoes" are cut to "Baked salmon wi..." even though names are capped at 30 characters to fit.
*Recommendation:* allow two lines for names, dock the search row instead of floating it, fold the Recipes/Ingredients switch into the page header.

**D7. Pages have no addresses.**
The current page is component state saved in `localStorage` (`frontend/src/App.tsx:15-27`). A recipe cannot be linked or bookmarked, the browser's back button leaves the app, and two people cannot send each other "this one".
*Recommendation:* hash routes for the five pages and for an open recipe. No router library is needed for that.

**D8. Smaller observations.**
- The ingredient detail view is a large colour square beside a Brand box that is usually empty. Nutrition and "used in these recipes" would use the space better.
- The prep helper's empty state says "No produce-style ingredients found" without saying that it needs preparations on recipe lines. Dates appear as `2026-11-23 to 2026-11-29`.
- Dark theme: cards, card borders and the page background are within a few shades of each other, and secondary text in the month view looks below the 4.5:1 contrast guideline. Measure and adjust.
- There is no web app manifest or home-screen icon, although the phone is clearly a primary device and the scanner needs HTTPS for the camera anyway.
- The settings page repeats "Current todo provider" in a chip at the top and a field below.

What the design does well: one coherent component language across pages; a bottom navigation bar on phones; coloured ingredient chips; an export dialog that shows where each shopping-list line comes from and lets you untick items; clear confirmation text in the Generate dialog; loading states; both languages throughout.

### 3.8 Readiness for an AI that creates recipes and plans weeks

**Where the regular API gets in the way (measured before the assistant API existed):**

| Friction | Evidence |
| --- | --- |
| Too many calls | 30 ingredients, 12 recipes and 2 weeks of meals took 86 requests: one per ingredient, one per recipe, one per meal slot. |
| Reading the cookbook is expensive | `GET /api/recipes` returned 63 KB for 15 recipes; `GET /api/ingredients` 29 KB for 34. A 150-recipe cookbook would not fit usefully in an agent's context. |
| Everything is by numeric id | The agent has to create ingredients, collect ids, then build recipes; meal plans come back as ids with no names. |
| Mistakes vanish | Unknown tags and repeated lines are dropped with a 201 (B2). |
| Rules are not discoverable | The 30-character name limit and the four units are learned by failing. The unit error is a JSON conversion message that does not list the valid values. OpenAPI is only served in Development and is 115 KB. |
| No bulk replace | A slot that is already planned returns 409; replacing a week means reading, then updating or deleting entry by entry. |

**What the draft assistant API changes (commit `c192a8b`):**

- `GET /api/assistant/context` returns vocabulary, tags, conversion rules and a compact catalog with how recently each recipe was planned: 6.7 KB for the same data.
- `POST /api/assistant/recipes` takes recipes with ingredients by name, creates missing ingredients, converts dl, tsp and tbsp, and merges repeated lines.
- `PUT /api/assistant/meal-plan` sets any number of slots by recipe name and can clear the rest of a range.
- Both validate everything first, save nothing on error, list every problem with "did you mean" suggestions, support `dryRun`, and reject misspelled fields.
- `GET /api/assistant` serves the guide, so an agent needs only the base URL.

The 86-call scenario becomes 3 calls.

**What is still missing for the AI goal:**

- **A1. A way for the agent to reach the Pi.** Today that means an agent running on the home network with HTTP access. For Claude Desktop or claude.ai the natural next step is a small MCP server exposing five tools that map one-to-one to the assistant endpoints. Exposing anything beyond the LAN requires S1 first.
- **A2. Its own credential.** Give the assistant surface a token separate from whatever protects the web UI, so it can be revoked on its own.
- **A3. Household preferences in one place.** The built-in generator's rules (fish at least once, chicken at least twice) are constants in `frontend/src/utils/plannerGenerator.ts:23-26`. There is nowhere to record how many people eat, what nobody likes, or how often to repeat a dish. Store these as settings and include them in the context, so the agent and the Generate button follow the same rules.
- **A4. Signals about what worked.** The only feedback is how often a recipe was planned. A rating or a "cooked / skipped" mark on a planned meal would let an agent plan from experience.
- **A5. Nutrition for new ingredients.** Ingredients the agent creates without nutrition degrade the Nutrition page. The import warns about it; a follow-up could look up Matvaretabellen by Norwegian name and attach the match above a confidence threshold.
- **A6. Pieces.** See B7. Until then the agent must convert "2 onions" to grams from free-text rules.
- **A7. Tags cannot be created through the assistant API.** Unknown tags are errors by design, so vocabulary stays curated. Decide whether the agent may propose new tags.
- **A8. A record and an undo.** Replacing a week is one call. Log each assistant write (the `DataImportRuns` table already exists for imports) and keep the previous state of the range so the last change can be reverted.
- **A9. The generator runs only in the browser.** Moving it to the backend would let a scheduled job or an agent call it and would make it testable.

## 4. Implementation plan

Packages are ordered by dependency and value. Each is sized to be one pull request. File references are to this branch.

### WP1. Close the open doors (security)

1. In `backend/Program.cs`, call `UseCors()` and register the policy only when `app.Environment.IsDevelopment()`.
2. In `VikunjaOptionsResolver.ResolveForTestAsync` and `KassalappProductLookupService.TestConnectionAsync`, fall back to the stored secret only when the request's base URL equals the stored base URL after trimming and normalising the trailing slash. Otherwise return 400 "Enter the token to test a different URL."
3. In `AppSettingsService.UpdateAsync`, clear a stored secret when its base URL changes and no new secret is supplied.
4. In `SeedCatalogService.ExtractPackageImagesAsync`, skip entries whose extension is not `.jpg`, `.jpeg`, `.png` or `.webp`, and stop after a total size limit.
5. Choose and document access control. Minimum that needs no new moving parts: `auth_basic` in `frontend/nginx.conf` with the credentials file mounted from the host, documented in the README. Decide separately whether the assistant API gets its own bearer token (A2).

*Done when:* a preflight from a foreign origin gets no CORS headers in a production build; the test endpoints with a foreign base URL and no token return 400 and make no outbound request; a zip containing `evil.html` imports without writing it; an unauthenticated request to the deployed stack is refused.

### WP2. Stop losing data (API correctness)

1. `DELETE /api/ingredients/{id}`: when recipe lines or planned items reference the ingredient, return 409 with their names. Accept `?force=true` to keep today's behaviour for recipe lines; never 500.
2. Recipe and ingredient writes: return 400 naming unknown tags, repeated ingredient lines and invalid preparations instead of dropping them. Update the frontend forms to show the message. Share the validation with `AssistantService`.
3. `import-package`: add `?syncTags=false` as the default; update the README.
4. Reject duplicate recipe names and duplicate ingredient name plus brand with 409 on create and rename.
5. Reject meal entries with no items.
6. Shopping list: group by base unit, round, pick sections by tag category or system key.

*Done when:* each of the confirmed cases in B1–B6 has a test that fails on `main` and passes.

### WP3. Make the deployment solid

1. `frontend/nginx.conf`: `client_max_body_size`, gzip, immutable caching for `/assets/`, and no caching for `index.html`.
2. `backend/Program.cs`: before `MigrateAsync()`, if `GetPendingMigrationsAsync()` is non-empty and the database file exists, copy it next to itself with a timestamp; keep the newest five.
3. Backup: an endpoint or script that writes `VACUUM INTO` output plus an archive of the images folder to a mounted backup directory; a compose-level schedule; README updated.
4. `docker-compose.yml`: health checks, `TZ`, memory limits, non-root users.
5. Upgrade to .NET 10 and current EF Core; float patch versions.
6. Self-host the two font families; remove `UseHttpsRedirection()` or configure forwarded headers.

*Done when:* a 4 MB photo uploads through port 8080; a package restore through port 8080 succeeds; the browser's network panel shows the script gzipped and served from cache on reload; starting a new image with a pending migration leaves a `.bak` file.

### WP4. Tests and CI

1. Backend test project using `WebApplicationFactory` and a temporary SQLite file. Cover: recipe create, update and delete with components; meal plan create and replace; shopping-list totals including components and portion scaling; nutrition weekly totals; every assistant endpoint including its error paths.
2. Frontend: Vitest for `utils/plannerGenerator.ts`, `utils/plannerDate.ts` and `utils/plannerPrepHelper.ts`, which are pure functions with real rules in them.
3. Get `npm run lint` to zero. The seven unused-variable errors are all `_`-prefixed and go away with `argsIgnorePattern`, `varsIgnorePattern` and `caughtErrorsIgnorePattern` set to `^_`. Most `set-state-in-effect` errors are "reset state when a prop changes" and are fixed by keying the component or deriving the value.
4. GitHub Actions: backend build and test, frontend lint, type-check, test and build, and a Docker build for `linux/arm64`.

*Done when:* CI is green on a pull request and fails when a test is broken on purpose.

### WP5. Finish the AI path

1. Review commit `c192a8b`; adjust names and defaults; add the tests from WP4.
2. Add `planningPreferences` to settings (people eating, minimum fish and chicken dinners, excluded tags or ingredients, how many weeks before a dinner may repeat) and return it from `GET /api/assistant/context`. Make the built-in generator read the same values.
3. Log each assistant write and add "undo last assistant change" for meal plans.
4. Add an MCP server exposing `get_context`, `get_recipe`, `save_recipes`, `get_meal_plan` and `set_meal_plan`, each calling the matching endpoint. A stdio server run from a home computer is the simplest start; a remote one needs WP1 and its own token.
5. Optional: Matvaretabellen nutrition lookup for ingredients created without nutrition; an `imageUrl` field on assistant recipes.

*Done when:* from a fresh chat with only the MCP server configured, "plan dinners for next week, two fish days, nothing we had in the last three weeks" produces a saved week and a shopping-list summary without the agent guessing at ids, units or tag names.

### WP6. Frontend bug fixes

Small, independent fixes. Each is a few lines.

1. F1: ignore stale meal-plan responses in `MealPlanContext.loadMealPlan`.
2. F2 and F21: move focus-on-open, focus trap, focus restore, Escape and scroll lock into `components/Modal.tsx`; remove the per-dialog copies.
3. F3: replace `NutritionPage`'s date helpers with the ones in `utils/plannerDate.ts`.
4. F4: match any selected meal tag in the picker, not all.
5. F5: format scaled amounts with up to two decimals instead of rounding to integers.
6. F6: open the planner on the current week and add a Today button.
7. F7: a visible error state with Retry for failed loads; disable planner slots while the plan is unknown; never render a non-JSON error body; add an error boundary.
8. F8: reset the last-scanned barcode on stop and after a failed lookup; use the ISO week-year in the week label; pass a recipe id rather than a new object to the detail modal.
9. F11: wrap the camera lifecycle in a hook that can cancel during start-up.
10. F15 and B6: replace English tag-name checks with system keys or tag categories.
11. F24: move the remaining English strings into the dictionaries.

*Done when:* each of F1–F6 has a test or a scripted browser check that fails on `main` and passes.

### WP7. Design fixes

1. Header: raise the two `min-[1401px]` breakpoints in `appStyles.ts:182` and `:426` to about 1500 px, or drop the offsets.
2. Imageless recipe card for planner, cookbook and picker (D2).
3. Week view: restore the commented-out header row in `MealCalendar.tsx:157-168` using the translated slot names, add a today highlight, make rows denser (D3). Month view: chips for planned meals, "add" on demand (D4).
4. Recipe view as a full-height sheet with a single column on phones (D5).
5. Phone: label or remove the three day squares, stop floating controls covering content, two-line names (D6).
6. Hash routes for pages and an open recipe (D7).
7. Web app manifest and icons.
8. Touch targets of at least 44 px and text contrast of at least 4.5:1 (F23).
9. Start moving theme colours to CSS tokens and delete the unreachable `light` theme (F17–F19). Do it one style group at a time.

*Done when:* screenshots at 390, 1280, 1440 and 1920 px in both themes show no clipped or overlapping controls, and a week of imageless recipes is readable at a glance.

### WP8. Housekeeping

Extract shared mapping and validation out of controllers; one error format; remove the unused `IngredientTag` enum and compatibility-only nutrition fields; move sample data out of `HasData`; fix `frontend/README.md`; split the four large frontend files along the seams in F20; trim the boilerplate file headers.

## 5. How this audit was done

- Read all backend source outside generated migrations. The frontend was covered by a dedicated code review that read all of `frontend/src` and exercised a production build in headless Chrome; I then re-checked its main findings against the code.
- Built the backend and ran it against a scratch SQLite database, loaded it with 34 ingredients, 15 recipes and two planned weeks through the public API, and reproduced the findings marked confirmed.
- Captured every page and the main dialogs in both themes at three viewport sizes.
- Not covered: the Docker images as built (no Docker daemon available), behaviour on real Raspberry Pi hardware, the live Kassalapp, Matvaretabellen, Helsedirektoratet and Vikunja integrations (no keys), and camera scanning.
