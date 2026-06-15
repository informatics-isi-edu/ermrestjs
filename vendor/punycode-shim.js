/* Empty browser shim for the deprecated Node `punycode` builtin.
   markdown-it only calls punycode.toASCII/toUnicode inside try/catch for
   hostname normalization, so an empty object degrades gracefully (ASCII
   URLs are unaffected). Bundling this avoids the "externalized for browser
   compatibility" warning without pulling in a real polyfill. */
export default {};
