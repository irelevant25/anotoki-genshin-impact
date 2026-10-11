<?php

use Anotoki\Lib\Auth\Http\SignInGate;
use Anotoki\Lib\Backups\Backups;
use Anotoki\Lib\Translations\Http\TranslationsRoutes;

/**
 * Middleware: while the IAM requires sign-in for this site, nobody who has not
 * signed in gets past - the anotoki library's SignInGate (anotoki-lib 0.4.1),
 * behind its Identify (meddleware/auth.php).
 *
 * The switch is the IAM's ("Sign-in required" on this site's page in its admin
 * console; the library's SignInRule reads it, api/admin_tools.php). Off - this
 * site's default, and what it has always been - this does nothing. On, the
 * site is for people with an account: every API path answers 401
 * `sign_in_required` to a request without a verified token, and the frontend
 * sends the person to sign in.
 *
 * A gate of its own rather than a check on every route, because the reference
 * pages, the quizzes and the games are some hundred public GET routes, and one
 * forgotten would be a hole nobody notices. A signed-in request never asks the
 * switch: it costs them nothing when the IAM is slow.
 *
 * Open whatever the switch, because without them the sign-in card cannot be
 * drawn or worded:
 *
 *   /api/settings/public      is how the page learns that sign-in is required
 *                             (and where the IAM is, and whether the site is closed)
 *   /api/translations/{code}  is the words on it, with the languages it can be
 *                             read in beside them - that path exactly
 *   /api/site-status          is whether the site is there at all (site_state.php):
 *                             the pages ask it before anything else, and a 401
 *                             would read as a site that is down
 *
 * and three more, because a browser cannot send them a token:
 *
 *   /api/files/raw            a file of the asset tree, for the admin panel's
 *                             previews - an <img> or <audio> sends no Authorization
 *                             header, so gating it would break them for the admins
 *                             themselves, and it protects nothing: the same bytes
 *                             are under assets/
 *   /api/admin/files/raw      the file explorer's previews: signed for five minutes,
 *                             the signature their only check
 *   /api/admin/backups/{id}/file  a backup's download: its single-use ticket its
 *                             only check (only an ADMIN signed in gets either link)
 *
 * (/api/me, open during maintenance, is not here: it needs a token anyway.)
 * The pictures and audio under assets/ are the web server's, served without
 * PHP, and stay reachable by address - game art, nothing of anybody's.
 *
 * Who passes is the IAM's decision, not this one's: any token that verifies
 * passes, whatever roles it lists - the IAM has already refused a sign-in to
 * anybody without a role here that may sign in (MEMBER, which every account
 * holds until an admin takes it away). And only an `Authorization: Bearer`
 * header claims to be somebody: a token that does not verify answers 401
 * `invalid_token` (Identify, before this), so the frontend refreshes it, while
 * `Basic ...` (what a host behind a password file sends with everything) is no
 * claim at all.
 *
 * Every entry is the whole path, decoded once as the router decodes it, or a
 * pattern starting with `~` the whole path must match - never a prefix: there
 * is no "outside /api/" to wave through, and what reaches this stack is the
 * API, open here by name or behind the switch. `/%61pi/characters` is routed
 * to /api/characters, so it is refused like it.
 *
 * Registered between the maintenance gate and the route gate: the closed sign
 * (503) is still the first answer, then this, then the per-page locks (423).
 */
define('SIGN_IN_OPEN_PATHS', [
    '/api/settings/public',
    TranslationsRoutes::openPath(),
    '/api/site-status',
    '/api/files/raw',
    '/api/admin/files/raw',
    '~^/api/admin/backups/' . Backups::ID_PATTERN . '/file$~D',
]);

function signInGate(): SignInGate
{
    return new SignInGate(SIGN_IN_OPEN_PATHS);
}
