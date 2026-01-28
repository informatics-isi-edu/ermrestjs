import type MarkdownIt from 'markdown-it';

/**
 * Custom div block plugin for markdown-it
 * Supports:
 * - Multi-line syntax with attributes: :::div {.class #id attr="value"}\nContent\n:::
 * - Nesting with colon counting: :::, ::::, :::::, etc.
 * - Single-line syntax: :::div content {.class}\n:::
 */

const MARKER_CHAR = 0x3a; // ':'
const MIN_MARKERS = 3;

// Store markdown-it instance for use in renderers
let mdInstance: any = null;

/**
 * Unwrap paragraph tags that contain only a single element, but only within div tags
 * This handles cases like <div><p><img></p></div> -> <div><img></div>
 */
function unwrapSingleElementParagraphsInDivs(html: string): string {
  // Pattern to match <div...>...</div> including nested divs
  const divPattern = /<div([^>]*)>([\s\S]*?)<\/div>/g;

  return html.replace(divPattern, (match, divAttrs, divContent) => {
    // Apply paragraph unwrapping only to content inside this div
    const unwrappedContent = unwrapParagraphsInContent(divContent);
    return `<div${divAttrs}>${unwrappedContent}</div>`;
  });
}

/**
 * Unwrap paragraph tags containing single elements from the given content
 */
function unwrapParagraphsInContent(content: string): string {
  const pTagPattern = /<p([^>]*)>(.*?)<\/p>/gs;

  return content.replace(pTagPattern, (match, _pAttrs, pContent) => {
    const trimmedContent = pContent.trim();

    // Check if content contains only a single HTML element (no surrounding text)
    const singleElementPattern = /^<([a-z][a-z0-9]*)\b[^>]*>.*?<\/\1>$|^<[a-z][a-z0-9]*\b[^>]*\/?>$/is;

    if (singleElementPattern.test(trimmedContent)) {
      const tagMatch = trimmedContent.match(/^<([a-z][a-z0-9]*)/i);
      if (tagMatch) {
        const tagName = tagMatch[1].toLowerCase();
        // Block-level elements and elements that shouldn't be wrapped in <p>
        const unwrapTags = ['img', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'table', 'figure', 'iframe', 'video'];

        if (unwrapTags.includes(tagName)) {
          return trimmedContent;
        }

        // For inline elements like <a>, only unwrap if it's the ONLY content
        if (tagName === 'a' || tagName === 'span') {
          return trimmedContent;
        }
      }
    }

    // Keep the <p> tag
    return match;
  });
}

/**
 * Parse the div block opening line to extract attributes
 */
function parseOpeningLine(line: string): { attrs: string; hasContent: boolean; content: string } {
  // Match: :::div or :::div {attrs} or :::div content {attrs}
  const match = line.trim().match(/^:+div\s*(.*)$/i);
  if (!match) {
    return { attrs: '', hasContent: false, content: '' };
  }

  const rest = match[1].trim();
  if (!rest) {
    return { attrs: '', hasContent: false, content: '' };
  }

  // Check if it's attributes-only pattern: {.class}, {#id}, {attr=value}, or combinations
  const isAttributesOnly = /^(\{[^}]*\}\s*)+$/.test(rest);

  if (isAttributesOnly) {
    // Multi-line syntax with attributes
    return { attrs: rest, hasContent: false, content: '' };
  } else {
    // Single-line syntax with content (and possibly attributes at the end)
    return { attrs: '', hasContent: true, content: rest };
  }
}

/**
 * Block rule for div containers
 */
