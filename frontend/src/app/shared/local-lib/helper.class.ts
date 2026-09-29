import type { OrderEnum } from './abstract-table.class';
import type { SortEvent } from './components/table/table.component';

export function copyObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function replaceObject<T>(source?: T, replacement?: T): T {
  const sourceKeys = Object.keys(source ?? {});
  sourceKeys.forEach((key) => {
    delete (source as any)[key];
  });
  return Object.assign(source ?? {}, replacement);
}

export function getEnumKey<T extends Record<string, string>>(enumObj: T, enumValue: T[keyof T]): string | undefined {
  return Object.keys(enumObj).find((key) => enumObj[key as keyof T] === enumValue);
}

/**
 * Replaces all values in source object with values from replacement object
 * @param source Source object
 * @param replacement Replacement object
 */
export function replaceObjectValues(source: any, replacement: any, replaceFilledValues: boolean = true, addMissingProperties: boolean = false): void {
  // Handle non-object types (primitives, null, undefined)
  if (typeof source !== 'object' || source === null) {
    return;
  }

  // Handle arrays
  if (Array.isArray(source)) {
    if (source && replacement && source.length < replacement.length) {
      source.length = 0;
      replacement.forEach((item: any) => {
        source.push(copyObject(item));
      });
    } else {
      source.forEach((item, index) => {
        if (Array.isArray(replacement) && index < replacement.length) {
          replaceObjectValues(item, replacement[index], replaceFilledValues, addMissingProperties);
        }
      });
    }
    return;
  }

  // Handle objects
  const sourceKeys = Object.keys(source);
  const replacementKeys = addMissingProperties ? Object.keys(replacement) : [];
  const keys = new Set([...sourceKeys, ...replacementKeys]);
  for (const key of keys) {
    const sourceValue = source[key];
    const hasReplacementKey = replacement && Object.prototype.hasOwnProperty.call(replacement, key);
    const replacementValue = hasReplacementKey ? replacement[key] : undefined;

    if (hasReplacementKey) {
      // Property exists in both objects
      if (typeof sourceValue === 'object' && sourceValue !== null && typeof replacementValue === 'object' && replacementValue !== null) {
        // Both are objects, recurse deeply (preserve the reference)
        replaceObjectValues(sourceValue, replacementValue, replaceFilledValues, addMissingProperties);
      } else if (replaceFilledValues || sourceValue === undefined || sourceValue === null || sourceValue === '' || sourceValue === 0) {
        // Replace the value directly in the original object
        source[key] = copyObject(replacementValue);
      }
    }
  }
}

/**
 * Removes all properties with value {}, null, undefined, or an empty string
 * @param obj Object to clean
 * @returns Cleaned object
 */
export function removeEmptyPropertiesDeep<T>(obj: T, keepReference: boolean = false): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => removeEmptyPropertiesDeep(item)) as T;
  }

  const cleaned = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined, null, and empty strings
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Recursively clean nested objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNested = removeEmptyPropertiesDeep(value);
      // Only add if the cleaned object has properties
      (cleaned as any)[key] = cleanedNested;
    } else {
      (cleaned as any)[key] = value;
    }
  }

  if (keepReference) {
    replaceObject(obj, cleaned as any);
    return obj;
  }

  return cleaned;
}

/**
 * Returns value from object by key
 * @param data Input object from which to get value
 * @param key Key of value
 * @returns Value
 */
export function getValueByKey(data?: any, key?: string | number | symbol | undefined): string | undefined {
  return key
    ?.toString()
    .split('.')
    .reduce((obj, prop) => {
      const arrayMatch = prop.match(/^([^[]+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, propName, index] = arrayMatch;
        return obj?.[propName]?.[parseInt(index)];
      }
      return obj?.[prop];
    }, data ?? {});
}

/**
 * Sets value in object
 * @param data Data
 * @param key Key
 * @param value Value
 * @returns Data
 */
export function setValueByKey(data?: any, key?: string, value?: any): any {
  if (!data || !key) {
    return data;
  }
  const keys = key.split('.');
  let current = data;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return data;
}

export function thousandSeparator(num: number | string, thousandSeparator: string = ' '): string {
  const str = num.toString();

  const decimalSeparator = str.includes('.') ? '.' : ',';
  const [integerPart, decimalPart] = str.split(decimalSeparator);

  const reversed = integerPart.split('').reverse().join('');

  // Add commas every 3 digits from the start
  const result = reversed
    .replace(/(\d{3})/g, `$1${thousandSeparator}`)
    .split('')
    .reverse()
    .join('');

  // Add decimal part back if it exists
  return decimalPart ? `${result}${decimalSeparator}${decimalPart}` : result;
}

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function valueMatches(value: any, normalizedTerm: string): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return normalizeText(value).includes(normalizedTerm);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return normalizeText(value.toString()).includes(normalizedTerm);
  }
  if (Array.isArray(value)) {
    return value.some((item) => valueMatches(item, normalizedTerm));
  }
  if (typeof value === 'object') {
    return Object.values(value).some((nested) => valueMatches(nested, normalizedTerm));
  }
  return false;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function isIsoDateString(value: any): value is string {
  return typeof value === 'string' && ISO_DATE_REGEX.test(value);
}

