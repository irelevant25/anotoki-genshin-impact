<?php

/**
 * The one-time secrets that arrive by email.
 *
 * A confirmation link, a password reset, and from the next stage a sign-in
 * code. All three are the same thing: a random string that proves whoever
 * holds it can read a particular mailbox, good once and not for long.
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
