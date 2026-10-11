/**
 * The move at sign-in (`POST /api/visitor/move`, with the token and this
 * browser's visitor key).
 *
 * `silent`: the session was made by a silent sign-in - the IAM's sign-in hint
 * signed the person in, nobody clicked anything. Then the server moves the
 * visitor only into an account that has nothing here yet, and otherwise
 * answers `stayed` (the owner's decision of 2026-10-11). Missing or false: a
 * sign-in the person made, and the visitor moves.
 */
export interface VisitorMoveRequest {
  silent?: boolean;
}
