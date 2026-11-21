# Agent Guide

This repository is an Angular 22 HoReCa marketing site that consumes reusable HoReCa contracts,
services, and guidance from the npm package `@wawjs/ngx-horeca`.

Treat this project as a prerender-first business website. The app owns its pages, routes, layouts,
business content, company profile, and static assets. Reusable HoReCa feature APIs
must be imported from `@wawjs/ngx-horeca`.

## Quick Reference

- Stack: Angular 22, TypeScript 6, Angular SSR/prerender, Tailwind CSS, SCSS
- Package manager: `npm`
- Main goal: fast, clean, SEO-friendly HoReCa landing pages
- Primary output: prerendered static site from `dist/app/browser`
- Local app source: `src/`
- App-owned content bridge and company profile: `src/app/feature/content/` and
  `src/app/feature/company/`
- Reusable package: `@wawjs/ngx-horeca`
- Package guidance: `node_modules/@wawjs/ngx-horeca/ai/` (in the source workspace only:
  `projects/ngx-horeca/ai/`)

## Package Guidance

After reading this file, load the package guidance from:

```text
node_modules/@wawjs/ngx-horeca/ai/
```

The package is scoped. Use `node_modules/@wawjs/ngx-horeca`, not
`node_modules/wawjs/ngx-horeca`.

In the source workspace only, read and edit `projects/ngx-horeca/ai/` instead; the `node_modules`
copy is the last published version.

Start with `node_modules/@wawjs/ngx-horeca/ai/onboarding.md`, then open only the guides needed for
the task:

- `node_modules/@wawjs/ngx-horeca/ai/architecture.md`
- `node_modules/@wawjs/ngx-horeca/ai/code-style.md`
- `node_modules/@wawjs/ngx-horeca/ai/content-pages.md`
- `node_modules/@wawjs/ngx-horeca/ai/seo.md`
- `node_modules/@wawjs/ngx-horeca/ai/media.md`
- `node_modules/@wawjs/ngx-horeca/ai/tooling.md`
- `node_modules/@wawjs/ngx-horeca/ai/task-execution.md`
- `node_modules/@wawjs/ngx-horeca/ai/decisions/index.md`

Read the decisions index when a task changes a long-lived convention, resolves an ambiguity likely
to recur, or affects package-facing behavior.

## Companion `@wawjs/*` Package Guidance

Installed `@wawjs/*` packages, except the local HoReCa package, may provide a package-level `AI.md`
file at:

```text
node_modules/@wawjs/<package>/AI.md
```

Before adding or changing code that uses one of these companion packages, read that package's
`AI.md` first. This is especially important when there is no local sample code, or the nearest
sample does not cover the required behavior.

Current companion package guides include:

- `node_modules/@wawjs/ngx-core/AI.md`
- `node_modules/@wawjs/ngx-http/AI.md`
- `node_modules/@wawjs/ngx-translate/AI.md`
- `node_modules/@wawjs/ngx-ui/AI.md`

For example, before introducing `HttpService` usage without a matching local pattern, read
`node_modules/@wawjs/ngx-http/AI.md`.

## Universal Rules

- Treat this repo as a marketing website first, not as a complex application shell.
- Prefer simple, static, content-first pages over heavy abstractions.
- Preserve prerender compatibility by default.
- Keep changes small, clear, and easy to review.
- Prefer Tailwind for layout, spacing, typography, sizing, responsive behavior, and utility styling.
- Use local page content/config over new services unless reuse is real and repeated.
- Do not introduce CMS, API fetching, dashboards, or heavy state management unless explicitly
  requested.
- Do not edit files inside `node_modules/@wawjs/ngx-horeca`; update the package source in
  `projects/ngx-horeca/` (source workspace); publishing and version bumps are the developer's job.

## Default Technical Stance

Use these as defaults unless the local code or the task gives a concrete reason to do otherwise:

- Angular 22 modern patterns only.
- Standalone components are the default. Do not add NgModules for new work.
- Do not add `standalone: true`; standalone is the default in Angular 22.
- Use `@Service()` for root-provided services. Keep `@Injectable()` for cases that need deeper DI
  configuration.
- Do not set `changeDetection` explicitly; `OnPush` is the default in Angular 22. Use
  `ChangeDetectionStrategy.Eager` only when eager change detection is genuinely required.
- Use signals for local UI state and derived state.
- Use Angular Signal Forms (`@angular/forms/signals`) for all form work; do not add Reactive or template-driven forms.
- Prefer `httpResource()` or `@wawjs/ngx-http` `ngxHttpResource()` for new signal-based HTTP reads;
  guard resource `value()` reads with `hasValue()`.
- Prefer `resource()` or `@wawjs/ngx-core` `ngxResource()` for new non-HTTP async signal reads.
- Prefer native control flow (`@if`, `@for`, `@switch`) in templates.
- Use Angular 22 template spread and short arrow functions only for simple local UI glue.
- Use Angular bindings instead of manual DOM work.
- Use `NgOptimizedImage` for static images when feasible.
- Keep browser-only code guarded so prerender remains safe.

## Build And Validation

