<?php

/**
 * Sending mail, and the messages worth sending.
 *
 * Two drivers, chosen in config/mail.php. `mail` hands the message to PHP's
 * mail(), which is what the hosting supports. `file` writes it into
 * storage/mail/ instead and is the default, so everything below can be
 * exercised on a machine with no mail server: the confirmation link is in the
 * newest file in that folder.
 *
 * Nothing here throws. A message that cannot be sent must not take the request
 * with it - an account is still created, a password is still reset - so
 * sendMail() answers true or false and the caller decides what to say. What
 * the caller must not do is say which: "if that address exists, a message is
 * on its way" is the same answer whether or not it does, and that is what
 * keeps these endpoints from being a way to ask whether somebody has an
 * account here.
 *
 * The bodies are here rather than in the translations table. Everything the
 * site says on screen is editable from the admin panel, and deliberately so,
 * but a mail body is a multi-line template with a link in the middle of it -
 * awkward in a translation grid, and easy to break in a way nobody sees until
 * somebody stops receiving their password reset. They are translated, though:
 * each one carries the two languages the site is read in, chosen by the
 * recipient's own setting.
 */

/** How long a confirmation link is good for. Long enough to find the mail. */
const MAIL_CONFIRM_HOURS = 48;

/** How long a password reset is good for. Short: it is a live key to an account. */
const MAIL_RESET_MINUTES = 60;

function mailConfig(): array
{
    static $config = null;

    if ($config === null) {
        $localFile = __DIR__ . '/../config/mail.local.php';
        $config = require file_exists($localFile) ? $localFile : __DIR__ . '/../config/mail.php';
    }

    return $config;
}

/** Where the links in a message point - the Angular app, not the API. */
function mailBaseUrl(): string
{
    return rtrim((string) (mailConfig()['base_url'] ?? ''), '/');
}

/**
 * A subject line as a mail header.
 *
 * Anything outside ASCII has to be encoded or it arrives as mojibake, and the
 * site's other language is Slovak, which is full of it.
 */
function mailEncodeSubject(string $subject): string
{
    if (preg_match('/^[\x20-\x7E]*$/', $subject)) {
        return $subject;
    }

    return '=?UTF-8?B?' . base64_encode($subject) . '?=';
}

/**
 * Sends one plain-text message. True if the driver accepted it.
 *
 * Plain text on purpose: these are four short messages with a link in them,
 * and an HTML part would be two bodies to keep in step for no gain.
 */
function sendMail(string $to, string $subject, string $body): bool
{
    $config = mailConfig();
    $from = (string) ($config['from'] ?? 'noreply@localhost');
    $fromName = (string) ($config['from_name'] ?? '');

    // A display name goes through the same encoding as the subject, and the
    // address itself stays outside the quotes where the encoding cannot reach.
    $sender = $fromName === '' ? $from : mailEncodeSubject($fromName) . ' <' . $from . '>';

    $headers = [
        'From: ' . $sender,
        'Reply-To: ' . $from,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ];

    if (($config['driver'] ?? 'file') === 'mail') {
        // A bare \n is what the RFC asks for and what most sendmail binaries
        // want; PHP's own docs warn that \r\n breaks some of them.
        return @mail($to, mailEncodeSubject($subject), $body, implode("\n", $headers));
    }

    return mailToFile($to, $subject, $body, $headers);
}

/**
 * The development driver: one .eml per message under storage/mail/.
 *
 * Named with a timestamp so the newest sorts to the bottom of the list, which
 * is nearly always the one being looked for. The timestamp carries
 * microseconds and a random tail because a resend button pressed twice, or a
 * test exercising the rate limit, sends several messages inside one second -
 * and at one-second resolution the later ones would quietly overwrite the
 * earlier, which is the one behaviour a mailbox must never have.
 */
function mailToFile(string $to, string $subject, string $body, array $headers): bool
{
    $directory = __DIR__ . '/../storage/mail';

    if (!is_dir($directory) && !@mkdir($directory, 0777, true) && !is_dir($directory)) {
        return false;
    }

    [$microseconds, $seconds] = explode(' ', microtime());
    $stamp = date('Ymd-His', (int) $seconds) . '.' . substr($microseconds, 2, 6) . '-' . bin2hex(random_bytes(2));

    $name = sprintf('%s-%s.eml', $stamp, preg_replace('/[^A-Za-z0-9._-]+/', '_', $to));
    $message = implode("\n", [...$headers, 'To: ' . $to, 'Subject: ' . $subject, '', $body]);

    return @file_put_contents($directory . '/' . $name, $message) !== false;
}

// ─────────────────────────────────────────────────────────────────────────────
// The messages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Picks the recipient's language, falling back to English.
 *
 * Every template below is keyed the same way, so a language the site gains
 * later needs a line in each rather than a change here.
 */
function mailText(array $byLanguage, ?string $language): array
{
    return $byLanguage[$language ?? 'en'] ?? $byLanguage['en'];
}

/** "Confirm your address" - the message registration sends. */
function sendConfirmationMail(array $user, string $token): bool
{
    $link = mailBaseUrl() . '/confirm-email?token=' . urlencode($token);

    $text = mailText([
        'en' => [
            'subject' => 'Confirm your Anotoki account',
            'body' => "Hello {$user['username']},\n\n"
                . "Open the link below to confirm this address and finish setting up your account:\n\n"
                . "$link\n\n"
                . 'The link is good for ' . MAIL_CONFIRM_HOURS . " hours.\n\n"
                . "If you did not sign up, you can ignore this message - the account cannot be used until somebody opens that link.\n",
        ],
        'sk' => [
            'subject' => 'Potvrď svoj účet na Anotoki',
            'body' => "Ahoj {$user['username']},\n\n"
                . "Otvor odkaz nižšie a potvrď túto adresu, čím dokončíš vytvorenie účtu:\n\n"
                . "$link\n\n"
                . 'Odkaz platí ' . MAIL_CONFIRM_HOURS . " hodín.\n\n"
                . "Ak si sa neregistroval, túto správu môžeš ignorovať - účet sa nedá použiť, kým niekto ten odkaz neotvorí.\n",
        ],
    ], $user['language'] ?? 'en');

    return sendMail($user['email'], $text['subject'], $text['body']);
}

/** "Set a new password" - the message the forgotten-password form sends. */
function sendPasswordResetMail(array $user, string $token): bool
{
    $link = mailBaseUrl() . '/reset-password?token=' . urlencode($token);

    $text = mailText([
        'en' => [
            'subject' => 'Set a new Anotoki password',
            'body' => "Hello {$user['username']},\n\n"
                . "Somebody asked to set a new password for this account. Open the link below to choose one:\n\n"
                . "$link\n\n"
                . 'The link is good for ' . MAIL_RESET_MINUTES . " minutes and can only be used once.\n\n"
                . "If it was not you, nothing has changed and there is nothing to do. Your current password still works.\n",
        ],
        'sk' => [
            'subject' => 'Nastavenie nového hesla na Anotoki',
            'body' => "Ahoj {$user['username']},\n\n"
                . "Niekto požiadal o nastavenie nového hesla k tomuto účtu. Otvor odkaz nižšie a zvoľ si ho:\n\n"
                . "$link\n\n"
                . 'Odkaz platí ' . MAIL_RESET_MINUTES . " minút a dá sa použiť len raz.\n\n"
                . "Ak si to nebol ty, nič sa nezmenilo a nemusíš nič robiť. Tvoje súčasné heslo stále platí.\n",
        ],
    ], $user['language'] ?? 'en');

    return sendMail($user['email'], $text['subject'], $text['body']);
}
