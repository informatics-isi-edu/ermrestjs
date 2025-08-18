import markdownit from 'markdown-it';

// services
import $log from '@isrd-isi-edu/ermrestjs/src/services/logger';

// utils
import { _classNames } from '@isrd-isi-edu/ermrestjs/src/utils/constants';

// vendor
import markdownItSub from '@isrd-isi-edu/ermrestjs/vendor/markdown-it-sub.min';
import markdownItSup from '@isrd-isi-edu/ermrestjs/vendor/markdown-it-sup.min';
import markdownItSpan from '@isrd-isi-edu/ermrestjs/vendor/markdown-it-span';
import markdownItEscape from '@isrd-isi-edu/ermrestjs/vendor/markdown-it-escape';
import markdownItAttrs from '@isrd-isi-edu/ermrestjs/vendor/markdown-it-attrs';
import MarkdownItContainer from '@isrd-isi-edu/ermrestjs/vendor/markdown-it-container.min';

let _markdownItDefaultImageRenderer: any = null;
export const MarkdownIt = markdownit({ typographer: true, breaks: true })
  .use(markdownItSub)
  .use(markdownItSup)
  .use(markdownItSpan)
  .use(markdownItEscape)
  .use(markdownItAttrs);

_bindCustomMarkdownTags(MarkdownIt);

/**
 * returns the rendered markdown content
 * @param value the markdown value
 * @param inline whether we should parse this as as inline element or not
 * @param throwError if true, it will throw the error instead of swalloing it
 */
export function renderMarkdown(value: string, inline?: boolean, throwError?: boolean) {
  try {
    if (inline) {
      return MarkdownIt.renderInline(value);
    }
    return MarkdownIt.render(value);
  } catch (e) {
    if (throwError) {
      throw e;
    }

    $log.error(`Couldn't parse the given markdown value: ${value}`);
    $log.error(e);
    return value;
  }
}

/**
 * @function
 * @private
 * @param {Object} md The markdown-it object
 * @param {Object} md The markdown-it-container object.
 * @desc Sets functionality for custom markdown tags like `iframe` and `dropdown` using `markdown-it-container` plugin.
 * The functions that are required for each custom tag are
 * - validate: to match a given token with the new rule that we are adding.
 * - render: the render rule for the token. This function will be called
 * for opening and closing block tokens that match. The function should be written
 * in a way to handle just the current token and its values. It should not try
 * to modify the whole parse process. Doing so will grant the correct behavior
 * from the markdown-it. If we don't follow this rule while writing the render
 * function, we might lose extra features (recursive blocks, etc.) that the parser
 * can handle. For instance the `iframe` tag is written in a way that you have
 * to follow the given syntax. You cannot have any other tags in iframe and
 * we're not supporting recursive iframe tags. the render function is only
 * handling an iframe with the given syntax. Nothing extra.
 * But we tried to write the `div` tag in a way that you can have
 * hierarichy of `div`s. If you look at its implementation, it has two simple rules.
 * One for the opening tag and the other for the closing.
 *
 */