- `npm run build`: production prerender build plus `tools/seo/generate-static-seo.mjs`.
- `node scripts/validate-i18n-arrays.mjs`: checks that `src/i18n` and `src/data/*/i18n` JSON files
  are arrays with the same length as `ua.json`.
- `node scripts/check-ua-source-strings.mjs`: flags possible non-Ukrainian (Latin) source strings in
  translate bindings and data JSON.
- `npm run i18n:check`: runs both i18n scripts.
- `npm run rules`: deploys `firestore.rules` and `firestore.indexes.json` (only when asked).
- Run the scripts from the repo root. There are no tests.

## Firebase (Sign-In, Cart Orders, Form Requests, Admin)

The developer asked for these features, so they are the exception to the "no API/state" rule above.
Keep them inside these boundaries:

- The template has its own Firebase project (`ngx-horeca`). The public web config and the `admins` list live in
  `src/environments/environment.prod.ts`; `.firebaserc` names the project.
- Browser-only: `src/app/feature/firebase/` loads the SDK with dynamic imports and every entry point
  is guarded with `isPlatformBrowser`. Nothing Firebase runs during prerender, and the SDK is never
  loaded at startup for every visitor (only on sign-in hover/focus, on the cart page, on submit, or for
  a guest who signed in before).
- Pages that use Firebase (`/cart`, `/orders`, `/admin`) are `RenderMode.Client` in
  `src/app/app.routes.server.ts` and set `robots: 'noindex, nofollow'`, so they are neither
  prerendered nor in the sitemap. `.github/deploy.yml` copies `index.csr.html` to their folders for
  GitHub Pages. Add new Firebase pages the same way.
- Firestore rules and indexes are in the repo (`firestore.rules`, `firestore.indexes.json`,
  `firebase.json`). Deploy them with `npm run rules` (`firebase deploy --only firestore`). When a
  collection's fields change, change the service in `src/app/feature/firebase/` and the rules
  together.
- The admin list in `environment.prod.ts` must match `isAdmin()` in `firestore.rules`. The app list
  only decides what is shown; the rules are the real protection.
- Org sites built from this template share the `ngx-horeca` Firebase project unless an org branch
  overrides `environment.prod.ts` with its own project. Every order and request is saved with `site`
  (the host of `siteUrl`, `src/app/feature/firebase/site.ts`), and the admin page lists only the
  current site's documents.
- Collections: `orders` (cart checkout, signed-in guests) and `requests` (booking, room and contact
  forms; anonymous create allowed). The forms still send to Telegram through `ContactService`; a
  Firestore failure never blocks the Telegram request.

## Template Bootstrap Reminder

This repo is a template. When a user asks to "change SEO", "rebrand the site", "prepare the
template", or similar, do not stop at route meta only. At minimum, inspect these surfaces and
update the ones that still contain template values:

- `src/data/company/company.json` for company name, contacts, `siteUrl`, logo, currency, and
  `defaultSeo`
- `src/app/app.config.ts` for global metadata defaults that consume company data
- `src/app/app.routes.ts` for per-page `data.meta` overrides
- `src/index.html` for seed title/meta/canonical/social tags
- `src/assets/` for brand assets such as `logo.webp` and `favicon.webp`
- root `CNAME` for the production domain (absent in the template; created at bootstrap)
- `src/environments/environment.prod.ts` for `companyId` (template value `'demo'`) and other public
  runtime defaults

Also check visible content so headings, hero copy, contacts, and CTA text stay aligned with the SEO
metadata.

## Asset Paths

- Do not assume Angular assets are served from `/assets`.
- Treat `src/assets` as a source folder, not a runtime URL.
- Check `angular.json` before answering questions or editing templates that reference static files.
- In this repo, files from `src/assets` are published from the site root, so `src/assets/logo.webp`
  is referenced as `/logo.webp` or `logo.webp`, not `assets/logo.webp`.
- Fonts are self-hosted under `/fonts/`: Material Symbols from `src/assets/fonts/`, and Inter from the
  `@fontsource-variable/inter` package (copied by an `angular.json` asset entry, declared in
  `src/styles.scss`, preloaded in `src/index.html`). Do not add Google Fonts links.

## Internal Links

Non-root URLs end with `/` (`/menu/`), the same as canonical URLs and the sitemap, because static
hosts redirect `/menu` to `/menu/`. `TrailingSlashUrlSerializer` (`src/app/services/trailing-slash.ts`)
does this for `routerLink`; a hand-built internal `href` goes through `withTrailingSlash()`.

## Import Rules

- Import reusable HoReCa APIs from `@wawjs/ngx-horeca`.
- Do not import package internals from app code.
- Keep pages, layouts, route definitions, prerender route lists, local data, company defaults,
  content data imports, and static assets app-owned under `src/`.

## Loading Order

1. `AGENTS.md`
2. `node_modules/@wawjs/ngx-horeca/ai/onboarding.md`
3. One or two relevant package `ai` guides for the task
4. Relevant companion `node_modules/@wawjs/<package>/AI.md` files before using those package APIs
5. `node_modules/@wawjs/ngx-horeca/ai/decisions/index.md` only if the task may affect durable policy
