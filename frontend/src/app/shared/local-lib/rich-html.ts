/**
 * Markup from the database, made safe to put on the page.
 *
 * The guide modals are stored as translations, which means they are markup a
 * person typed into an editor rather than markup this codebase wrote. That is
 * a trust boundary: whoever can edit content should not thereby be able to run
 * script in every visitor's browser, and neither should anything that reaches
 * the translations table by another route - an imported file, a hand-written
 * SQL statement, a restored backup.
 *
 * Angular's own sanitizer would do most of this, but it drops `style`
 * outright, and the HTML editor in the admin panel writes inline styles for
 * indentation and background colour. Content that silently loses its
 * formatting between the editor and the page is worse than useless to whoever
 * is writing it, so this allows a named list of properties instead - and
 * because the same function runs behind the editor's preview, what the preview
 * shows is exactly what the page will show.
 *
 * The policy is an allowlist throughout. Anything not named here does not
 * survive, which is the only kind of rule that stays correct as browsers grow
 * new features.
 */

/** Elements that may appear. Everything else is unwrapped or dropped. */
const ALLOWED_TAGS = new Set([
  'a', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'div', 'dl', 'dt', 'em',
  'figcaption', 'figure', 'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
  'img', 'li', 'ol', 'p', 'pre', 's', 'section', 'small', 'span', 'strike',
  'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
  'u', 'ul',
]);

/**
 * Elements removed with everything inside them.
 *
 * Everything else that is not allowed is unwrapped instead - its children are
 * kept - because an unknown wrapper is usually a paragraph somebody pasted,
 * and deleting the text with it would be a silent loss. These are the ones
 * whose contents are the danger.
 */
const DROP_ENTIRELY = new Set([
  'base', 'button', 'embed', 'form', 'frame', 'frameset', 'iframe', 'input',
  'link', 'math', 'meta', 'noscript', 'object', 'option', 'script', 'select',
  'style', 'svg', 'template', 'textarea', 'title',
]);

/** Attributes any element may carry. */
const GLOBAL_ATTRIBUTES = new Set(['class', 'dir', 'lang', 'style', 'title']);

/** And the ones that only make sense on particular elements. */
const TAG_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height', 'loading'],
  font: ['color', 'face', 'size'],
  ol: ['start', 'type'],
  td: ['colspan', 'rowspan', 'align', 'valign'],
  th: ['colspan', 'rowspan', 'align', 'valign', 'scope'],
  table: ['align', 'width'],
};

/**
 * CSS properties an inline style may set.
 *
 * Chosen to cover what the editor's toolbar produces - colour, size, family,
 * alignment, the indent - plus enough to lay a guide out. Nothing here can
 * load a resource or move an element out of its container.
 */
const ALLOWED_STYLES = new Set([
  'background-color', 'border', 'border-radius', 'color', 'font-family',
  'font-size', 'font-style', 'font-weight', 'line-height', 'margin',
  'margin-bottom', 'margin-left', 'margin-right', 'margin-top', 'padding',
  'padding-bottom', 'padding-left', 'padding-right', 'padding-top',
  'text-align', 'text-decoration', 'text-transform', 'vertical-align',
  'white-space', 'width',
]);

/**
 * A style value that could fetch something, escape the declaration, or name a
 * legacy scripting construct. Checked rather than parsed: the property list
 * above already excludes anything positional, so this is the second fence.
 */
const UNSAFE_VALUE = /url\s*\(|expression\s*\(|javascript:|@import|[<>{}\\]/i;

/** Schemes a link or an image may point at. Anything else, including data:. */
const SAFE_SCHEME = /^(?:https?:|mailto:|tel:)/i;

/**
 * Cleans markup for rendering.
 *
 * Returns markup, not a trusted type: the caller still decides where to put
 * it. An empty string comes back when there is nothing to render, and also
 * when there is no DOM to parse with - during server rendering, where markup
 * from the database has no business being assembled anyway.
 */
export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) {
    return '';
  }

  if (typeof DOMParser === 'undefined') {
    return '';
  }

  // An inert document: nothing here loads, and nothing here runs.
  const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;

  if (!root) {
    return '';
  }

  cleanChildren(root);
  return root.innerHTML;
}

/** Whether there is anything to show once the markup is stripped of tags. */
export function richHtmlIsEmpty(html: string | null | undefined): boolean {
  const clean = sanitizeRichHtml(html);
  if (!clean) {
    return true;
  }
  return !clean.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function cleanChildren(parent: Element): void {
  // A live list would shift underneath the loop as elements are removed and
  // unwrapped, so the children are taken once and worked through.
  for (const child of Array.from(parent.children)) {
    cleanElement(child);
  }
}

function cleanElement(element: Element): void {
  const tag = element.tagName.toLowerCase();

  if (DROP_ENTIRELY.has(tag)) {
    element.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(tag)) {
    unwrap(element);
    return;
  }

  cleanAttributes(element, tag);
  cleanChildren(element);
}

/** Replaces an element with its children, keeping the text it was wrapping. */
function unwrap(element: Element): void {
  cleanChildren(element);

  const parent = element.parentNode;
  if (!parent) {
    element.remove();
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

function cleanAttributes(element: Element, tag: string): void {
  const permitted = TAG_ATTRIBUTES[tag] ?? [];

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();

    if (!GLOBAL_ATTRIBUTES.has(name) && !permitted.includes(name)) {
      element.removeAttribute(attribute.name);
      continue;
    }

    if (name === 'style') {
      const style = cleanStyle(attribute.value);
      if (style) {
        element.setAttribute('style', style);
      } else {
        element.removeAttribute('style');
      }
      continue;
    }

    if ((name === 'href' || name === 'src') && !isSafeUrl(attribute.value)) {
      element.removeAttribute(attribute.name);
    }
  }

  // A link opening elsewhere hands the new page a reference back to this one
  // unless it is told not to.
  if (tag === 'a' && element.getAttribute('target')) {
    element.setAttribute('rel', 'noopener noreferrer');
  }
}

/** Keeps the declarations that are on the list and drops the rest. */
function cleanStyle(value: string): string {
  const kept: string[] = [];

  for (const declaration of value.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon === -1) {
      continue;
    }

    const property = declaration.slice(0, colon).trim().toLowerCase();
    const setting = declaration.slice(colon + 1).trim();

    if (!setting || !ALLOWED_STYLES.has(property) || UNSAFE_VALUE.test(setting)) {
      continue;
    }
    kept.push(`${property}: ${setting}`);
  }

  return kept.join('; ');
}

/**
 * A relative link, or one of the few schemes worth following.
 *
 * Relative is the common case here - `assets/...` and `/quizzes` - and is safe
 * because it cannot name a scheme. Anything with a colon before the first
 * slash is naming one, and has to be on the list.
 */
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();

  if (!trimmed) {
    return false;
  }

  // Control characters are how `java\nscript:` gets past a naive check.
  const bare = trimmed.replace(/[\u0000-\u0020\u007f]/g, '');
  const scheme = bare.indexOf(':');
  const slash = bare.indexOf('/');

  if (scheme === -1 || (slash !== -1 && slash < scheme)) {
    return true;
  }

  return SAFE_SCHEME.test(bare);
}