function _bindCustomMarkdownTags(md: typeof MarkdownIt) {
  // Set typography to enable breaks on "\n"
  md.set({ typographer: true });

  // Dependent on 'markdown-it-container' and 'markdown-it-attrs' plugins
  // Injects `iframe` tag
  md.use(MarkdownItContainer, 'iframe', {
    /*
     * Checks whether string matches format "::: iframe [CAPTION](LINK){ATTR=VALUE .CLASSNAME}"
     * String inside '{}' is Optional, specifies attributes to be applied to prev element
     */
    validate: function (params: any) {
      return params.trim().match(/^iframe\s+(.*)$/i);
    },

    render: function (tokens: any, idx: any) {
      // Get token string after regexp matching to determine actual internal markdown
      const m = tokens[idx].info.trim().match(/^iframe\s+(.*)$/i);

      // If this is the opening tag i.e. starts with "::: iframe "
      if (tokens[idx].nesting === 1 && m.length > 0) {
        // Extract remaining string before closing tag and get its parsed markdown attributes
        const attrs = md.parseInline(m[1], {});
        let html = '';

        if (attrs && attrs.length == 1 && attrs[0].children) {
          // Check If the markdown is a link
          if (attrs[0].children[0].type == 'link_open') {
            const openingLink = attrs[0].children[0];
            let iframeHTML = '<iframe',
              captionLink,
              captionTarget = '',
              posTop = true,
              captionClass = '',
              captionStyle = '',
              figureClass = '',
              figureStyle = '',
              iframeSrc = '',
              frameWidth = '',
              fullscreenTarget = '',
              videoText = '',
              isYTlink = false;

            const widthStyles: Array<string> = [],
              iframeClasses: Array<string> = [];

            // Add all attributes to the iframe
            openingLink!.attrs!.forEach(function (attr) {
              switch (attr[0]) {
                case 'href':
                  // eslint-disable-next-line no-useless-escape
                  isYTlink = attr[1].match('^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+') != null;
                  iframeSrc = attr[1];
                  iframeHTML += ' src="' + attr[1] + '"';
                  videoText = 'Note: YouTube video ( ' + attr[1] + ' ) is hidden in print';
                  break;
                case 'link': // NOTE: link will be deprecated but leaving in conditional for backwards compatibility
                case 'caption-link':
                  captionLink = attr[1];
                  break;
                case 'pos':
                  posTop = attr[1].toLowerCase() == 'bottom' ? false : true;
                  break;
                case 'fullscreen-target':
                  fullscreenTarget = attr[1];
                  break;
                case 'target':
                case 'caption-target':
                  captionTarget = attr[1];
                  break;
                case 'caption-class':
                  captionClass = attr[1];
                  break;
                case 'caption-style':
                  captionStyle = attr[1];
                  break;
                case 'iframe-class': // NOTE: iframe-class will be deprecated but leaving in conditional for backwards compatibility
                case 'figure-class':
                  figureClass = attr[1];
                  break;
                case 'iframe-style': // NOTE: iframe-style will be deprecated but leaving in conditional for backwards compatibility
                case 'figure-style':
                  figureStyle = attr[1];
                  break;
                case 'class':
                  if (attr[1].length > 0) {
                    iframeClasses.push(attr[1]);
                    // NOTE: we return here to avoid adding `" "` to iframeHTML?
                    return; //we're going to add classes at the end
                  }
                  break;
                default: {
                  if (attr[0] == 'width') {
                    frameWidth = attr[1];
                  }

                  let endStyleIdx, subStrStyle;
                  // handles `style="some: style;"` case from template
                  // min/max width needs to be applied to the wrapper of the caption and fullscreen button for consistent button placement
                  // check for min-width style
                  const minWidthIdx = attr[1].indexOf('min-width');
                  if (minWidthIdx !== -1) {
                    endStyleIdx = attr[1].indexOf(';', minWidthIdx);
                    // get the min-width `key: value` pair
                    if (endStyleIdx !== -1) {
                      subStrStyle = attr[1].substring(minWidthIdx, endStyleIdx);
                    } else {
                      // if no `;` after min-width, assume end of string
                      subStrStyle = attr[1].substring(minWidthIdx);
                    }
                    widthStyles.push(subStrStyle);
                  }

                  // check for max-width style
                  const maxWidthIdx = attr[1].indexOf('max-width');
                  if (maxWidthIdx != -1) {
                    endStyleIdx = attr[1].indexOf(';', maxWidthIdx);
                    // get the max-width `key: value` pair
                    if (endStyleIdx != -1) {
                      subStrStyle = attr[1].substring(maxWidthIdx, endStyleIdx);
                    } else {
                      // if no `;` after max-width, assume end of string
                      subStrStyle = attr[1].substring(maxWidthIdx);
                    }
                    widthStyles.push(subStrStyle);
                  }

                  iframeHTML += ' ' + attr[0] + '="' + attr[1] + '"';
                  break;
                }
              }
            });

            //During print we need to display that the iframe with YouTube video is replaced with a note
            if (isYTlink) {
              /*
               * NOTE: we're using display:none because visibility:hidden had aligment issues.
               * With visibility hidden eventhough the element is invisibile, it will still take up space,
               * and will add extra unnecessary space between the iframe and fullscreen button.
               */
              html = '<span class="' + _classNames.showInPrintMode + '" style="display:none;">' + videoText + '</span>';
              iframeClasses.push(_classNames.hideInPrintMode);
            }

            // add the iframe tag
            html += iframeHTML;

            // attach the iframe tag classes
            if (iframeClasses.length > 0) {
              html += ' class="' + iframeClasses.join(' ') + '"';
            }
            html += '></iframe>';

            let captionHTML = '';

            // If the next attribute is not a closing link then iterate
            // over all the children until link_close is encountered rednering their markdown
            if (attrs[0].children[1].type != 'link_close') {
              for (let i = 1; i < attrs[0].children.length; i++) {
                // If there is a caption then add it as a "div" with "caption" class
                if (attrs[0].children[i].type == 'text') {
                  captionHTML += md.renderInline(attrs[0].children[i].content);
                } else if (attrs[0].children[i].type !== 'link_close') {
                  captionHTML += md.renderer.renderToken(attrs[0].children, i, {});
                } else {
                  break;
                }
              }
            }

            // If enlarge link is set then add an anchor tag for captionHTML
            if (captionLink) {
              // set the fullscreen target string for the fullscreen button
              if (captionTarget) captionTarget = ' target=' + captionTarget;
              if (!captionHTML.trim().length) captionHTML = 'Enlarge';
              captionHTML = '<a href="' + captionLink + '"' + captionTarget + '>' + captionHTML + '</a>';
            }

            // set the fullscreen target string for the fullscreen button
            if (fullscreenTarget) fullscreenTarget = ' target=' + fullscreenTarget;

            // Checks for a width being defined. If it's defined and not a number, assume it has `px` or `%` appended already and use as is.
            // If no width, default to "100%"
            let captionContainerWidth = '100%';
            if (frameWidth) {
              captionContainerWidth = frameWidth;
              // If width is defined and is a number, assume it's in pixels and append `px`.
              captionContainerWidth += isNaN(parseInt(frameWidth)) ? '' : 'px';
            }

            // add separator in case more styles are appended
            captionContainerWidth += ';';

            // if min/max width are defined for the iframe, apply to the captiona nd button container as well
            if (widthStyles.length > 0) {
              captionContainerWidth += widthStyles.join(';');
            }

            // captionContainerWidth should be "<width-value>; min-width: val; max-width: val"
            const contentsWidthStyle = 'style="width: ' + captionContainerWidth + '"';

            // fullscreen button html that is attached to the top right corner of the iframe
            const buttonHtml =
              '<div class="iframe-btn-container"><a class="chaise-btn chaise-btn-secondary chaise-btn-iframe" href="' +
              iframeSrc +
              '"' +
              fullscreenTarget +
              '><span class="chaise-btn-icon fullscreen-icon"></span><span>Full screen</span></a></div>';

            // Encapsulate the captionHTML inside a figcaption tag with class embed-caption
            if (posTop) {
              // if caption is at the top, we need to wrap the caption and fullscreen button in a div so the width can be applied and allow the caption to flex around the button
              html =
                '<div class="figcaption-wrapper" ' +
                contentsWidthStyle +
                '><figcaption class="embed-caption' +
                (captionClass.length ? ' ' + captionClass : '') +
                '"' +
                (captionStyle.length ? ' style="' + captionStyle + '"' : '') +
                '>' +
                captionHTML +
                '</figcaption>' +
                buttonHtml +
                '</div>' +
                html;
            } else {
              html =
                buttonHtml +
                html +
                '<figcaption class="embed-caption' +
                (captionClass.length ? ' ' + captionClass : '') +
                '"' +
                (captionStyle.length ? ' style="' + captionStyle + '"' : '') +
                '>' +
                captionHTML +
                '</figcaption>';
            }

            // Encapsulate the iframe inside a figure tag
            html =
              '<figure class="embed-block ' +
              _classNames.postLoad +
              (figureClass.length ? ' ' + figureClass : '') +
              '"' +
              (figureStyle.length ? ' style="' + figureStyle + '"' : '') +
              '>' +
              html +
              '</figure>';
          }
        }
        // if attrs was empty or it didn't find any link simply render the internal markdown
        if (html === '') {
          html = md.render(m[1]);
        }

        return html;
      } else {
        // closing tag
        return '';
      }
    },
  });

  // Dependent on 'markdown-it-container' and 'markdown-it-attrs' plugins
  // Injects `dropdwown` tag
  md.use(MarkdownItContainer, 'dropdown', {
    /*
     * Checks whether string matches format "::: dropdown DROPDOWN_TITLE{.btn-success} [CAPTION](LINK){ATTR=VALUE .CLASSNAME}"
     * String inside '{}' is Optional, specifies attributes to be applied to prev element
     */
    validate: function (params: any) {
      return params.trim().match(/^dropdown\s+(.*)$/i);
    },

    render: function (tokens: any, idx: any) {
      let html = '';
      // Get token string after regeexp matching to determine caption and other links
      const m = tokens[idx].info.trim().match(/^dropdown\s+(.*)$/i);

      if (tokens[idx].nesting === 1 && m && m.length > 0) {
        // If content found after dropdown string
        if (m && m.length > 0) {
          const linkTokens = md.parseInline(m[1], {});

          // If the linkTokens contains an inline tag
          // with children, and type is text for the first child
          if (
            linkTokens.length === 1 &&
            linkTokens[0].type === 'inline' &&
            linkTokens[0].children !== null &&
            linkTokens[0].children.length &&
            linkTokens[0].children[0].type === 'text'
          ) {
            const caption = linkTokens[0].children[0].content;
            const cTokens = md.parse(caption, {});

            // If caption is set for the dropdown button between
            if (
              cTokens.length === 3 &&
              cTokens[0].type === 'paragraph_open' &&
              cTokens[1].type === 'inline' &&
              cTokens[2].type === 'paragraph_close'
            ) {
              // Build button html and button dropdown html
              const classes: string[] = [];
              let classNotParsed;
              let buttonHtml = '<button type="button" ';
              let buttonDDHtml = '<button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" ';

              // If the caption has any attrs add them to the button
              if (cTokens[0].attrs) {
                cTokens[0].attrs.forEach(function (a) {
                  if (a[0] === 'class') {
                    classes.push(a[1]);
                  } else {
                    buttonHtml += a[0] + '="' + a[1] + '" ';
                  }
                });
              }

              const openBracketLastIndex = cTokens[1].content.lastIndexOf('{');
              // '{' index > -1, meaning it exists in the string
              // '}' index > '{' index, meaning it exists in the string in the right place (i.e. '{...}')
              if (openBracketLastIndex > -1 && cTokens[1].content.lastIndexOf('}') > openBracketLastIndex) {
                classNotParsed = cTokens[1].content.slice(0, openBracketLastIndex).trim();
              } else {
                classNotParsed = cTokens[1].content;
              }

              buttonHtml += ' class="btn btn-primary ' + classes.join(' ') + '">' + classNotParsed + '</button>';
              buttonDDHtml +=
                ' class="btn btn-primary dropdown-toggle ' +
                classes.join(' ') +
                '"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button>';

              // Build unordered list
              const lists = [];
              let isValid = true;
              for (let i = 1; i < linkTokens[0].children.length; i = i + 3) {
                if (
                  linkTokens[0].children[i].type === 'link_open' &&
                  linkTokens[0].children[i + 1].type === 'text' &&
                  linkTokens[0].children[i + 2].type === 'link_close'
                ) {
                  const link = linkTokens[0].children[i];
                  let listHTML = '<li><a ';
                  for (let j = 0; j < link.attrs!.length; j++) {
                    listHTML += link.attrs![j][0] + '="' + link.attrs![j][1] + '" ';
                  }

                  listHTML += '>' + linkTokens[0].children[i + 1].content + '</a></li>';
                  lists.push(listHTML);
                  // If the next element in the list is of type text skip it
                  if (linkTokens[0].children[i + 3] && linkTokens[0].children[i + 3].type === 'text') {
                    i++;
                  }
                } else {
                  isValid = false;
                  break;
                }
              }

              if (isValid) {
                const ullistHTML = '<ul class="dropdown-menu">' + lists.join('') + '</ul>';
                html = '<div class="btn-group markdown-dropdown">' + buttonHtml + buttonDDHtml + ullistHTML + '</div>';
              }
            }
          }
        }
      }
      return html;
    },
  });

  // Dependent on 'markdown-it-container' and 'markdown-it-attrs' plugins
  // Injects `image` tag
  md.use(MarkdownItContainer, 'image', {
    /*
     * Checks whether string matches format ":::image [CAPTION](LINK){ATTR=VALUE .CLASSNAME}"
     * String inside '{}' is Optional, specifies attributes to be applied to prev element
     */
    validate: function (params: any) {
      return params.trim().match(/^image\s+(.*$)/i);
    },

    render: function (tokens: any, idx: any) {
      // Get token string after regeexp matching to determine actual internal markdown
      const m = tokens[idx].info.trim().match(/^image\s+(.*)$/i);

      // If this is the opening tag i.e. starts with "::: image "
      if (tokens[idx].nesting === 1 && m.length > 0) {
        // Extract remaining string before closing tag and get its parsed markdown attributes
        const attrs = md.parseInline(m[1], {});
        let html = '',
          figureClass = '',
          figureStyle = '';
        if (attrs && attrs.length == 1 && attrs[0].children) {
          // Check If the markdown is a link
          if (attrs[0].children[0].type == 'link_open') {
            let imageHTML = '<img ';
            const openingLink = attrs[0].children[0];
            let enlargeLink,
              posTop = true;

            // Add all attributes to the image
            openingLink.attrs!.forEach(function (attr) {
              switch (attr[0]) {
                case 'figure-style':
                  figureStyle = attr[1];
                  break;
                case 'figure-class':
                  figureClass = attr[1];
                  break;
                case 'href':
                  imageHTML += 'src="' + attr[1] + '" ';
                  break;
                case 'link':
                  enlargeLink = attr[1];
                  break;
                case 'pos':
                  posTop = attr[1].toLowerCase() == 'bottom' ? false : true;
                  break;
                default:
                  imageHTML += attr[0] + '="' + attr[1] + '" ';
              }
            });

            html += imageHTML + '/>';

            let captionHTML = '';

            // If the next attribute is not a closing link then iterate
            // over all the children until link_close is encountered rednering their markdown
            if (attrs[0].children[1].type != 'link_close') {
              for (let i = 1; i < attrs[0].children.length; i++) {
                // If there is a caption then add it as a "div" with "caption" class
                if (attrs[0].children[i].type == 'text') {
                  captionHTML += md.renderInline(attrs[0].children[i].content);
                } else if (attrs[0].children[i].type !== 'link_close') {
                  captionHTML += md.renderer.renderToken(attrs[0].children, i, {});
                } else {
                  break;
                }
              }
            }

            // Add caption html
            if (posTop) {
              html = '<figcaption class="embed-caption">' + captionHTML + '</figcaption>' + html;
            } else {
              html = html + '<figcaption class="embed-caption">' + captionHTML + '</figcaption>';
            }

            // If link is specified, then wrap the image and figcaption inside anchor tag
            if (enlargeLink) {
              html = '<a href="' + enlargeLink + '" target="_blank">' + html + '</a>';
            }

            // Encapsulate the iframe inside a paragraph tag
            html =
              '<figure class="embed-block ' +
              _classNames.postLoad +
              (figureClass.length ? ' ' + figureClass : '') +
              '" style="' +
              (figureStyle.length ? figureStyle : 'display:inline-block;') +
              '">' +
              html +
              '</figure>';
          }
        }

        // if attrs was empty or it didn't find any link simply render the internal markdown
        if (html === '') {
          html = md.render(m[1]);
        }

        return html;
      } else {
        // closing tag
        return '';
      }
    },
  });

  md.use(MarkdownItContainer, 'video', {
    /*
     * Checks whether string matches format ":::video (LINK){ATTR=VALUE .CLASSNAME}"
     * String inside '{}' is Optional, specifies attributes to be applied to prev element
     */
    validate: function (params: any) {
      return params.trim().match(/^video\s+(.*$)/i);
    },

    render: function (tokens: any, idx: any) {
      // Get token string after regeexp matching to determine actual internal markdown
      const m = tokens[idx].info.trim().match(/^video\s+(.*)$/i);

      // If this is the opening tag i.e. starts with "::: video "
      if (tokens[idx].nesting === 1 && m.length > 0) {
        // Extract remaining string before closing tag and get its parsed markdown attributes
        const attrs = md.parseInline(m[1], {});
        let html = '';

        if (attrs && attrs.length == 1 && attrs[0].children) {
          // Check If the markdown is a link
          if (attrs[0].children[0].type == 'link_open') {
            let videoClass = 'class="' + _classNames.postLoad + ' ' + _classNames.hideInPrintMode;
            const openingLink = attrs[0].children[0];
            let srcHTML = '',
              videoAttrs = '',
              flag = true,
              posTop = true;
            let videoText = '';
            let infoHTML = '';

            // Add all attributes to the video
            openingLink.attrs!.forEach(function (attr) {
              if (attr[0] == 'href') {
                if (attr[1] == '') {
                  flag = false;
                  return '';
                }
                videoText = 'Note: Video ' + '(' + attr[1] + ')' + ' is hidden in print ';
                srcHTML += '<source src="' + attr[1] + '" type="video/mp4">';
              } else if ((attr[0] == 'width' || attr[0] == 'height') && attr[1] !== '') {
                videoAttrs += attr[0] + '=' + attr[1] + ' ';
              } else if ((attr[0] == 'loop' || attr[0] == 'preload' || attr[0] == 'muted' || attr[0] == 'autoload') && attr[1] == '') {
                videoAttrs += attr[0] + ' ';
              } else if (attr[0] == 'class' && attr[1] !== '') {
                // class was defined above to begin with "class=" and a class name
                videoClass += ' ' + attr[1];
              } else if (attr[0] == 'pos' && attr[1] !== '') {
                posTop = attr[1].toLowerCase() == 'bottom' ? false : true;
              }
            });
            // add closing quote
            videoClass += '"' + ' ' + videoAttrs;
            /*
             * NOTE: we're using display:none because visibility:hidden had aligment issues.
             * With visibility hidden eventhough the element is invisibile, it will still take up space,
             * and will add extra unnecessary space between the iframe and fullscreen button.
             */
            infoHTML = '<span class="' + _classNames.showInPrintMode + '" style="display:none;">' + videoText + '</span>';

            let captionHTML = '';
            // If the next attribute is not a closing link then iterate
            // over all the children until link_close is encountered rednering their markdown
            if (attrs[0].children[1].type != 'link_close') {
              for (let i = 1; i < attrs[0].children.length; i++) {
                // If there is a caption then add it as a "div" with "caption" class
                if (attrs[0].children[i].type == 'text') {
                  captionHTML += md.renderInline(attrs[0].children[i].content);
                } else if (attrs[0].children[i].type !== 'link_close') {
                  captionHTML += md.renderer.renderToken(attrs[0].children, i, {});
                } else {
                  break;
                }
              }
            }

            const videoHTML = '<video controls ';
            if (captionHTML.trim().length && flag && posTop) {
              html +=
                '<figure><figcaption>' + captionHTML + '</figcaption>' + infoHTML + videoHTML + videoClass + '>' + srcHTML + '</video></figure>';
            } else if (captionHTML.trim().length && flag) {
              html +=
                '<figure>' + videoHTML + videoClass + '>' + srcHTML + '</video><figcaption>' + captionHTML + '</figcaption>' + infoHTML + '</figure>';
            } else if (flag) html += infoHTML + videoHTML + videoClass + '>' + srcHTML + '</video>';
            else return '';
          }
        }
        // if attrs was empty or it didn't find any link simply render the internal markdown
        if (html === '') {
          html = md.render(m[1]);
        }
        return html;
      } else {
        // closing tag
        return '';
      }
    },
  });

  md.use(MarkdownItContainer, 'div', {
    /*
     * Checks whether string matches format ":::div CONTENT \n:::"
     * string inside `{}` is optional, specifies attributes to be applied to element
     */
    validate: function (params: any) {
      return params.trim().match(/^div\s+(.*)$/i);
    },

    render: function (tokens: any, idx: any) {
      const m = tokens[idx].info.trim().match(/^div\s+(.*)$/i);

      // opening tag
      if (tokens[idx].nesting === 1) {
        // if the next tag is a paragraph, we can change the paragraph into a div
        const attrs = md.parse(m[1], {});
        if (attrs && attrs.length > 0 && attrs[0].type === 'paragraph_open') {
          const html = md.render(m[1]).trim();

          // this will remove the closing and opening p tag.
          return '<div' + html.slice(2, html.length - 4);
        }

        // otherwise just add the div tag
        return '<div>\n' + md.render(m[1]).trim();
      }
      // the closing tag
      else {
        return '</div>\n';
      }
    },
  });

  md.use(MarkdownItContainer, 'geneSequence', {
    validate: function (params: any) {
      return params.trim().match(/^geneSequence\s+(.*)$/i);
    },

    render: function (tokens: any, idx: any) {
      const m = tokens[idx].info.trim().match(/^geneSequence\s+(.*)$/i);
      let html = '';
      // opening tag
      if (tokens[idx].nesting === 1 && m.length > 0) {
        const attrs = md.parse(m[1], {});
        if (!attrs || attrs.length !== 3 || attrs[0].type !== 'paragraph_open' || attrs[1].type !== 'inline' || attrs[1].children!.length !== 1) {
          return html;
        }

        let containerAttributes = '';
        const containerClasses = ['chaise-gene-sequence'];

        // get the attributes of the container
        if (Array.isArray(attrs[0].attrs)) {
          attrs[0].attrs.forEach(function (attr) {
            switch (attr[0]) {
              case 'class':
                if (attr[1].length > 0 && containerClasses.indexOf(attr[1]) === -1) {
                  containerClasses.push(attr[1]);
                }
                break;
              default:
                containerAttributes += ' ' + attr[0] + '="' + attr[1] + '"';
                break;
            }
          });
        }

        // get the content
        let sequence = attrs[1].children![0].content,
          sequenceHTML = '';
        const inc = 10;
        while (sequence.length >= inc) {
          const chunk = sequence.slice(0, inc);
          sequenceHTML += '<span class="chaise-gene-sequence-chunk">' + chunk + '</span>';
          sequence = sequence.slice(inc);
        }
        sequenceHTML += '<span class="chaise-gene-sequence-chunk">' + sequence + '</span>';
        html += '<div class="' + containerClasses.join(' ') + '" ' + containerAttributes + ' >';
        html += '<div class="chaise-gene-sequence-toolbar">';
        // html += '<div class="chaise-btn chaise-btn-tertiary chaise-btn-chaise-gene-sequence-copy-btn" data-chaise-tooltip="Copy the sequence to clipboard">Copy sequence</div>';
        html += '</div>';
        html += sequenceHTML;
        html += '</div>';
      }

      return html;
    },
  });

  // Note: Following how this was done in markdown-it-sub and markdown-it-span
  md.use(function rid_plugin(md) {
    // same as UNESCAPE_MD_RE plus a space
    // eslint-disable-next-line no-useless-escape
    const UNESCAPE_RE = /\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;

    // we want the link rule to take precedence over this added rule
    // [[rid]]() should be -> <a href="">[rid]</a> which preserves the inner brackets
    md.inline.ruler.after('link', 'rid', function rid(state, silent) {
      let found, token;

      const max = state.posMax,
        start = state.pos;

      if (silent) {
        return false;
      } // don't run any pairs in validation mode
      if (start + 4 >= max) {
        return false;
      } // this assumes the template is at least [[x]]
      // if (start + 5 >= max) { return false; } // string isn't long enough to be proper, this assumes RID has to be larger than 1 character

      // check the current and next character to make sure they are both `[`.
      // If not, iterate to the next character (state.pos)
      // 0x5B -> `[`
      if (state.src.charCodeAt(start) !== 0x5b || state.src.charCodeAt(start + 1) !== 0x5b) {
        return false;
      }

      // move to the first character after `[[`
      state.pos = start + 2;

      // find the end
      while (state.pos < max) {
        if (state.src.charCodeAt(state.pos) === 0x5d && state.src.charCodeAt(state.pos + 1) === 0x5d) {
          found = true;
          break;
        }

        state.md.inline.skipToken(state);
      }

      // NOTE: still not sure what the latter condition does
      if (!found || start + 1 === state.pos) {
        state.pos = start;
        return false;
      }

      // state.pos is the first end character. Slice the string to the char right before it
      const content = state.src.slice(start + 2, state.pos);

      // don't allow unescaped newlines inside (space is allowed)
      if (content.match(/(^|[^\\])(\\\\)*[\n]/)) {
        state.pos = start;
        return false;
      }

      // found!
      state.posMax = state.pos;
      state.pos = start + 2;

      // Earlier we checked !silent, but this implementation does not need it
      token = state.push('a_open', 'a', 1);
      token.attrPush(['href', '/id/' + content.replace(UNESCAPE_RE, '$1')]);
      token.markup = '[[';

      token = state.push('text', '', 0);
      token.content = content.replace(UNESCAPE_RE, '$1');

      token = state.push('a_close', 'a', -1);
      token.markup = ']]';

      state.pos = state.posMax + 2;
      state.posMax = max;
      return true;
    });
  });

  /**
   * Change the image function to add a specific classes to image tags
   * this is done on the image tag instead of link_open to prevent polluting other html tags
   * make sure we're calling this just once
   */
  if (_markdownItDefaultImageRenderer === null) {
    _markdownItDefaultImageRenderer =
      md.renderer.rules.image ||
      function (tokens: any, idx: any, options: any, env: any, self: any) {
        return self.renderToken(tokens, idx, options);
      };
  }

  // the class that we should add
  const className = _classNames.postLoad;
  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];

    const cIndex = token.attrIndex('class');
    if (cIndex < 0) {
      token.attrPush(['class', className]);
    } else {
      token.attrs![cIndex][1] += ' ' + className;
    }

    return _markdownItDefaultImageRenderer(tokens, idx, options, env, self);
  };
}
