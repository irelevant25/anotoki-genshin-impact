/* eslint-disable @typescript-eslint/no-unused-vars */

/*
Add this to main.ts: import './app/shared/local-lib/array-extensions';
So the project will find the extensions
*/

interface Array<T> {
  first: () => T | undefined;
  last: () => T | undefined;
  isFirst: (element: T) => boolean;
  isLast: (element: T) => boolean;
  isEmpty: () => boolean;
  clear: () => void;
  insertAt: (index: number, element: T) => void;
  removeAt: (index: number) => T | undefined;
  remove: ((element: T) => boolean) & ((predicate: (element: T, index: number, array: T[]) => boolean) => boolean);
  removeAll: ((element: T) => boolean) & ((predicate: (element: T, index: number, array: T[]) => boolean) => boolean);
  contains: ((element: T) => boolean) & ((predicate: (element: T, index: number, array: T[]) => boolean) => boolean);
  groupBy: <TKey extends string | number | symbol>(keySelector: (element: T) => TKey) => Record<TKey, T[]>;
  sum: () => T | undefined;
  hasDuplicates: ((element: T) => boolean) & ((keySelector?: (element: T) => any) => boolean);
  firstDuplicate: ((element: T) => T | undefined) & ((keySelector?: (element: T) => any) => T | undefined);
  firstDuplicateIndex: ((element: T) => T | undefined) & ((keySelector?: (element: T) => any) => number);
  duplicates: ((element: T) => T[]) & ((keySelector?: (element: T) => any) => T[]);
  removeDuplicates: ((element: T) => T[]) & ((keySelector?: (element: T) => any) => T[]);
  distinct: ((element: T) => T[]) & ((keySelector?: (element: T) => any) => T[]);
  isEqual: (array: T[], keySelector?: (element: T) => any) => boolean;
}

Array.prototype.first = function <T>(): T | undefined {
  return this.length > 0 ? this[0] : undefined;
};

Array.prototype.last = function <T>(): T | undefined {
  return this.length > 0 ? this[this.length - 1] : undefined;
};

Array.prototype.isFirst = function <T>(element: T): boolean {
  return this.first() === element;
};

Array.prototype.isLast = function <T>(element: T): boolean {
  return this.last() === element;
};

Array.prototype.isEmpty = function <T>(): boolean {
  return this.length === 0;
};

Array.prototype.clear = function <T>(): void {
  this.length = 0;
};

Array.prototype.insertAt = function <T>(index: number, element: T): void {
  this.splice(index, 0, element);
};

Array.prototype.removeAt = function <T>(index: number): T | undefined {
  if (index >= 0 && index < this.length) {
    return this.splice(index, 1)[0];
  }
  return undefined;
};

Array.prototype.remove = function <T>(arg: T | ((element: T, index: number, array: T[]) => boolean)): boolean {
  if (typeof arg === 'function') {
    const predicate = arg as (element: T, index: number, array: T[]) => boolean;
    for (let i = 0; i < this.length; i++) {
      if (predicate(this[i], i, this)) {
        this.splice(i, 1);
        return true;
      }
    }
  } else {
    const index = this.indexOf(arg);
    if (index !== -1) {
      this.splice(index, 1);
      return true;
    }
  }
  return false;
};

Array.prototype.removeAll = function <T>(arg: T | ((element: T, index: number, array: T[]) => boolean)): boolean {
  const removedElements = this.remove(arg);
  while (this.remove(arg)) {
    /* empty */
  }
  return removedElements;
};

Array.prototype.contains = function <T>(arg: T | ((element: T, index: number, array: T[]) => boolean)): boolean {
  if (typeof arg === 'function') {
    const predicate = arg as (element: T, index: number, array: T[]) => boolean;
    for (let i = 0; i < this.length; i++) {
      if (predicate(this[i], i, this)) {
        return true;
      }
    }
  } else {
    return this.includes(arg);
  }
  return false;
};

Array.prototype.groupBy = function <T, TKey extends string | number | symbol>(keySelector: (element: T) => TKey): Record<TKey, T[]> {
  const result: Record<TKey, T[]> = {} as any;
  for (const element of this) {
    const key = keySelector(element);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(element);
  }
  return result;
};

Array.prototype.sum = function (): number {
  return this.reduce((accumulator: number, currentValue: number) => {
    return accumulator + currentValue;
  }, 0);
};

Array.prototype.hasDuplicates = function <T>(keySelector?: (element: T) => any): boolean {
  const counts: Record<string, number> = {};
  for (const item of this as T[]) {
    const key = keySelector ? keySelector(item) : item;
    const stringKey = String(key);
    counts[stringKey] = (counts[stringKey] || 0) + 1;
    if (counts[stringKey] > 1) {
      return true;
    }
  }
  return false;
};

Array.prototype.firstDuplicate = function <T>(keySelector?: (element: T) => any): T | undefined {
  const counts: Record<string, number> = {};
  for (const item of this as T[]) {
    const key = keySelector ? keySelector(item) : item;
    const stringKey = String(key);
    counts[stringKey] = (counts[stringKey] || 0) + 1;
    if (counts[stringKey] > 1) {
      return item;
    }
  }
  return undefined;
};

Array.prototype.firstDuplicateIndex = function <T>(keySelector?: (element: T) => any): number {
  const counts: Record<string, number> = {};
  let index = 0;
  for (const item of this as T[]) {
    index = index + 1;
    const key = keySelector ? keySelector(item) : item;
    const stringKey = String(key);
    counts[stringKey] = (counts[stringKey] || 0) + 1;
    if (counts[stringKey] > 1) {
      return index;
    }
  }
  return -1;
};

Array.prototype.duplicates = function <T>(keySelector?: (element: T) => any): T[] {
  const counts: Record<string, number> = {};
  for (const item of this as T[]) {
    const key = keySelector ? keySelector(item) : item;
    const stringKey = String(key);
    counts[stringKey] = (counts[stringKey] || 0) + 1;
  }
  return (this as T[]).filter((item) => counts[String(keySelector ? keySelector(item) : item)] > 1);
};

Array.prototype.removeDuplicates = function <T>(keySelector?: (Element: T) => any): T[] {
  const counts: Record<string, number> = {};
  for (const item of this as T[]) {
    const key = keySelector ? keySelector(item) : item;
    const stringKey = String(key);
    counts[stringKey] = (counts[stringKey] || 0) + 1;
  }
  return (this as T[]).filter((item) => counts[String(keySelector ? keySelector(item) : item)] === 1);
};

Array.prototype.distinct = function <T>(keySelector?: (element: T) => any): T[] {
  const result: T[] = [];
  const seen = new Set();
  this.forEach((item) => {
    const key = keySelector ? keySelector(item) : item;
    const stringKey = String(key);
    if (!seen.has(stringKey)) {
      seen.add(stringKey);
      result.push(item);
    }
  });
  return result;
};

Array.prototype.isEqual = function <T>(array: T[], keySelector?: (element: T) => any): boolean {
  if (this.length !== array.length) {
    return false;
  }
  for (let i = 0; i < this.length; i++) {
    if (keySelector) {
      if (keySelector(this[i]) !== keySelector(array[i])) {
        return false;
      }
    } else {
      if (this[i] !== array[i]) {
        return false;
      }
    }
  }
  return true;
};
