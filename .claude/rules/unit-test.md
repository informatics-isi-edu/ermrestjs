---
paths:
  - "test/**"
---

@../../docs/dev-docs/unit-test.md

## Notes for Claude

Unit tests require a running ERMrest backend (`ERMREST_URL`, `AUTH_COOKIE`, `RESTRICTED_AUTH_COOKIE` env vars) and import schemas into a real catalog. Do not run `make test` or `make test-single` without explicit user approval — they make external HTTP calls and mutate catalog state.