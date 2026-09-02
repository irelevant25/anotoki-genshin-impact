/**
 * The type-level plumbing the generated client leans on.
 *
 * Everything that describes a response now comes from the backend: rows from
 * the schema, bodies from the models, and anything else from the ResponseShape
 * classes beside the handlers that return them. What is left here is the small
 * amount that has no PHP declaration to come from - the mapped types below, and
 * the request and query shapes in the other files, which no endpoint declares
 * because several of them validate their own bodies by hand.
 */

/** What a failed request carries, whatever the status. */
export interface ApiError {
  error: string;
}

/** A 422 from validateRequest(): one message per field that would not do. */
export interface ApiValidationError {
  errors: Record<string, string>;
}

/**
 * A user as an audit column reports them.
 *
 * `created_by` and `updated_by` hold an id in the database, but DbQuery's
 * includeExternal() swaps the id for the row before answering, so what arrives
 * is the user, or null where the account has since gone.
 */
export interface UserStamp {
  id: number;
  username: string;
}

/**
 * A row whose foreign keys have been expanded into the rows they point at.
 *
 * The generated services apply this wherever the endpoint calls
 * includeExternal(), so a response type says `created_by: UserStamp | null`
 * while the table type it comes from still says `created_by: number`.
 */
export type Expanded<T, K extends keyof T> = Omit<T, K> & { [P in K]: UserStamp | null };

/**
 * The keys of `T` that name a foreign key, by the `_id` suffix the schema uses.
 *
 * `-?` matters: without it an optional property keeps its optionality through
 * the mapped type, and indexing then folds `undefined` into the union - which
 * turns every `keyof Saved<T>` downstream into `... | undefined`.
 */
type ForeignKeys<T> = { [K in keyof T]-?: K extends `${string}_id` ? K : never }[keyof T];

/**
 * A payload as it appears inside a `/full` body: the fields that are sent, with
 * identity and parentage left open.
 *
 * The `/full` endpoints read and write the same shape - a form loads one, edits
 * it and puts it back - so one type covers both directions. Two things differ
 * from a plain payload, and both are about a row that does not exist yet:
 *
 *   id      a child added on screen has none until it is saved
 *   *_id    the link to its parent is filled in on save, by whichever side
 *           knows the id - and a `material_id` is simply blank until somebody
 *           picks the material
 *
 * So both are optional here, while everything the editor actually types stays
 * as required as the model says it is.
 */
export type Saved<T> = Omit<T, ForeignKeys<T>> & Partial<Pick<T, ForeignKeys<T>>> & { id?: number };

/**
 * Any of the name-keyed lookup tables, when the caller does not care which.
 *
 * The lookup service answers with the concrete type - `Element`, `Region` and
 * the rest - and every one of them is this. Code that handles several of them
 * the same way, like the lookup-table screen, takes this instead.
 */
export interface NameEntry {
  name: string;
}

/** A row reduced to what a picker needs. */
export interface IdNameEntry {
  id: number;
  name: string;
}

/**
 * A row as a listing endpoint returns it: the audit columns hold the users they
 * name rather than their ids.
 *
 * Most of the read endpoints call includeExternal() on `created_by` and
 * `updated_by`, so this is the usual shape of a row on the way out. A type
 * without those columns passes through unchanged.
 */
export type Audited<T> = Expanded<T, Extract<keyof T, 'created_by' | 'updated_by'>>;
