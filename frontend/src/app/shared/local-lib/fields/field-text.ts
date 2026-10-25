/**
 * The text a kit field shows for what a form holds: '' for nothing yet - a new row's column is undefined until it is
 * typed into, whatever its type says, and a field given undefined would read "undefined" -, a number as written. What
 * the field says back is the text as typed: `(valueChange)="row.name = $event"`.
 */
export function fieldText(value: unknown): string {
  return String(value ?? '');
}
