import { Injectable, Signal } from '@angular/core';

/**
 * The words under a field a form must have filled, once it has been left empty or a save asked - Slovak, as the
 * site's form fields have always said them.
 */
export const REQUIRED_WORDS = 'Toto pole je povinné';

/** Empty as a required field reads it: nothing, blank text or NaN (an emptied number). A list counts as filled, empty or not. */
export function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === '' || Number.isNaN(value) || (typeof value === 'string' && value.trim() === '');
}

/** What a form asks of a field it checks before a save. */
export interface CheckedField {
  /** Where the field is: the form opens the tab holding it and brings it into view. */
  readonly element: HTMLElement;
  /** Wrong as it stands: a save waits until it is not. */
  readonly wrong: Signal<boolean>;
  /** Says under the field what is wrong with it from now on, as leaving it does. */
  touch(): void;
}

/**
 * The fields the admin forms check before a save, wherever they are drawn - on a tab not shown, in a row just added -:
 * each adds itself as it is made and goes as it is destroyed (FieldCheck's directives on the kit's fields, the
 * entity's picture slots, the fields local-lib still draws itself). A save asks for the ones inside its form, in the
 * order they were made: how many are wrong, and the first of them to open.
 */
@Injectable({ providedIn: 'root' })
export class FormChecks {
  private readonly _fields = new Set<CheckedField>();

  add(field: CheckedField): void {
    this._fields.add(field);
  }

  remove(field: CheckedField): void {
    this._fields.delete(field);
  }

  /** Touches every field inside `root` - each says what is wrong with it - and answers the wrong ones, in the order they were made. */
  check(root: HTMLElement): CheckedField[] {
    const inside = [...this._fields].filter((field) => root.contains(field.element));
    inside.forEach((field) => field.touch());
    return inside.filter((field) => field.wrong());
  }
}
