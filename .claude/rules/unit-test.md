---
paths:
  - "test/**"
---

@../../docs/dev-docs/unit-test.md

## Notes for Claude

Unit tests require a running ERMrest backend (`ERMREST_URL`, `AUTH_COOKIE`, `RESTRICTED_AUTH_COOKIE` env vars) and import schemas into a real catalog. Do not run `make test` or `make test-single` without explicit user approval — they make external HTTP calls and mutate catalog state.

### Test descriptions

Keep `describe()` and `it()` descriptions short so the run logs stay easy to scan. Describe the action or
the expectation in a few words; don't restate the assertion or explain the "why" (put rationale in a code
comment if needed).

```javascript
it('folds the condition source onto the display', function () { ... });   // ✅ concise
it('should put the entity_set_i8 display in main requests with a condition object so it is read once instead of twice', function () { ... });  // ❌ too long
```