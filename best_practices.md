# 📘 Project Best Practices

## 1. Project Purpose
Estate Connect AI is a React + TypeScript single-page application for real estate discovery and management. It integrates with Supabase for authentication and data, provides role-based panels (Admin, Agent, Customer), property listing and browsing, community forum features, and a component-based UI using Shadcn/Radix with TailwindCSS. Some modules suggest AI-assisted experiences (e.g., AIAssistant component) for enhanced user workflows.

## 2. Project Structure

Top-level (root app is canonical):
- `src/` — Application source code (primary codebase)
  - `components/` — Reusable UI components and domain components
    - `ui/` — Shadcn/Radix primitive components (generated; keep stable)
    - Other component files — Domain-specific components (cards, modals, sections)
  - `pages/` — Route-level components (AdminPanel, AgentPanel, Dashboard, etc.)
  - `contexts/` — React Contexts (e.g., `AuthContext` for auth/session state)
  - `hooks/` — Custom hooks (e.g., `use-toast`, `use-mobile`)
  - `integrations/supabase/` — Supabase integration and related glue code
  - `lib/` — Client instances and utilities (`supabase.ts`, `supabaseClient.ts`, `utils.ts`)
  - `assets/` — Static assets (images)
  - App entrypoints: `main.tsx` (bootstrapping), `App.tsx` (routing shell)
- `public/` — Static public assets (favicon, robots.txt)
- `supabase/` — Supabase project files
  - `migrations/` — SQL migrations managed by Supabase
  - `config.toml` — Supabase configuration
- Config & meta
  - `index.html` — Vite HTML entry
  - `eslint.config.js`, `tsconfig*.json` — Linting and TypeScript configs
  - `tailwind.config.ts`, `postcss.config.js` — Tailwind/PostCSS configs
  - `.env.example` — Example environment variables
  - `package.json` — Scripts and dependencies

Note on nested app: A nested `estate-connect-ai/` directory mirrors much of the root structure. Treat the root application as canonical unless you explicitly maintain both. Avoid duplicating fixes; converge duplicated modules (especially Supabase clients) into a single source of truth in `src/lib`.

## 3. Test Strategy
Currently, no test framework is configured. Adopt the following:
- Frameworks
  - Unit/component: Vitest + React Testing Library
  - Integration: Vitest + MSW (Mock Service Worker) for API/mutational flows
  - Optional E2E: Playwright for critical user journeys (auth, list property, purchase flow)
- Organization
  - Co-locate tests with sources: `ComponentName.test.tsx` next to files
  - Or place by feature: `src/**/__tests__/*.{test,spec}.ts(x)`
  - Use file names: `*.test.ts(x)` or `*.spec.ts(x)`
- Mocking
  - Mock network/DB via MSW; do not hit real Supabase in unit tests
  - Provide a single test helper to stub `supabase` client (exported from `src/lib/supabase`)
  - For context-based components, wrap tests with `AuthContext` providers
- Coverage & philosophy
  - Target: 80%+ line/branch coverage on core logic and critical UI
  - Prioritize unit tests for pure utilities/hooks, component tests for rendering and interaction, integration tests for flows (auth/login redirect, property listing submit)
  - Minimal snapshot tests; prefer interaction assertions

## 4. Code Style
- TypeScript
  - Use strict typing; avoid `any` and implicit `any`
  - Prefer explicit interfaces/types for component props and data models
  - Derive types from backend when possible (e.g., Supabase-generated types)
- React
  - Use function components with hooks
  - Server-state via TanStack Query; avoid manual useEffect fetches for server data
  - Local component state via `useState`/`useReducer`
  - Forms: `react-hook-form` + `zod` via `zodResolver`
  - Routing: `react-router-dom` route components under `src/pages`
  - Contexts: Keep thin; move data fetching into hooks consumed by providers
- Naming conventions
  - Components/Pages: `PascalCase.tsx`
  - Hooks: `useSomething.ts`
  - Variables/functions: `camelCase`
  - Files: Components in `PascalCase.tsx`, utilities in `camelCase.ts`
