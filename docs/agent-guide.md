# MATFLOTE for AI agents

MATFLOTE is the household's recipe book and meal planner. This file is all you need to add recipes and plan meals
in it over HTTP. Read it to the end before the first request.

## Where it is

- **Base URL:** `https://<hostname>` — the address the web app is opened at. *(Owner: replace `<hostname>` with the
  MATFLOTE host name, the same one the browser uses through Tailscale.)*
- Every path below goes after the base URL, for example `https://<hostname>/api/assistant/context`.
- No login and no API key. Send and expect JSON (`Content-Type: application/json`).
- The full reference is served at `GET /api/assistant`. You should not need it for the session below.

## The session: five requests

Adding recipes and planning a week takes exactly these requests, in this order. Do not skip the dry runs.

| # | Request | Why |
| --- | --- | --- |
| 1 | `GET /api/assistant/context` | What exists: tags, ingredients, recipes and when each was planned, the household's preferences |
| 2 | `POST /api/assistant/recipes` with `"dryRun": true` | Check the new recipes; nothing is saved |
| 3 | `POST /api/assistant/recipes`, the same body with `"dryRun": false` | Save them |
| 4 | `PUT /api/assistant/meal-plan` with `"dryRun": true` | Check the week; shows whether it already has meals |
| 5 | `PUT /api/assistant/meal-plan`, the same body with `"dryRun": false` | Save the week |

No new recipes needed? Skip 2 and 3. If a dry run comes back `422`, fix **every** error it lists (they are all
reported at once) and repeat that dry run before the real request.

Only if the person asks for the shopping list: `GET /api/grocerylists/preview?from=YYYY-MM-DD&to=YYYY-MM-DD`.

### 1. Read the context

`GET /api/assistant/context`. Use from the answer:

- `weekStart` — Monday of the current week. **Next week** runs from `weekStart + 7 days` (Monday) to
  `weekStart + 13 days` (Sunday).
- `planningPreferences` — `peopleEating` (use it as `portions` for each planned dinner),
  `minFishDinnersPerWeek` and `minChickenDinnersPerWeek`, `avoidTags`, `avoidIngredients`,
  `repeatAfterWeeks` (weeks before a dinner may be planned again) and `notes`. Follow them unless the person asks
  for something else; what the person asks wins.
- `tagCategories` — the only tags there are. You cannot create tags. A category with `forIngredients: false` is
  for recipes only, and `forRecipes: false` for ingredients only.
- `ingredients` — every ingredient by `name` (and `brand`). Reuse these names exactly; only define an ingredient
  when nothing here is the same thing.
- `recipes` — every recipe with its `tags`, `portions`, `lastPlanned` (latest date on or before today),
  `nextPlanned` (first date after today) and, when the household rated it, `rating` (1–5) and `ratingNote`.
- `vocabulary` — units, meal slots, preparations and length limits. `conversionRules` — the household's own
  conversions, such as `1 yellow onion → 170 g`.

### 2 and 3. Add recipes

```json
{
  "dryRun": true,
  "createMissingIngredients": false,
  "lookupNutrition": true,
  "ingredients": [
    { "name": "Torsk", "tags": ["Fish"] },
    { "name": "Purreløk", "tags": ["Vegetable"] }
  ],
  "recipes": [
    {
      "name": "Torsk med purreløk",
      "description": "Baked cod on leeks with butter sauce.",
      "instructions": "1. Slice the leeks and soften them in butter.\n2. Put the cod on top and bake 15 minutes at 200 °C.",
      "portions": 4,
      "tags": ["Dinner", "Fish"],
      "ingredients": [
        { "name": "Torsk", "amount": 600, "unit": "g" },
        { "name": "Purreløk", "amount": 300, "unit": "g", "preparation": "Sliced" },
        { "name": "Butter", "amount": 2, "unit": "tbsp" }
      ]
    }
  ]
}
```

Rules:

- **Every new ingredient goes under `ingredients` with at least one tag** (Vegetable, Fish, Dairy, Spice, ...).
  Keep `"createMissingIngredients": false`: then a recipe line naming an ingredient you forgot to define is an error
  instead of an untagged ingredient.
- Nutrition: give `nutritionPer100` (per 100 g or 100 ml) when you know the values, otherwise keep
  `"lookupNutrition": true`, which fills them from Matvaretabellen, the Norwegian food table. Norwegian names
  match best. The dry run shows each match under `nutritionMatch`, or warns when there is none.
