# MATFLOTE assistant API

A small, name-based API for AI agents and scripts that create recipes and plan meals.
It sits next to the regular API (which the web app uses and which works with numeric IDs).
All paths below are relative to the MATFLOTE base URL: the address the web app is opened at, for example `https://matflote.mariuskristensen.no`
(the web app's nginx passes `/api` on to the backend), or the backend directly at `http://<server>:8080`.

This guide is served at `GET /api/assistant`.

## The short version

1. `GET /api/assistant/context` — read this first. One response with the allowed units, tags, meal slots and limits, plus a compact list of every ingredient and recipe and how recently each recipe was planned.
2. `POST /api/assistant/recipes` — create or update recipes by name. Ingredients are referenced by name and created if missing.
3. `PUT /api/assistant/meal-plan` — set any number of meals in one call, referring to recipes by name.
4. `GET /api/assistant/meal-plan?from=YYYY-MM-DD&to=YYYY-MM-DD` — read a plan back with names instead of IDs.

Both write endpoints behave the same way:

- The whole request is validated before anything is saved. If there is any error, **nothing is written**, the response is `422`, and every problem is listed so they can all be fixed in one go.
- `"dryRun": true` runs the validation and reports what would happen without saving.
- Unknown JSON properties are rejected (`400`), so a misspelled field is reported instead of ignored.
- `warnings` do not block the request. Read them: they flag things like an ingredient that was created without nutrition data.

Two kinds of error response:

- **Results.** The `422` of the write endpoints and the `404`/`409` of the undo are the result bodies shown below, with `errors` per item. Read them as results.
- **Everything else** (`400` for a malformed request or a misspelled field, `404` for an unknown recipe id, `500`) is [ProblemDetails](https://www.rfc-editor.org/rfc/rfc9457), `application/problem+json`. Show `error`, which always holds the message (the same as `detail`, or `title` when there is no detail). A misspelled field is named under `errors`.

```json
{ "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5", "title": "Not Found", "status": 404, "detail": "No recipe has id 99.", "error": "No recipe has id 99." }
```

## Rules that are easy to get wrong

- **Units are weight or volume only**: `g`, `kg`, `ml`, `l`. `cl`, `dl`, `tsp`/`ts` and `tbsp`/`ss` are accepted and converted to ml. There is no "piece" unit: convert "2 onions" to grams. `conversionRules` in the context lists the household's own conversions (for example `1 yellow onion → 170 g`).
- **Recipe names are short** (see `vocabulary.limits.recipeNameMaxLength`, currently 30 characters). Put detail in `description`.
- **Tags must already exist.** Use the names from `tagCategories` in the context. Matching ignores case, spaces and hyphens. A category with `forRecipes: false` holds ingredient-only tags (and `forIngredients: false` recipe-only ones); such a tag on the wrong kind of item is saved but gives a warning, because the web app does not show it. The meal tags (`Breakfast`, `Lunch`, `Dinner`) and protein tags (`Fish`, `Chicken`, `Beef`, `Lamb`, `Mince`) matter: the app's own "Generate week" feature and its variety rules rely on them, so tag recipes accurately.
- **`portions` on a recipe** is the number of servings the listed amounts make. **`portions` on a planned meal** is how many servings to cook that day; shopping lists and nutrition scale by `planned portions / recipe portions`.
- **One line per ingredient per recipe.** Repeated lines for the same ingredient are added together.
- Amounts are for the raw ingredient as bought, since they feed the shopping list.
- **Photos.** `imageUrl` on a recipe may be the http(s) address of a JPEG, PNG or WebP photo (at most 5 MB, fetched within 15 seconds). MATFLOTE downloads it and stores its own copy; it never links to the other site. Only use photos you are allowed to copy, such as ones the person gave you.

## GET /api/assistant/context

Optional query: `historyDays` (default 56) — the window used for `plannedCount`.

```json
{
  "serverDate": "2026-11-25",
  "weekStart": "2026-11-23",
  "historyDays": 56,
  "planningPreferences": {
    "peopleEating": 2, "minFishDinnersPerWeek": 1, "minChickenDinnersPerWeek": 2,
    "avoidTags": ["Lamb"], "avoidIngredients": ["Coriander"], "repeatAfterWeeks": 3,
    "notes": "Quick dinners on weekdays."
  },
  "vocabulary": {
    "units": ["g", "kg", "ml", "l"],
    "unitAliases": { "cl": "10 ml", "dl": "100 ml", "tsp / ts": "5 ml", "tbsp / ss": "15 ml" },
    "preparations": ["Quartered", "Wedged", "Chopped", "..."],
    "mealSlots": ["Breakfast", "Lunch", "Dinner", "Snack1", "Snack2"],
    "mealRoles": ["Main", "Sauce", "Side", "Extra"],
    "limits": { "recipeNameMaxLength": 30, "ingredientNameMaxLength": 40, "descriptionMaxLength": 600, "mealNotesMaxLength": 500 }
  },
  "tagCategories": [
    { "category": "Meal", "forIngredients": true, "forRecipes": true, "tags": ["Breakfast", "Dinner", "Lunch"] }
  ],
  "conversionRules": [{ "from": "1 yellow onion", "to": "170 g" }],
  "ingredients": [{ "id": 12, "name": "Yellow onion", "tags": ["Vegetable"], "hasNutrition": true }],
  "recipes": [
    {
      "id": 8, "name": "Spaghetti bolognese", "portions": 4, "tags": ["Dinner", "Pasta"],
      "ingredients": ["Canned tomatoes", "Minced beef", "Spaghetti"],
      "plannedCount": 2, "lastPlanned": "2026-11-24", "nextPlanned": "2026-11-28",
      "rating": 4, "ratingNote": "Kids loved it"
    }
  ]
}
```

`rating` (1 = never again, 5 = a favourite) and `ratingNote` are the household's own verdict on a recipe, set in the recipe view; both are omitted for unrated recipes. Prefer well-rated recipes, avoid low-rated ones, and read the note. The assistant API cannot change them.

`planningPreferences` is what the household set under Settings → Planning preferences: how many people eat (use it as the `portions` of planned dinners), the minimum fish and chicken dinners per week (recipes tagged `Fish` / `Chicken`), tags and ingredients to avoid, how many weeks must pass before a dinner is planned again (`0` = no rule) and free-text notes. Follow them unless the person asks for something else.

`serverDate` is the server's clock and may be in UTC. `lastPlanned` is the most recent date on or before `serverDate`, and `nextPlanned` the first date after it; each is omitted when there is none. So a recipe "not planned in the last three weeks" before next Monday has no `lastPlanned` on or after next Monday − 21 days and no `nextPlanned` before next Monday. Week plans run Monday to Sunday.

## POST /api/assistant/recipes

```json
{
  "dryRun": false,
  "onExistingRecipe": "skip",
  "onExistingIngredient": "skip",
  "createMissingIngredients": true,
  "lookupNutrition": false,
  "ingredients": [
    {
      "name": "Red lentils",
      "tags": ["Grain"],
      "description": "Split lentils that cook in 15 minutes.",
      "color": "#d9693a",
      "nutritionPer100": { "calories": 340, "carbohydrateGrams": 50, "proteinGrams": 24, "fatGrams": 1.5, "dietaryFiberGrams": 11, "saltGrams": 0.01 }
    }
  ],
  "recipes": [
    {
      "name": "Red lentil soup",
      "description": "Quick weeknight soup.",
      "instructions": "1. Soften the onion in oil.\n2. Add lentils, tomatoes and water. Simmer 15 minutes.\n3. Blend and season.",
      "portions": 4,
      "imageUrl": "https://example.com/photos/lentil-soup.jpg",
      "tags": ["Dinner", "Soup", "Vegetarian"],
      "ingredients": [
        { "name": "Red lentils", "amount": 250, "unit": "g" },
        { "name": "Yellow onion", "amount": 170, "unit": "g", "preparation": "Diced" },
        { "name": "Canned tomatoes", "amount": 400, "unit": "g" },
        { "name": "Olive oil", "amount": 1, "unit": "tbsp" }
      ],
      "components": []
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `onExistingRecipe` | What to do when a recipe with the same name exists: `skip` (default, leave it and warn), `update` (replace everything; the photo only if `imageUrl` is sent; never the household's rating), `error`. |
| `onExistingIngredient` | For entries under `ingredients`: `skip` (default) or `update`. An update only changes the fields that are present, so it can add nutrition without touching tags. |
| `createMissingIngredients` | Default `true`: a recipe line naming an unknown ingredient creates it, with no tags and no nutrition, and says so in a warning. Set `false` to get an error with suggestions instead, which makes sure every new ingredient is defined under `ingredients` with its tags. |
| `lookupNutrition` | Default `false`. When `true`, every ingredient this request **creates** without `nutritionPer100` (defined under `ingredients` or created from a recipe line) is looked up by name in Matvaretabellen, the Norwegian food composition table, and the best match is attached if its confidence is at least 0.70. The result says what was matched (`nutritionMatch`), or warns when nothing matched well enough. Norwegian names match best ("Laks", not "Salmon"). Existing ingredients are never looked up. Works in a dry run too, so you can check the matches first. |
| `ingredients` | Optional. Define ingredients fully (tags, nutrition per 100 g/ml, colour, brand) before recipes use them. Do this for anything new, otherwise the Nutrition page has gaps. A new ingredient without tags or without nutrition is created with a warning. |
| `recipes[].id` | Optional. When present the recipe with that id is updated, which is how a recipe is renamed. |
| `recipes[].imageUrl` | Optional. An `http`/`https` address: the photo is downloaded into MATFLOTE (checked as JPEG, PNG or WebP by type and content, at most 5 MB, 15 second limit) and the recipe result's `imageUrl` gives its new `/images/...` path. A `/images/...` path from `GET /api/assistant/recipes/{id}` keeps that stored photo. `""` removes the photo. Left out: a new recipe has no photo and an update keeps the current one. A photo that cannot be fetched or is not an image is an error, so nothing is saved. Thumbnails for downloaded photos are made from the web app (Settings → Maintenance). |
| `recipes[].ingredients[].brand` | Optional. Without it, the unbranded ingredient of that name is preferred. |
| `recipes[].ingredients[].amount` | May be omitted for "to taste"; the shopping list then shows "as needed". |
| `recipes[].components` | Other recipes used inside this one, by name: `{ "recipe": "Garlic yogurt sauce", "amount": 100, "unit": "g" }`. The other recipe may be in the same request. |

`nutritionPer100` fields (all optional, per 100 g or 100 ml, between 0 and 100000; a misspelled field is rejected with `400`; `calories` is rounded to a whole number): `calories`, `carbohydrateGrams`, `proteinGrams`, `fatGrams`, `saltGrams`, `dietaryFiberGrams`, `saturatedFatGrams`, `transFatGrams`, `monounsaturatedFatGrams`, `polyunsaturatedFatGrams`, `omega3Grams`, `omega6Grams`, `cholesterolMilligrams`, `vitaminAMicrograms`, `vitaminB9Micrograms`, `vitaminB12Micrograms`, `vitaminCMilligrams`, `vitaminDMicrograms`, `vitaminEMilligrams`. For Norwegian foods, `GET /api/product-lookup/matvaretabellen?query=<norwegian name>` returns official values to copy from.

Response (`200`, or `422` when anything failed):

```json
{
  "dryRun": false,
  "applied": true,
  "errors": [],
  "ingredients": [
    { "name": "Red lentils", "status": "created", "id": 41, "warnings": [], "errors": [] },
    {
      "name": "Laks", "status": "created", "id": 42, "warnings": [], "errors": [],
      "nutritionMatch": { "foodId": "05.123", "foodName": "Laks, oppdrett, rå", "confidence": 0.98, "url": "https://www.matvaretabellen.no/..." }
    }
  ],
  "recipes": [{ "name": "Red lentil soup", "status": "created", "id": 17, "imageUrl": "/images/recipes/3f2a9c1b04de4c7e.jpg", "warnings": [], "errors": [] }]
}
```

`status` is `created` or `updated` when `applied` is true; `would_create` / `would_update` when it is a dry run or the request was rejected; `skipped` (never prefixed) for an existing item left alone; `error` for the items that caused a rejection. Two entries in one request may not change the same recipe (for example one by `id` and one by its old name).

To edit an existing recipe: `GET /api/assistant/recipes/{id}` returns it in exactly the shape above, so change what is needed and post it back inside `"recipes": [ ... ]` with `"onExistingRecipe": "update"`.

## PUT /api/assistant/meal-plan

```json
{
  "dryRun": false,
  "mode": "replace",
  "clearRange": { "from": "2026-11-30", "to": "2026-12-06" },
  "entries": [
    { "date": "2026-11-30", "slot": "Dinner", "items": [{ "recipe": "Red lentil soup", "portions": 2 }] },
    {
      "date": "2026-12-01", "slot": "Dinner", "notes": "Guests",
      "items": [
        { "recipe": "Baked salmon with potatoes", "portions": 4 },
        { "recipe": "Garlic yogurt sauce", "portions": 1, "role": "Sauce" }
      ]
    },
    { "date": "2026-12-01", "slot": "Snack1", "items": [{ "ingredient": "Banana", "amount": 120, "unit": "g" }] }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `mode` | `replace` (default): each listed date + slot is overwritten. `fill`: slots that already have something are left alone and reported as `skipped`. |
| `entries[].date` | Required, `YYYY-MM-DD`. |
| `entries[].slot` | Required: a name from `vocabulary.mealSlots` (case is ignored; numbers are not accepted). |
| `clearRange` | Optional, `{ "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }`, both required. Every existing meal in the range that is **not** listed in `entries` is removed. Use it with a full week of entries to replace the week. At most 62 days. |
| `entries[].items` | A recipe item (`recipe` name or `recipeId`, plus `portions`) or an ingredient item (`ingredient`, `amount`, `unit`). An entry with no items clears that slot. |
| `items[].portions` | Recipe items only. Defaults to the recipe's own portion count. Must be greater than 0 after rounding to two decimals. |
| `items[].amount`, `items[].unit` | Ingredient items only. `amount` is required and greater than 0. |
| `items[].role` | `Main`, `Sauce`, `Side` or `Extra`. Defaults to `Main` for the first item and `Side` for the rest. |

There is one entry per date and slot. Recipes and ingredients must exist before they are planned; an unknown name is an error with "did you mean" suggestions.

Response (`200` or `422`): one row per affected slot with `status` `created`, `replaced` or `cleared` (prefixed `would_` when not applied), `skipped` (a planned slot left alone in `fill` mode) or `unchanged` (an empty entry for a slot that was already empty), the resolved `items`, and any `warnings` / `errors`.

## GET /api/assistant/meal-plan

`from` and `to` are optional: with neither, the current week (Monday to Sunday); with one, the seven days starting or ending on it. At most 366 days per read (`400` otherwise).

## POST /api/assistant/meal-plan/undo

Undoes the most recent `PUT /api/assistant/meal-plan` that has not been undone yet. The body is optional:

```json
{ "dryRun": false, "force": false }
```

- **What is put back.** Exactly the slots that write created, replaced or cleared (including slots removed by `clearRange`), each as it was just before the write. Slots it skipped (`fill` mode) or left `unchanged` are not touched, and neither is anything else in the week.
- **Several writes.** Each call undoes one write, newest first: call it twice to undo the last two writes. An undo cannot itself be undone.
- **Changed since.** If one of those slots was changed after the write (in the web app, say), nothing is undone and the response is `409`, with that slot marked `changed_since`. Send `"force": true` to put the old meals back anyway; the later change is then lost. A slot that is already back as it was before the write is not a conflict.
- **Deleted recipes.** A recipe or ingredient deleted since cannot come back; the rest of that meal is restored and the slot gets a warning.
- `404` when there is no meal plan write left to undo. Recipe imports are logged but cannot be undone.

Response (`200`, `404` or `409`):

```json
{
  "dryRun": false, "applied": true,
  "undoneWriteId": 12, "undoneWriteSummary": "Meal plan 2026-11-30 to 2026-12-06: 5 created, 2 replaced.", "undoneWriteAt": "2026-11-25T18:00:00+00:00",
  "errors": [],
  "slots": [{ "date": "2026-11-30", "slot": "Dinner", "status": "restored", "items": ["Fish soup × 2"], "warnings": [] }]
}
```

`status` is `restored` (the slot had a meal before the write), `cleared` (it was empty), `would_restore` / `would_clear` in a dry run, or `changed_since`.

## GET /api/assistant/log

The latest writes through this API, newest first (`?limit=`, default 10, at most 100). Dry runs and rejected requests are not logged. The web app shows them under Settings → Assistant activity, with an Undo button for the newest meal plan write.

```json
[
  {
    "id": 12, "at": "2026-11-25T18:00:00+00:00", "endpoint": "PUT /api/assistant/meal-plan",
    "summary": "Meal plan 2026-11-30 to 2026-12-06: 5 created, 2 replaced.",
    "counts": { "slotsCreated": 5, "slotsReplaced": 2 },
    "canUndo": true, "isNextUndo": true, "from": "2026-11-30", "to": "2026-12-06"
  }
]
```

## Checking the result

These regular endpoints are useful after planning:

- `GET /api/grocerylists/preview?from=YYYY-MM-DD&to=YYYY-MM-DD` — the shopping list the plan produces. Each ingredient is one line per kind of unit (weight or volume), its total rounded up to a shop-sized step and given in g or ml, or in kg or l from 1000; `displayAmount` is the text to show. Sections come from the tags' system keys.
- `GET /api/nutrition/weekly?from=YYYY-MM-DD&to=YYYY-MM-DD` — nutrition totals against the household's reference profile, including which ingredients lack nutrition data.

## A typical session

`docs/agent-guide.md` in the repository is the short version for agents, with the house rules. In five requests:

1. `GET /api/assistant/context`. Note what exists, which recipes were planned recently, the tag names and the planning preferences.
2. If new recipes are needed, `POST /api/assistant/recipes` with `"dryRun": true` (and `"createMissingIngredients": false`); fix whatever comes back.
3. The same request with `"dryRun": false`.
4. `PUT /api/assistant/meal-plan` for the week with `"dryRun": true`, with `clearRange` covering Monday to Sunday if the whole week is being replaced. Any `would_replace` or `would_clear` row is a meal the household already planned: ask before going on.
5. The same request with `"dryRun": false`.

If the person wants the shopping list, `GET /api/grocerylists/preview` for the same range.
