# Repository Guidelines

## General Instructions

- ALWAYS run `bun run lint` after making changes => fix any linting errors you get
- ALWAYS check for type errors via `bun tsc --noEmit`
- ALWAYS run `bun run format` AFTER you're done with your task and you edited all files that needed editing
- ALWAYS run unit tests via `bun run test:unit`
- ALWAYS run e2e tests via `bun run test:e2e`

## Project Structure & Module Organization

This is a Bun-powered Next.js App Router project. Application code lives in `app/`, with route files such as `app/page.tsx`, grouped route shells under `app/(public)`, `app/(authenticated)`, and `app/(shared)`, plus global styling in `app/globals.css`. Static app assets currently include `app/favicon.ico`. Project configuration is at the repository root: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, and `package.json`. `SPEC.MD` is the product and architecture source of truth. Generated output such as `.next/` should not be edited manually.

## Build, Test, and Development Commands

- `bun run dev`: start the Next.js development server.
- `bun run build`: create a production build and run type/page compilation checks.
- `bun run start`: serve the production build after `bun run build`.
- `bun run lint`: run `oxlint` across the codebase.
- `bun run format`: run `oxfmt` formatting.

Use Bun for dependency and script execution. The lockfile is `bun.lock`.

## Coding Style & Naming Conventions

Write TypeScript and React Server Components by default unless client-side interactivity is required. Keep route components named with PascalCase exports, for example `LoginPage` or `NotesLayout`. Follow App Router file conventions: `page.tsx`, `layout.tsx`, `not-found.tsx`, and dynamic folders like `[id]`. Prefer concise Tailwind utility classes and keep shared theme tokens in `app/globals.css`. Run `bun run lint` before handing off changes; run `bun run format` when making broader formatting edits.

## Commit & Pull Request Guidelines

Existing commits use short, imperative summaries such as `Update TinyNotes theme and root page shell`. Keep commits focused and describe the user-visible change. Pull requests should include a brief summary, verification commands run, linked issues when applicable, and screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit secrets, local databases, or generated build output. Future environment values described in `SPEC.MD`, such as `DB_PATH`, `AUTH_SECRET`, and `APP_URL`, should live in local environment files rather than source-controlled files.