function compareValues(a: any, b: any): number {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';
  if (aEmpty && bEmpty) {
    return 0;
  }
  if (aEmpty) {
    return 1;
  }
  if (bEmpty) {
    return -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1;
  }
  if (isIsoDateString(a) && isIsoDateString(b)) {
    return new Date(a).getTime() - new Date(b).getTime();
  }
  return normalizeText(String(a)).localeCompare(normalizeText(String(b)));
}

export function filterInData(term: string, array: any[], sort?: SortEvent): any[] {
  if (term === null || term === undefined) {
    return array;
  }
  const normalizedTerm = normalizeText(term);
  const filtered = array.filter((item) => valueMatches(item, normalizedTerm));

  if (!sort?.column || !sort.direction) {
    return filtered;
  }

  // Compared as a literal rather than through OrderEnum, so this file does not
  // have to import the table module at runtime and close an import cycle.
  const direction: number = sort.direction === ('ASC' as OrderEnum) ? 1 : -1;
  return filtered.sort((a, b) => direction * compareValues(getValueByKey(a, sort.column), getValueByKey(b, sort.column)));
}

export function isNullOrEmpty(input: any): boolean {
  return input === null || input === undefined || input === '' || Number.isNaN(input);
}

function fontSizeAttrToCss(size: string): string {
  const map: Record<string, string> = {
    '1': 'xx-small',
    '2': 'x-small',
    '3': 'small',
    '4': 'medium',
    '5': 'large',
    '6': 'x-large',
    '7': 'xx-large',
  };
  return map[size] ?? 'medium';
}

function convertFontsToSpans(container: HTMLElement): void {
  const fonts = Array.from(container.querySelectorAll<HTMLElement>('font'));
  for (const font of fonts) {
    const span = document.createElement('span');
    const styles: string[] = [];
    const face = font.getAttribute('face');
    const color = font.getAttribute('color');
    const size = font.getAttribute('size');
    if (face) {
      styles.push(`font-family: ${face}`);
    }
    if (color) {
      styles.push(`color: ${color}`);
    }
    if (size) {
      styles.push(`font-size: ${fontSizeAttrToCss(size)}`);
    }
    const existing = font.getAttribute('style');
    if (existing && existing.trim()) {
      styles.push(existing.replace(/;\s*$/, ''));
    }
    if (styles.length) {
      span.setAttribute('style', styles.join('; '));
    }
    while (font.firstChild) {
      span.appendChild(font.firstChild);
    }
    font.parentNode?.replaceChild(span, font);
  }
}

function renameTags(container: HTMLElement, from: string, to: string): void {
  const elements = Array.from(container.querySelectorAll(from));
  for (const old of elements) {
    const renamed = document.createElement(to);
    for (const attr of Array.from(old.attributes)) {
      renamed.setAttribute(attr.name, attr.value);
    }
    while (old.firstChild) {
      renamed.appendChild(old.firstChild);
    }
    old.parentNode?.replaceChild(renamed, old);
  }
}

/**
 * Normalizes HTML to modern, semantic markup:
 *  - <font face/color/size> -> <span style="...">
 *  - <b> -> <strong>
 *  - <i> -> <em>
 * Existing attributes and inline styles on the original element are preserved.
 */
export function normalizeHtml(html: string | null | undefined): string {
  if (!html) {
    return html ?? '';
  }
  const container = document.createElement('div');
  container.innerHTML = html;
  convertFontsToSpans(container);
  renameTags(container, 'b', 'strong');
  renameTags(container, 'i', 'em');
  return container.innerHTML;
}