function divBlock(state: any, startLine: number, endLine: number, silent: boolean): boolean {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];

  // Check for block quote or other indentation
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  // Check if line starts with enough colons
  let markerCount = 0;
  while (pos < max && state.src.charCodeAt(pos) === MARKER_CHAR) {
    markerCount++;
    pos++;
  }

  if (markerCount < MIN_MARKERS) {
    return false;
  }

  // Must be followed by 'div' (case insensitive)
  const restOfLine = state.src.slice(pos, max);
  if (!restOfLine.match(/^div(\s|$)/i)) {
    return false;
  }

  // If in validation mode, we're done
  if (silent) {
    return true;
  }

  // Parse the opening line
  const fullLine = state.src.slice(state.bMarks[startLine], max);
  const { attrs, hasContent, content } = parseOpeningLine(fullLine);

  // Find the closing marker
  let nextLine = startLine;
  let autoClose = false;

  for (;;) {
    nextLine++;
    if (nextLine >= endLine) {
      // Reached end without finding closing marker
      autoClose = true;
      break;
    }

    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.sCount[nextLine] < state.blkIndent) {
      // Non-empty line with negative indent should stop the block
      break;
    }

    // Check for closing marker with same number of colons
    let closeMarkerCount = 0;
    let checkPos = pos;
    while (checkPos < max && state.src.charCodeAt(checkPos) === MARKER_CHAR) {
      closeMarkerCount++;
      checkPos++;
    }

    // Closing marker must have exact same number of colons and nothing else (or whitespace)
    if (closeMarkerCount === markerCount) {
      const afterMarker = state.src.slice(checkPos, max).trim();
      if (afterMarker === '' || afterMarker === 'div') {
        // Found closing marker
        break;
      }
    }
  }

  const oldParent = state.parentType;
  const oldLineMax = state.lineMax;
  state.parentType = 'container';

  // Create opening token
  let token: any = state.push('div_open', 'div', 1);
  token.markup = ':'.repeat(markerCount);
  token.block = true;
  token.meta = { attrs, hasContent, content }; // Store in meta instead of info
  token.map = [startLine, nextLine];

  if (!hasContent) {
    // Multi-line syntax: parse content between markers
    const contentStart = startLine + 1;
    const contentEnd = nextLine;

    if (contentStart < contentEnd) {
      state.lineMax = contentEnd;
      state.md.block.tokenize(state, contentStart, contentEnd);
      state.lineMax = oldLineMax;
    }
  }
  // For single-line syntax (hasContent === true), we don't create any tokens
  // The content will be rendered directly in the div_open renderer

  // Create closing token
  token = state.push('div_close', 'div', -1);
  token.markup = ':'.repeat(markerCount);
  token.block = true;

  state.parentType = oldParent;
  state.line = nextLine + (autoClose ? 0 : 1);

  return true;
}

/**
 * Renderer for div_open token
 */
function renderDivOpen(tokens: any[], idx: number): string {
  const token = tokens[idx];

  // Get metadata from token
  const meta = token.meta || {};
  const { attrs = '', hasContent = false, content = '' } = meta;

  if (hasContent && content) {
    // Single-line syntax: render the content and extract attributes from the paragraph tag
    const html = mdInstance.render(content).trim();

    // html should be like '<p class="class">content</p>' or just '<p>content</p>'
    if (html.startsWith('<p') && html.endsWith('</p>')) {
      // Extract attributes from <p> tag and content
      const match = html.match(/^<p([^>]*)>(.*)<\/p>$/);
      if (match) {
        const extractedAttrs = match[1]; // attributes like ' class="class"'
        const extractedContent = match[2]; // the actual content

        // Return the div with attributes and content, and DON'T close it yet
        // (div_close will handle closing)
        return `<div${extractedAttrs}>${extractedContent}`;
      }
    }

    // Fallback: just render the content normally
    return '<div>' + html.replace(/^<p[^>]*>/, '').replace(/<\/p>$/, '');
  }

  // Multi-line syntax: check attrs for attributes
  if (attrs) {
    // Render a dummy content with the attributes to extract them
    const tempContent = 'x ' + attrs;
    const html = mdInstance.render(tempContent).trim();

    // html should be something like '<p class="class">x</p>' or '<p class="class" id="id">x</p>'
    if (html.startsWith('<p') && html.endsWith('</p>')) {
      const match = html.match(/^<p([^>]*)>.*<\/p>$/);
      if (match && match[1]) {
        return `<div${match[1]}>`;
      }
    }
  }

  return '<div>';
}

/**
 * Renderer for div_close token
 */
function renderDivClose(): string {
  return '</div>\n';
}

/**
 * Plugin registration function
 */
export function markdownDivBlock(md: MarkdownIt): void {
  // Store the markdown-it instance for use in renderers
  mdInstance = md;

  // Register the block rule before fence
  md.block.ruler.before('fence', 'div_block', divBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });

  // Register renderers
  md.renderer.rules.div_open = renderDivOpen;
  md.renderer.rules.div_close = renderDivClose;

  // Post-process rendered HTML to unwrap single-element paragraphs ONLY in divs
  const originalRender = md.render.bind(md);
  md.render = function (src: string, env?: any) {
    const html = originalRender(src, env);
    return unwrapSingleElementParagraphsInDivs(html);
  };

  const originalRenderInline = md.renderInline.bind(md);
  md.renderInline = function (src: string, env?: any) {
    const html = originalRenderInline(src, env);
    return unwrapSingleElementParagraphsInDivs(html);
  };
}
