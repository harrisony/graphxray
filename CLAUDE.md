# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

GraphXRay is a web-based version of [Graph X-Ray](https://github.com/merill/graphxray/) — a static web app (Vite + React 18 + TypeScript + Fluent UI v9) that accepts HAR files and generates Microsoft Graph API code snippets. No browser extension required.

## Commands

Use `mise exec --` prefix for all npm commands (project pins Node via mise):

- `mise exec -- npm run dev` — Start dev server
- `mise exec -- npm run build` — Type-check + production build
- `mise exec -- npm run preview` — Preview production build

No test suite exists. Build serves as type-check.

## Architecture

**Data flow:** HAR file → `har-parser.ts` (filter by domain) → `client.ts` (DevX API) → `App.tsx` (state) → `CodeView` (render)

### Key files

- `src/common/domains.ts` — `GRAPH_DOMAINS.STANDARD` and `GRAPH_DOMAINS.ULTRA_XRAY` domain lists. `isAllowedDomain()` gates all HAR entries. To add a new endpoint for Ultra X-Ray, add to `GRAPH_DOMAINS.ULTRA_XRAY`.
- `src/common/client.ts` — Calls `devxapi-func-prod-eastus.azurewebsites.net/api/graphexplorersnippets`. Language determines URL params: `javascript`/`java`/`objective-c` get `?lang=`, while `go`/`powershell`/`python` also get `&generation=openapi`. Ultra X-Ray domains skip the DevX API (no snippet generated, `code: null`).
- `src/common/har-parser.ts` — Filters HAR entries by allowed domain, strips OPTIONS requests, sorts by `startedDateTime`.
- `src/App.tsx` — All app state lives here. Processes entries with 5 concurrent workers (`CONCURRENCY = 5`). Changing language re-processes all current entries without re-uploading the HAR.
- `src/components/CommandBar.tsx` — `LANGUAGE_OPTIONS` is the source of truth for supported languages and their file extensions.

### Batch requests

`/$batch` entries are handled specially in `client.ts`: each sub-request inside the batch body gets its own snippet (in `batchCodeSnippets[]`), and the batch request itself also gets a top-level snippet.

### State persistence

`ultraXRayMode` is persisted to `localStorage` key `graphxray-ultraXRayMode`.

## Fluent UI v9 Constraints

- Styles via `makeStyles` from `@fluentui/react-components` — `borderColor` is invalid, use full `border` shorthand
- Error state tokens: `colorStatusDangerBorder1`, `colorStatusDangerBackground1`, `colorStatusDangerForeground1`
- Brand accent: `colorBrandForeground1`
- Fluent UI `Button` inside `<label>` does not trigger file inputs — use a `ref` and call `.click()` instead

## Deployment

- Base path `/graphxray/` set in `vite.config.ts` for GitHub Pages
- Auto-deploys via `.github/workflows/build-and-release.yml`

## Helpers

- Vite docs: https://vite.dev/llms.txt (optimized) or https://vite.dev/llms-full.txt (full)
- Use Context7 MCP for library/API documentation without being asked
