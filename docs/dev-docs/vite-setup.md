# Vite setup

This doc will go over the steps that I went through to add vite.

https://dev.to/vinomanick/create-a-typescript-utility-library-using-vite-916

1. `npm create vite@latest ./ --template vanilla-ts`

2. Then just changed the package.json so it's a mix and removed public folder

3. commands:

```
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

4. npm install -D prettier

5. npm create @eslint/config@latest

6. npm add -D eslint-config-prettier eslint-plugin-prettier
7.

```
  npm pkg set scripts.lint="eslint src"
  npm pkg set scripts.format="prettier --write src"
```

8.

```
npm add -D @commitlint/cli @commitlint/config-conventional
echo -e "export default { extends: ['@commitlint/config-conventional'] };" > commitlint.config.mjs
npm add -D husky lint-staged
npm exec husky init
echo "npm lint-staged" > .husky/pre-commit
echo "npx --no -- commitlint --edit \${1}" > .husky/commit-msg
```

9. npm add -D @types/node

10. create vite.config.ts

--

11. for commit: npx git-cz --disable-emoji

12. for fixing lint or prettier issues:

```
eslint --fix --quiet
prettier --write --ignore-unknown
```
