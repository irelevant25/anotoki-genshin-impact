<?php

use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Who is asking, as the IAM says - and this site's own small record of them.
 *
 * The access token is checked here with the IAM's published keys (see
 * anotoki_iam.php): signature, issuer, audience `genshin`, expiry, and that it
 * is an access token rather than an ID token. Nothing about the request is
 * trusted beyond what that token proves. Its `sub` is the person's IAM id,
 * which is the id this site has always keyed their quiz progress and every
 * created_by on - the accounts moved to the IAM with their ids.
 *
 * The `users` table stays, slimmed to what is this site's own: the name to
 * show beside an audit entry or a translation, the email a feedback reply goes
 * to, and the reader's preferences here - theme, language, date format. It is
 * filled in from the token as people arrive and kept in step when the IAM says
 * their name or address changed. It holds no password and decides nothing.
 * Visitors - people playing without signing in - have rows there too, with
 * negative ids (users/045): api/visitors.php makes them, never this file, and
 * an IAM id is always 1 or more.
 *
 * The role is the token's too: `roles` lists this site's roles for the person
 * - MEMBER, which every account holds, plus ADMIN or EDITOR for the staff - and
 * is read fresh from the IAM at every token, so a role taken away there stops
 * working here within one token lifetime. MEMBER is the ordinary reader (USER
 * below): nothing here asks for it. Taking it away is how the IAM blocks a
 * person from this site - it refuses their next sign-in and refresh, while the
 * token they hold verifies until it expires; and while the site does not
 * require sign-in they can still read it as anybody can.
 */

/** The claims of the request's bearer token, verified - or null. Checked once per token per request. */
function iamBearerClaims(Request $request): ?array
{
    static $verified = [];

    $token = anotoki_iam_bearer_token($request->getHeaderLine('Authorization'));

    if ($token === null) {
        return null;
    }

    if (!array_key_exists($token, $verified)) {
        $claims = anotoki_iam_verify_access_token($token, iamClientConfig(), $reason);
        // Worth a line in the PHP log - an expired token is routine, a bad
        // signature or the wrong audience is somebody holding the wrong thing.
        if ($claims === null && $reason !== 'expired') {
            error_log('[iam] refused an access token: ' . $reason);
        }
        $verified = [$token => $claims];
    }

    return $verified[$token];
}

/**
 * The one role the rest of the API compares: the highest this site's roles
 * grant. The endpoints were written against a single role per account, and
 * ADMIN has always implied everything EDITOR may do. MEMBER, and anything else
 * the IAM may list, is USER: an ordinary signed-in reader.
 */
function siteRoleFromClaims(array $claims): string
{
    $roles = anotoki_iam_roles($claims);

    return in_array('ADMIN', $roles, true) ? 'ADMIN' : (in_array('EDITOR', $roles, true) ? 'EDITOR' : 'USER');
}

/**
 * The person behind a verified token, with this site's record of them made or
 * brought up to date.
 *
 * One read on the ordinary path; a write only for a first visit or when the IAM
 * reports a new name or address. The name is not unique here - the IAM owns
 * that - so two people swapping names at the IAM cannot collide in this table.
 */
function siteUserFromClaims(array $claims): array
{
    $pdo = usersDb();
    $id = (int) anotoki_iam_user_id($claims);
    // An IAM id is always 1 or more; 0 and below are visitors' (users/045).
    // A token naming one is not a person this file may make or update a row for.
    if ($id < 1) {
        throw new LogicException('An IAM user id is 1 or more; this token names ' . $id . '.');
    }
    // A token without the profile scope carries no name: the stored one stays
    // then, rather than everybody becoming "user{id}" on such a request.
    $claimedName = trim((string) ($claims['preferred_username'] ?? ''));
    $email = isset($claims['email']) && is_string($claims['email']) ? $claims['email'] : null;

    $statement = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $statement->execute([$id]);
    $row = $statement->fetch();

    if ($row === false) {
        $pdo->prepare('INSERT INTO users (id, username, email, language) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING')
            ->execute([$id, $claimedName !== '' ? $claimedName : 'user' . $id, $email, siteLanguageFor($pdo, $claims['locale'] ?? null)]);
        $statement->execute([$id]);
        $row = $statement->fetch();
    } elseif (($claimedName !== '' && $row['username'] !== $claimedName) || ($email !== null && $row['email'] !== $email)) {
        $username = $claimedName !== '' ? $claimedName : $row['username'];
        $pdo->prepare('UPDATE users SET username = ?, email = COALESCE(?, email) WHERE id = ?')->execute([$username, $email, $id]);
        $row['username'] = $username;
        $row['email'] = $email ?? $row['email'];
    }

    // array_replace, not +: the token's role must win over any `role` column.
    // One is still there on a database that has not run migration 040 yet, or
    // after restoring a backup from before it - and there `+` would have kept
    // the old table's role, whatever the IAM now says.
    return array_replace($row, [
        'role' => siteRoleFromClaims($claims),
        'roles' => anotoki_iam_roles($claims),
        'auth_time' => isset($claims['auth_time']) ? (int) $claims['auth_time'] : null,
    ]);
}

/**
 * The language a newcomer starts in: the IAM's `locale` when this site has
 * that language (users.language refers to the languages table), else English.
 */
function siteLanguageFor(PDO $pdo, mixed $locale): string
{
    if (!is_string($locale) || $locale === '') {
        return 'en';
    }

    $known = $pdo->prepare('SELECT 1 FROM languages WHERE code = ?');
    $known->execute([$locale]);

    return $known->fetchColumn() ? $locale : 'en';
}
