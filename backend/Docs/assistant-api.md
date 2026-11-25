# MATFLOTE assistant API

A small, name-based API for AI agents and scripts that create recipes and plan meals.
It sits next to the regular API (which the web app uses and which works with numeric IDs).
All paths below are relative to the MATFLOTE base URL, for example `http://<server>:8080`.

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

## Rules that are easy to get wrong

- **Units are weight or volume only**: `g`, `kg`, `ml`, `l`. `cl`, `dl`, `tsp`/`ts` and `tbsp`/`ss` are accepted and converted to ml. There is no "piece" unit: convert "2 onions" to grams. `conversionRules` in the context lists the household's own conversions (for example `1 yellow onion → 170 g`).
- **Recipe names are short** (see `vocabulary.limits.recipeNameMaxLength`, currently 30 characters). Put detail in `description`.
- **Tags must already exist.** Use the names from `tagCategories` in the context. Matching ignores case and spaces. The meal tags (`Breakfast`, `Lunch`, `Dinner`) and protein tags (`Fish`, `Chicken`, `Beef`, `Lamb`, `Mince`) matter: the app's own "Generate week" feature and its variety rules rely on them, so tag recipes accurately.
- **`portions` on a recipe** is the number of servings the listed amounts make. **`portions` on a planned meal** is how many servings to cook that day; shopping lists and nutrition scale by `planned portions / recipe portions`.
- **One line per ingredient per recipe.** Repeated lines for the same ingredient are added together.
- Amounts are for the raw ingredient as bought, since they feed the shopping list.
- Recipes created here have no image. Images are added in the web app.

## GET /api/assistant/context

Optional query: `historyDays` (default 56) — the window used for `plannedCount`.

```json
{
  "serverDate": "2026-11-25",
  "weekStart": "2026-11-23",
  "historyDays": 56,
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
      "plannedCount": 2, "lastPlanned": "2026-11-24"
    }
  ]
}
```

`serverDate` is the server's clock and may be in UTC. `lastPlanned` is the most recent date on or before `serverDate`; it is omitted for recipes that were never planned. Week plans run Monday to Sunday.

## POST /api/assistant/recipes

```json
{
  "dryRun": false,
  "onExistingRecipe": "skip",
  "onExistingIngredient": "skip",
  "createMissingIngredients": true,
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
| `onExistingRecipe` | What to do when a recipe with the same name exists: `skip` (default, leave it and warn), `update` (replace everything except its image), `error`. |
| `onExistingIngredient` | For entries under `ingredients`: `skip` (default) or `update`. An update only changes the fields that are present, so it can add nutrition without touching tags. |
| `createMissingIngredients` | Default `true`: a recipe line naming an unknown ingredient creates it, with no tags and no nutrition, and says so in a warning. Set `false` to get an error with suggestions instead. |
| `ingredients` | Optional. Define ingredients fully (tags, nutrition per 100 g/ml, colour, brand) before recipes use them. Do this for anything new, otherwise the Nutrition page has gaps. |
| `recipes[].id` | Optional. When present the recipe with that id is updated, which is how a recipe is renamed. |
| `recipes[].ingredients[].brand` | Optional. Without it, the unbranded ingredient of that name is preferred. |
| `recipes[].ingredients[].amount` | May be omitted for "to taste"; the shopping list then shows "as needed". |
| `recipes[].components` | Other recipes used inside this one, by name: `{ "recipe": "Garlic yogurt sauce", "amount": 100, "unit": "g" }`. The other recipe may be in the same request. |

`nutritionPer100` fields (all optional): `calories`, `carbohydrateGrams`, `proteinGrams`, `fatGrams`, `saltGrams`, `dietaryFiberGrams`, `saturatedFatGrams`, `transFatGrams`, `monounsaturatedFatGrams`, `polyunsaturatedFatGrams`, `omega3Grams`, `omega6Grams`, `cholesterolMilligrams`, `vitaminAMicrograms`, `vitaminB9Micrograms`, `vitaminB12Micrograms`, `vitaminCMilligrams`, `vitaminDMicrograms`, `vitaminEMilligrams`. For Norwegian foods, `GET /api/product-lookup/matvaretabellen?query=<norwegian name>` returns official values to copy from.

Response (`200`, or `422` when anything failed):

```json
{
  "dryRun": false,
  "applied": true,
  "errors": [],
  "ingredients": [{ "name": "Red lentils", "status": "created", "id": 41, "warnings": [], "errors": [] }],
  "recipes": [{ "name": "Red lentil soup", "status": "created", "id": 17, "warnings": [], "errors": [] }]
}
```

`status` is `created`, `updated` or `skipped` when `applied` is true; `would_create` / `would_update` when it is a dry run or the request was rejected; `error` for the items that caused a rejection.

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
| `clearRange` | Optional. Every existing meal in the range that is **not** listed in `entries` is removed. Use it with a full week of entries to replace the week. At most 62 days. |
| `entries[].items` | A recipe item (`recipe` name or `recipeId`, plus `portions`) or an ingredient item (`ingredient`, `amount`, `unit`). An entry with no items clears that slot. |
| `items[].portions` | Defaults to the recipe's own portion count. |
| `items[].role` | `Main`, `Sauce`, `Side` or `Extra`. Defaults to `Main` for the first item and `Side` for the rest. |

There is one entry per date and slot. Recipes and ingredients must exist before they are planned; an unknown name is an error with "did you mean" suggestions.

Response (`200` or `422`): one row per affected slot with `status` `created`, `replaced`, `cleared`, `skipped` or `unchanged` (prefixed `would_` when not applied), the resolved `items`, and any `warnings` / `errors`.

## Checking the result

These regular endpoints are useful after planning:

- `GET /api/grocerylists/preview?from=YYYY-MM-DD&to=YYYY-MM-DD` — the shopping list the plan produces.
- `GET /api/nutrition/weekly?from=YYYY-MM-DD&to=YYYY-MM-DD` — nutrition totals against the household's reference profile, including which ingredients lack nutrition data.

## A typical session

1. `GET /api/assistant/context`. Note what exists, which recipes were planned recently, and the tag names.
2. If new recipes are needed, `POST /api/assistant/recipes` with `"dryRun": true`, fix whatever comes back, then post again without it.
3. `PUT /api/assistant/meal-plan` for the week, with `clearRange` covering Monday to Sunday if the whole week is being replaced.
4. `GET /api/grocerylists/preview` for the same range and report the plan and shopping list back to the person.
