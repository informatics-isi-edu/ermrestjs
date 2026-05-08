# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
make deps               # Install production npm dependencies (npm ci)
make deps-test          # Install all dependencies including dev/test
make dist               # Full build: deps install + vite build
make dist-wo-deps       # Vite build only, skips deps install (use during active development)
make lint               # ESLint (errors only)
make lint-w-warn        # ESLint (errors + warnings)
make deploy             # rsync build output to /var/www/html/ermrestjs/
make clean              # Remove build artifacts
make distclean          # Remove build artifacts + node_modules
```

Avoid `npm install` directly unless directed to run it. Use `make deps` or `make deps-test` for installing dependencies.

## Running Tests

Tests use Jasmine (unit tests, Node-based, no browser required). They require a built dist (`make dist-w-deps`) and a running ERMrest backend.

```bash
make test               # Run all unit tests via jasmine-runner.js
make test-single        # Run a single test via single-test-runner.js
```

To run a single spec, copy `test/support/single.spec.js.sample` to `test/support/single.spec.js` and edit it to point at the desired test cases and schema configs. `single.spec.js` is gitignored.

Test specs live in `test/specs/` organized by domain (e.g., `reference/`, `faceting/`, `column/`, `annotation/`).

## Architecture

ERMrestJS is a **TypeScript client library** for ERMrest — a backend relational data service over PostgreSQL. It handles schema introspection, query building, data manipulation, and annotation parsing. Consumed by Chaise and other ISI frontends.

### Source Layout

| Path | Purpose |
|---|---|
| `src/models/` | Core domain models (Reference, Column, Tuple, Page, errors, etc.) |
| `src/models/reference/` | Central `Reference` class and related types (citation, contextualize, pagination, aggregates) |
| `src/models/reference-column/` | Column representation and display logic |
| `src/services/` | Singletons: HTTP client (`http.ts`), auth (`authn.ts`), catalog, config, handlebars/mustache templating |
| `src/utils/` | Stateless helpers: markdown, templates, column/reference/type/value utilities |
| `src/index.ts` | Public entry point |
| `js/` | Legacy JS (pre-TS migration artifacts) |
| `dist/` | Build output (`ermrest.js`, `ermrest.min.js`) |

### Key Concepts

- **Reference**: Central abstraction representing a filtered/contextualized view of an ERMrest table. Most UI operations go through `Reference`.
- **Tuple**: A single row result with display-ready values.
- **Page**: Paginated result set from a `Reference` read.
- **Contextualization**: References are contextualized (e.g., `compact`, `detailed`, `entry`) to control which columns and annotations apply.
- **Annotations**: ERMrest schema annotations drive display behavior; parsed in `models/` and `services/catalog.ts`.

### Build

Uses Vite (`vite.config.mts`) + TypeScript (`tsconfig.json`). Outputs:
- `dist/ermrest.js` — CJS/UMD for direct browser use
- `dist/ermrest.min.js` — ESM module build

## Code Conventions

- **Filenames**: kebab-case
- **Types/Classes/Enums**: PascalCase
- **Functions/variables**: camelCase; `_` prefix for private
- **Path alias**: use `@isrd-isi-edu/ermrestjs/*` (maps to repo root):
  ```ts
  import { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';
  ```
- **Formatting**: Prettier (enforced via ESLint plugin). Single quotes, 2-space indent.
- Avoid `any` types (`@typescript-eslint/no-explicit-any` is a warning)
- Use `===` (eqeqeq enforced)
- `strict: true` TypeScript

## Commit Messages

Uses semantic-release with conventional commits:

```
<type>(<scope>): <subject>
```

Types that trigger releases: `feat` (minor), `fix` / `perf` / `refactor` (patch).
Types that don't: `docs`, `chore`, `test`, `ci`.

Common scopes: `reference`, `column`, `annotation`, `facet`, `export`, `authn`, `http`, `handlebars`, `markdown`, `deps`, `build`.
