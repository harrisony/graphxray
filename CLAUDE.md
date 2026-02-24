# GraphXRay

Static web app that accepts HAR files and generates Microsoft Graph API code snippets.

## Tech Stack
- Vite + React 18 + TypeScript
- Fluent UI v9 (`@fluentui/react-components`)
- `react-syntax-highlighter` for code display

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Type-check and build for production
- `npm run preview` — Preview production build locally

## Project Structure
- `src/types/har.ts` — HAR 1.2 type definitions
- `src/common/domains.ts` — Graph API domain lists and helpers
- `src/common/client.ts` — DevX API calling logic for code snippet generation
- `src/common/har-parser.ts` — HAR file parsing, filtering, body extraction
- `src/components/` — React components (AppHeader, HarDropZone, CodeView, CommandBar)
- `src/App.tsx` — Root component with state management

## Key Patterns
- HAR entries are filtered by `isAllowedDomain()` from domains.ts
- DevX API calls go to `devxapi-func-prod-eastus.azurewebsites.net`
- Batch requests (`/$batch`) are detected and sub-requests get individual code snippets
- Ultra X-Ray mode adds internal/undocumented Microsoft API domains
- Rate limiting: max 5 concurrent DevX API requests when processing HAR files
