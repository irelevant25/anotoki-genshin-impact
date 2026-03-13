export function copyObject<T>(obj: T): T {
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
      } else if (replacementValue !== undefined && replacementValue !== null && (replaceFilledValues || sourceValue === undefined || sourceValue === null || sourceValue === '' || sourceValue === 0)) {
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
