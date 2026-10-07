/** A changelog version: numbers between dots - MAJOR.MINOR.PATCH since 1.1.0. */
const VERSION = /^\d+(\.\d+)*$/;

/**
 * Whether two changelog versions name the same release.
 *
 * Versions have three numbers since 1.1.0 (MAJOR.MINOR.PATCH), and the
 * changelog's older entries were renamed to match - "1.0" is "1.0.0" now - but
 * a browser still remembers the version it last saw under its old name. So
 * they are compared number by number, a missing part counting as 0: "1.0" and
 * "1.0.0" are one release, and nobody is shown a note they have already read.
 * Anything that is not a version number is the same only as itself.
 */
export function sameVersion(a: string | null | undefined, b: string | null | undefined): boolean {
  if (a == null || b == null) {
    return false;
  }
  const left = a.trim();
  const right = b.trim();
  if (!VERSION.test(left) || !VERSION.test(right)) {
    return left === right;
  }

  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index++) {
    if ((leftParts[index] ?? 0) !== (rightParts[index] ?? 0)) {
      return false;
    }
  }
  return true;
}
