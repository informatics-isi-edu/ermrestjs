# Developer Guide

## Commit message conventions

We're using [semantic-release](https://github.com/semantic-release/semantic-release) for managing releases. So you must ensure your commit messages follow [the conventional commits' message format](https://www.conventionalcommits.org/en/v1.0.0/#summary):

1. Complete form:

```
<type>(<optional scope>): <subject>

<optional body>

<optional footer(s)>
```


2. Minimal:

```
<type>: <subject>
```

The Valid `type`s are:

- The ones that bump the version:
  - `feat`: new feature (minor version bump)
  - `fix`: bug fix, depedency update, or improvement to a process (patch version bump)
  - `perf`: performance improvements (patch version bump)
  - `refactor`: code refactoring (patch version bump)

- Other types that will not be associated with a release:

  - `docs`: documentation changes
  - `chore`: maintenance tasks
  - `test`: adding tests
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
```
fit(hatrac): support pausing and resuming upload

This commit will introduce APIs to pause and resume the upload.

BREAKING CHANGE: Upload.start arguments have been rearranged.
It used to be 
    start(startChunkIdx, onProgress)
But now is
    start(startChunkIdx, onResume, onProgress)
```