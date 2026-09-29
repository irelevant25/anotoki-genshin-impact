/**
 * Decoding the columns the API does not decode for you.
 *
 * A JSONB column crosses the wire in two different shapes depending on which
 * way it is going. On the way in it is the value - `toDbArray()` encodes it
 * server-side. On the way out it is a raw JSON *string*: PDO hands JSONB over
 * as text and nothing decodes it before the response is written. Checked
 * against the running database rather than assumed - `how_to_obtain` comes back
 * as `"[\"Event Wish\"]"`, not as an array.
 *
 * So anything reading one of these columns has to parse it, and this is the
 * only place in the client that knows that.
 */

/** The parsed value, or the value itself when it is not a JSON string. */
export function parseJsonColumn(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
