# Developer Guide

## Commit message conventions

We're using [semantic-release](https://github.com/semantic-release/semantic-release) for managing releases. So you must ensure your commit messages follow [the Angular's commit message format](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md):

1. Complete form:

```
<type>(<scope>): <short summary>

<description>
```


2. Minimal:

```
<type>: <short summary>
```

The Valid `type`s are (some might not apply to this repo):

- `feat`: new feature (minor version bump)
- `fix`: bug fix (patch version bump)
- `docs`: documentation changes
- `chore`: maintenance tasks
- `refactor`: code refactoring
- `test`: adding tests
- `style`: formatting changes
- `perf`: performance improvements
- `ci`: CI/CD changes


And for `scope` (this list is subject to change):

- `deps` and `deps-dev`: dependencies
- `build`: Build configiration (e.g., vite, tsconfig)
- `types`: Typescript definitions
- `hatrac`
- `export`
- `facet`

Examples of commit messages:


```
docs: update installation guide
```
```
test: change how user authentication work
```
```
feat(facet): add support for grouped facets
```
```
fix(hatrac): ensure filename is properly used

Fixes #124
```