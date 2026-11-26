# MATFLOTE frontend

The browser app: a React 19 and TypeScript app built with Vite, styled with Tailwind CSS 4. The backend and the
deployment are described in the repository's `README.md`.

## Working on it

Node 22 or 24.

```sh
npm ci
npm run dev     # http://localhost:5173
npm test        # Vitest, in the Europe/Oslo time zone
npm run lint    # ESLint; CI fails on any problem
npm run build   # type-check and build into dist/
```

The dev server calls the backend at `http://localhost:5132` (`dotnet run --project backend` from the repository root);
set `VITE_API_BASE_URL` to use another one. A production build calls its own origin: the app's nginx
(`nginx.conf`) serves `dist/` and passes `/api`, `/images` and `/health` on to the backend.

## Where things are

- `src/pages/`: the five pages (planner, cookbook, scanner, nutrition, settings). Larger pages keep their parts in a
  folder of the same name, such as `pages/planner/` and `pages/scanner/`.
- `src/components/`: shared components, and `components/recipeBrowser/` for the cookbook's browser, forms and dialogs.
- `src/contexts/`: the catalog (recipes, ingredients, tags, brands), the meal plan and the language, loaded once and
  shared by the pages.
- `src/services/`: one module per API area. `apiClient.ts` turns an error response (ProblemDetails) into an `ApiError`
  with the server's message.
- `src/utils/`: pure logic with tests: planner dates, the week generator, the prep helper, form values.
- `src/i18n/`: English and Norwegian texts.

## Styles and themes

Classes live in style modules (`src/styles/appStyles.ts`, `components/recipeBrowser/recipeBrowserStyles.ts`) rather than
in the components.

- **Colours** are defined once in `src/index.css` (`@theme`): the palette (`olive`, `olive-dark`, `ivory`, `champagne`,
  `stone`, ...) and a few colours that change with the theme (`text-body`, `text-secondary`, `text-muted`,
  `border-line`).
- **Themes**: the app shell has `data-theme="light"` or `"dark"`. A class is written for the light theme and its dark
  value beside it with the `dark:` variant, for example `bg-ivory dark:bg-neutral-950`; `light:` marks the few classes
  only the light theme has. No component needs to know the theme, except the header that switches it.
- **Layout width**: below 1100 px the app has a fixed header and a bottom navigation. Use the `max-desktop:` and
  `desktop:` variants; code that needs the width uses `src/styles/breakpoints.ts`.
- Text contrast of the theme colours is checked by `src/styles/contrast.test.ts`.