- Styling
  - TailwindCSS for layout/utility classes
  - Use `cn` utility (from `utils.ts`) to compose class names; avoid ad-hoc joins
  - Keep styling in JSX; only create CSS files for global resets or truly global styles
- Comments & docs
  - Add JSDoc/TSDoc for complex hooks, contexts, and utilities
  - Document public component props and side effects
- Error handling
  - Wrap async operations (Supabase queries/mutations) in `try/catch`
  - Surface user-facing errors via `sonner` toasts; log technical details to console in dev
  - Normalize error shapes and messages in a utility for reuse

## 5. Common Patterns
- Supabase client
  - Single shared client instance exported from `src/lib/supabase` (see Do’s/Don’ts)
  - Read env via `import.meta.env` with `VITE_` prefix only
- Data fetching & mutations
  - Use TanStack Query (`useQuery`, `useMutation`) with proper `queryKey`s
  - Invalidate or update cached queries on mutations
- Forms & validation
  - `react-hook-form` + `zod` schemas; centralize schemas by feature
- UI primitives
  - Shadcn/Radix components in `components/ui` are source-of-truth primitives
  - Compose higher-level domain components in `components/` using primitives
- Access control
  - Use `AuthContext` and any guard components (e.g., `RoleRedirect`) for role-based routing
- Utilities
  - `utils.ts` for `cn` and small helpers; keep utils pure and tested

## 6. Do’s and Don’ts
- Do
  - Centralize Supabase usage through a single client module in `src/lib`
  - Use React Query for all server state; co-locate query keys and hooks with features
  - Keep pages thin; push logic into hooks/services
  - Validate all user input with `zod` and surface errors with toasts
  - Use TypeScript types for API responses and component props
  - Keep `components/ui` pristine; extend in separate wrappers if customization is needed
  - Keep environment variables documented in `.env.example`
  - Prefer lazy-load for route-level pages to reduce initial bundle
- Don’t
  - Don’t create multiple Supabase clients (avoid both `supabase.ts` and `supabaseClient.ts` co-existing); converge to one
  - Don’t fetch data in `useEffect` without React Query (no manual loading/error state duplication)
  - Don’t commit secrets; `.env` is untracked and `.env.example` should use placeholders
  - Don’t put complex business logic directly inside JSX; move to hooks/services
  - Don’t break UI consistency by bypassing primitives with arbitrary HTML/CSS

## 7. Tools & Dependencies
- Runtime & Build
  - Vite — dev server and bundler
  - TypeScript — static typing
- UI & Styling
  - TailwindCSS — utility-first styling
  - Shadcn + Radix UI — accessible primitives
  - `class-variance-authority`, `tailwind-merge`, `clsx` — styling utilities
- State, Forms, Validation
  - TanStack Query — server-state management
  - `react-hook-form` — form state
  - `zod` — schema validation
- Platform & Data
  - `@supabase/supabase-js` — auth and database client
- UX & Misc
  - `sonner` — toasts
  - `date-fns` — date utilities
  - `recharts`, `embla-carousel-react`, `lucide-react` — charts, carousel, icons
- Scripts (package.json)
  - `dev` — run the app locally
  - `build` / `build:dev` — build for production/development
  - `preview` — preview production build
  - `lint` — run ESLint
- Setup
  - Node 18+ recommended
  - Copy `.env.example` to `.env` and fill required `VITE_` variables (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  - Install deps: `npm install` then `npm run dev`
  - Supabase migrations live under `supabase/migrations` (use Supabase CLI if you manage schema locally)

## 8. Other Notes
- Duplicate app folders exist (root `src/` and `estate-connect-ai/src/`). Treat the root as primary; avoid editing both. If both must be maintained, create a policy to sync or deprecate one.
- Consolidate Supabase client into a single module (`src/lib/supabase.ts` preferred). Deprecate `supabaseClient.ts` to prevent drift.
- Use `import.meta.env` for env variables; only `VITE_` prefixed variables are exposed to the client. Do not access process.env directly in browser code.
- When adding new pages, prefer route-based code splitting using `React.lazy` and `Suspense`.
- For consistent accessibility, rely on Radix primitives and verify keyboard/focus behavior in custom components.
- Keep migration SQL idempotent and name migrations clearly. Document any manual DB steps in README.
