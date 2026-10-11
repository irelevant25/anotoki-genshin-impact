<?php

use Anotoki\Lib\Auth\Person;

/**
 * Who is asking, as the IAM says - and this site's own small record of them.
 *
 * The access token is checked by the anotoki library (anotoki-lib 0.4.1, its
 * AccessTokens behind Identify - api/admin_tools.php, api/index.php) with the
 * IAM's published keys: RS256 and an access token's type pinned, issuer,
 * audience `genshin`, expiry. Nothing about the request is trusted beyond
 * what that token proves. Its `sub` is the person's IAM id, which is the id
 * this site has always keyed their quiz progress and every created_by on - the
 * accounts moved to the IAM with their ids.
 *
 * The `users` table stays, slimmed to what is this site's own: the name to
 * show beside an audit entry or a translation. It is kept from the token by
 * the library's people module (PeopleRecorder: made on a first visit, the name
 * kept to the token's, at most a statement a request) and blanked by its scrub
 * when the IAM deletes the account. It holds no password and decides nothing,
 * and no address: the IAM keeps that (users/052 dropped this site's copy), and
 * /api/me answers the one the token carries. The theme, the dates, the clock
 * and the language are the IAM account's too (its migration 015). Visitors -
 * people playing without signing in - have rows there as well, with negative
 * ids (users/045): api/visitors.php makes them, never this file, and an IAM id
 * is always 1 or more.
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

/**
 * The one role the rest of the API compares: the highest this site's roles
 * grant. The endpoints were written against a single role per account, and
 * ADMIN has always implied everything EDITOR may do. MEMBER, and anything else
 * the IAM may list, is USER: an ordinary signed-in reader.
 */
function siteRoleOf(Person $person): string
{
    return $person->has('ADMIN') ? 'ADMIN' : ($person->has('EDITOR') ? 'EDITOR' : 'USER');
}

/**
 * The person a verified token names, with this site's record of them made or
 * brought up to date (the library's PeopleRecorder - one statement that
 * changes nothing on the ordinary path), as the routes read them: the row,
 * the one `role`, every role, when they last signed in at the IAM, and the
 * address their token carries.
 *
 * The name is not unique here - the IAM owns that - so two people swapping
 * names at the IAM cannot collide in this table. Should there be no row - an
 * id the IAM listed as deleted, which the recorder never makes one for - the
 * token's own name stands in.
 */
function siteUserOf(Person $person): array
{
    $pdo = usersDb();
    sitePeople()->recorder()->seen($pdo, $person);

    $statement = $pdo->prepare('SELECT * FROM users WHERE id = ? AND id > 0');
    $statement->execute([$person->sub]);
    $row = $statement->fetch() ?: ['id' => $person->sub, 'username' => $person->name ?? 'user' . $person->sub];

    // A database that has not run users/052 yet still has the column of the
    // address; whatever it holds, the token's is the one that counts.
    unset($row['email']);

    // array_replace, not +: the token's role must win over any `role` column
    // a backup from before users/040 would bring back.
    return array_replace($row, [
        'role' => siteRoleOf($person),
        'roles' => $person->roles,
        'auth_time' => $person->authTime,
        'email' => $person->email,
    ]);
}
