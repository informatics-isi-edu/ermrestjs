(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.markdownitSpan = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

'use strict';

// same as UNESCAPE_MD_RE plus a space
var UNESCAPE_RE = /\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;


function renderSpan(state, silent) {
  var found,
      content,
      token,
      max = state.posMax,
      start = state.pos;

  if (silent) { return false; } // don't run any pairs in validation mode
  if (start + 13 >= max) { return false; }

  // check the start
  if (
      state.src.charCodeAt(start) !== 0x3A /* : */ ||
      state.src.charCodeAt(start + 1) !== 0x73/* s */ ||
      state.src.charCodeAt(start + 2) !== 0x70/* p */ ||
      state.src.charCodeAt(start + 3) !== 0x61/* a */ ||
      state.src.charCodeAt(start + 4) !== 0x6E/* n */ ||
      state.src.charCodeAt(start + 5) !== 0x3A /* : */
  ) {
      return false;
  }

  state.pos = start + 6;

  //find the end
  while (state.pos < max) {
    if (
        state.src.charCodeAt(state.pos) === 0x3A /* : */ &&
        state.src.charCodeAt(state.pos + 1) === 0x2F/* / */ &&
        state.src.charCodeAt(state.pos + 2) === 0x73/* s */ &&
        state.src.charCodeAt(state.pos + 3) === 0x70/* p */ &&
        state.src.charCodeAt(state.pos + 4) === 0x61/* a */ &&
        state.src.charCodeAt(state.pos + 5) === 0x6E/* n */ &&
        state.src.charCodeAt(state.pos + 6) === 0x3A /* : */
    ) {
      found = true;
      break;
    }

    state.md.inline.skipToken(state);
  }

  if (!found || start + 1 === state.pos) {
    state.pos = start;
    return false;
  }

  content = state.src.slice(start + 6, state.pos);

  // don't allow unescaped newlines inside (space is allowed)
  if (content.match(/(^|[^\\])(\\\\)*[\n]/)) {
    state.pos = start;
    return false;
  }

  // found!
  state.posMax = state.pos;
  state.pos = start + 6;

  // Earlier we checked !silent, but this implementation does not need it
  token         = state.push('span_open', 'span', 1);
  token.markup  = ':span:';

  token         = state.push('text', '', 0);
  token.content = content.replace(UNESCAPE_RE, '$1');

  token         = state.push('span_close', 'span', -1);
  token.markup  = ':\\span:';

  state.pos = state.posMax + 7;
  state.posMax = max;
  return true;
}


module.exports = function sub_plugin(md) {
  md.inline.ruler.after('emphasis', 'span', renderSpan);
};

},{}]},{},[1])(1)
});