- Tag each recipe with its meal (`Dinner`, `Lunch`, `Breakfast`) and its protein (`Fish`, `Chicken`, `Beef`,
  `Lamb`, `Mince`) when it has one. The planner's rules depend on these.
- Units are `g`, `kg`, `ml` or `l` (`dl`, `cl`, `tsp`/`ts` and `tbsp`/`ss` are converted). There is no "piece":
  convert "2 onions" to grams. Amounts are for the raw ingredient as bought.
- Recipe names are at most 30 characters; put detail in `description`. `portions` is how many servings the listed
  amounts make.
- `imageUrl` (optional): the http(s) address of a JPEG, PNG or WebP photo you may copy. MATFLOTE downloads it.
- A recipe whose name already exists is skipped with a warning; send `"onExistingRecipe": "update"` only if the
  person asked to change that recipe.

The dry run answers `200` with `"applied": false` and a row per item (`would_create`, `would_update`,
`skipped`), or `422` with `errors`. Read the `warnings` too. Then send the same body with `"dryRun": false`; the
answer has `"applied": true` and each item's `id`.

### 4 and 5. Plan the week

```json
{
  "dryRun": true,
  "mode": "replace",
  "clearRange": { "from": "2026-11-30", "to": "2026-12-06" },
  "entries": [
    { "date": "2026-11-30", "slot": "Dinner", "items": [{ "recipe": "Torsk med purreløk", "portions": 2 }] },
    { "date": "2026-12-01", "slot": "Dinner", "items": [{ "recipe": "Chicken rice bowl", "portions": 2 }] }
  ]
}
```

One entry per day and slot. Choosing the dinners:

- **Not planned recently.** "Nothing planned in the last N weeks" (N from the person, else
  `planningPreferences.repeatAfterWeeks`) means: leave out every recipe whose `lastPlanned` is on or after
  *next Monday − 7×N days*, and every recipe whose `nextPlanned` is before next Monday (it is already planned for
  later this week). Recipes created in step 3 were never planned.
- **Protein days.** A fish day is a dinner whose recipe has the `Fish` tag; the same for `Chicken`. Meet what the
  person asked for, otherwise the minimums in `planningPreferences`.
- **Preferences.** Skip recipes with an `avoidTags` tag or an `avoidIngredients` ingredient. Prefer recipes rated
  4–5, avoid 1–2, and read `ratingNote`. Use each recipe once a week unless the person wants leftovers.
- `portions` on a planned meal is how many servings to cook that day: use `peopleEating`.

`clearRange` from next Monday to next Sunday makes the week exactly what you send: any other meal already in that
week is removed. Without it, only the listed slots change.

**Read the dry run before saving.** Every row with `would_replace` or `would_clear` is a meal the household already
planned. If there is any, stop and ask the person first: say what is there, and offer to replace it or to keep it
(send `"mode": "fill"` and no `clearRange`, which only fills empty slots). Only then send the real request
(`"dryRun": false`).

## House rules

1. **Dry run first**, every time, for recipes and for the meal plan.
2. **Ask before replacing a week that already has meals** (any `would_replace` or `would_clear` in the dry run).
3. **Prefer existing ingredients and recipes.** Reuse names from the context; when a dry run warns that a similar
   ingredient exists, use that one instead of creating a near-duplicate.
4. **Every new ingredient has tags**, and nutrition from `nutritionPer100` or `lookupNutrition`.
5. **Use existing tags only.** If none fits, say so to the person instead of guessing.
6. **Tell the person what you did**: the recipes added and the meal for each day.

## Undo

The person can see every write you make under Settings → Assistant activity. If a meal plan write was wrong,
`POST /api/assistant/meal-plan/undo` puts back the slots your last meal plan write changed (call it again to undo
the one before). It answers `409` and changes nothing if the person has edited those meals since; only send
`{ "force": true }` if the person agrees. Recipe imports cannot be undone; tell the person, who can delete a recipe
in the web app.

## Approval

Reading (`GET`) never changes anything. The requests that write are `POST /api/assistant/recipes`,
`PUT /api/assistant/meal-plan` and `POST /api/assistant/meal-plan/undo` without `"dryRun": true`. Whether those may
run without asking first is the owner's decision for the environment the agent runs in.
