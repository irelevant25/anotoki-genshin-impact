<?php

/**
 * The one-time secrets that arrive by email.
 *
 * A confirmation link, a password reset, and a sign-in code. All three are the
 * same thing: a secret that proves whoever holds it can read a particular
 * mailbox, good once and not for long.
 *
 * Only the SHA-256 of the token is ever stored. Nothing here can tell you what
 * a live token is, which is the point - the row is worth as little to somebody
 * who reads the table as a password hash is. Verification hashes what it is
 * given and looks that up, so the comparison is a database lookup on a value
 * that is already the full 256 bits, and there is no secret to compare in
 * variable time.
 *
 * SHA-256 rather than password_hash: these are 256 bits of output from a CSPRNG
 * and they live for an hour. There is no dictionary to attack and nothing to
 * slow an attacker down from, so the cost of a slow hash would buy nothing and
 * a login-code check would take a tenth of a second for no reason.
 */

/** Purposes a token can be issued for. A token is only accepted for its own. */
const TOKEN_EMAIL_CONFIRM = 'email_confirm';
const TOKEN_PASSWORD_RESET = 'password_reset';
const TOKEN_LOGIN_CODE = 'login_code';

/**
 * Wrong guesses at a code before every live one for that account is put out.
 *
 * Only the emailed sign-in code needs this. The other two are 256 bits out of
 * a CSPRNG and arrive by being clicked; this one is six digits because
 * somebody has to read it off a screen and type it, and six digits is a
 * million - which is worth working through if the working is free.
 */
const TOKEN_MAX_ATTEMPTS = 5;

/**
 * How many live tokens one account may hold for one purpose.
 *
 * This is what stops the resend button being a way to post mail to somebody
 * else all afternoon. Reaching it is not an error the caller is told about -
 * the answer is the same either way - it simply stops another message going
 * out until one of the outstanding ones expires or is used.
 */
const TOKEN_MAX_OUTSTANDING = 5;

/**
 * Issues a token for a user, and hands back the part that goes in the email.
 *
 * Null when the account is already holding as many as it may. The caller sends
 * nothing in that case and still answers as though it had.
 */
function issueOneTimeToken(PDO $pdo, int $userId, string $purpose, int $lifetimeSeconds): ?string
{
    $outstanding = $pdo->prepare(
        'SELECT COUNT(*) FROM user_tokens
          WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP'
    );
    $outstanding->execute([$userId, $purpose]);

    if ((int) $outstanding->fetchColumn() >= TOKEN_MAX_OUTSTANDING) {
        return null;
    }

    // 32 bytes from the CSPRNG, hex, so it survives being pasted out of a mail
    // client and back into a URL without anything needing to be escaped.
    $token = bin2hex(random_bytes(32));

    $pdo->prepare(
        'INSERT INTO user_tokens (user_id, purpose, token_hash, expires_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP + (? * INTERVAL \'1 second\'))'
    )->execute([$userId, $purpose, hash('sha256', $token), $lifetimeSeconds]);

    return $token;
}

/**
 * The row a token names, if it is live and was issued for this purpose.
 *
 * Null covers every way a token can fail - never existed, wrong purpose,
 * expired, already used - on purpose. Telling those apart would tell a caller
 * holding a guess that the guess was nearly right.
 */
function findOneTimeToken(PDO $pdo, string $token, string $purpose): ?array
{
    if ($token === '') {
        return null;
    }

    $statement = $pdo->prepare(
        'SELECT * FROM user_tokens
          WHERE token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP'
    );
    $statement->execute([hash('sha256', $token), $purpose]);
    $row = $statement->fetch();

    return $row === false ? null : $row;
}

/**
 * Marks a token used, and answers whether this call is the one that did it.
 *
 * The WHERE clause carries the condition rather than trusting the read that
 * came before it, so two requests arriving together with the same token cannot
 * both be told they succeeded: the second updates no rows and is refused.
 */
function consumeOneTimeToken(PDO $pdo, int $tokenId): bool
{
    $statement = $pdo->prepare('UPDATE user_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE id = ? AND consumed_at IS NULL');
    $statement->execute([$tokenId]);

    return $statement->rowCount() === 1;
}

/**
 * Puts out every live token of a purpose for one account.
 *
 * Setting a password ends the outstanding resets, including the ones that were
 * not used: whoever asked for them has what they asked for, and a link that
 * still opens after that is a spare key nobody remembers issuing.
 */
function revokeOneTimeTokens(PDO $pdo, int $userId, string $purpose): void
{
    $pdo->prepare(
        'UPDATE user_tokens SET consumed_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL'
    )->execute([$userId, $purpose]);
}

/**
 * Issues a six-digit sign-in code, and hands back the digits.
 *
 * Short enough to read off a screen and type, which is the whole point of it,
 * and everything else about it is arranged around that being weak: ten
 * minutes, at most five outstanding, and five wrong guesses puts them all out.
 *
 * The hash mixes in the account id, because six digits collide - two people
 * holding 402913 at the same time is not unlikely, and the index on
 * token_hash is unique. Mixing the id in means a code is only ever a code for
 * one account, which is also what stops one being tried against another.
 */
function issueLoginCode(PDO $pdo, int $userId, int $lifetimeSeconds): ?string
{
    $outstanding = $pdo->prepare(
        'SELECT COUNT(*) FROM user_tokens
          WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP'
    );
    $outstanding->execute([$userId, TOKEN_LOGIN_CODE]);

    if ((int) $outstanding->fetchColumn() >= TOKEN_MAX_OUTSTANDING) {
        return null;
    }

    // random_int, not rand: this is a credential, however briefly.
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    $pdo->prepare(
        'INSERT INTO user_tokens (user_id, purpose, token_hash, expires_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP + (? * INTERVAL \'1 second\'))'
    )->execute([$userId, TOKEN_LOGIN_CODE, loginCodeHash($userId, $code), $lifetimeSeconds]);

    return $code;
}

/** A code is only ever a code for one account - see issueLoginCode(). */
function loginCodeHash(int $userId, string $code): string
{
    return hash('sha256', $userId . ':' . $code);
}

/**
 * The token row for a code, if it is that account's and still live.
 *
 * A wrong code counts against every live code the account is holding, and
 * reaching the limit puts them all out - so guessing costs the guesser the
 * codes rather than costing the account anything. Whoever the account belongs
 * to asks for another, which is a nuisance; being guessed into is worse.
 */
function findLoginCode(PDO $pdo, int $userId, string $code): ?array
{
    $statement = $pdo->prepare(
        'SELECT * FROM user_tokens
          WHERE user_id = ? AND purpose = ? AND token_hash = ?
            AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP
            AND attempts < ?'
    );
    $statement->execute([$userId, TOKEN_LOGIN_CODE, loginCodeHash($userId, $code), TOKEN_MAX_ATTEMPTS]);
    $row = $statement->fetch();

    if ($row !== false) {
        return $row;
    }

    $pdo->prepare(
        'UPDATE user_tokens SET attempts = attempts + 1
          WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP'
    )->execute([$userId, TOKEN_LOGIN_CODE]);

    $pdo->prepare(
        'UPDATE user_tokens SET consumed_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL AND attempts >= ?'
    )->execute([$userId, TOKEN_LOGIN_CODE, TOKEN_MAX_ATTEMPTS]);

    return null;
}
