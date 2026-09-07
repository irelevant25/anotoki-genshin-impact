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

/**
 * How long an emailed sign-in code lasts.
 *
 * Shorter than either link, because it is six digits rather than 256 bits and
 * because it is typed straight away or not at all - nobody comes back to a
 * sign-in code an hour later.
 */
const MAIL_LOGIN_CODE_MINUTES = 10;

/** Why a message was sent - stored in email_log, and how the log is filtered. */
const MAIL_KIND_CONFIRMATION = 'confirmation';
const MAIL_KIND_PASSWORD_RESET = 'password_reset';
const MAIL_KIND_LOGIN_CODE = 'login_code';

/**
 * The kinds whose subject carries nothing secret and is safe to keep in the log.
 * Default-deny: a kind not listed here is logged with no subject, so a sign-in
 * code - which lives in that message's subject - is never persisted, and a new
 * kind has to be judged safe on purpose before its subject is stored.
 */
const MAIL_SUBJECT_SAFE_KINDS = [MAIL_KIND_CONFIRMATION, MAIL_KIND_PASSWORD_RESET];

/**
 * Which address a message goes out as - the keys of `senders` in config/mail.php.
 * `noreply` is the automated, do-not-reply address; `support` is the one a person
 * may reply to. A message with no sender set uses `noreply`.
 */
const MAIL_SENDER_NOREPLY = 'noreply';
const MAIL_SENDER_SUPPORT = 'support';

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
 * The `from` address and display name for a sender key, from config/mail.php's
 * `senders`. Falls back to the single top-level `from`/`from_name` when the key
 * is not configured, so a config written before there were two still sends.
 *
 * @return array{from: string, from_name: string}
 */
function mailSender(string $sender): array
{
    $config = mailConfig();
    $defaultFrom = (string) ($config['from'] ?? 'noreply@localhost');
    $defaultName = (string) ($config['from_name'] ?? '');
    $entry = $config['senders'][$sender] ?? null;

    return is_array($entry)
        ? ['from' => (string) ($entry['from'] ?? $defaultFrom), 'from_name' => (string) ($entry['from_name'] ?? $defaultName)]
        : ['from' => $defaultFrom, 'from_name' => $defaultName];
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
function sendMail(string $to, string $subject, string $body, string $kind = 'other', ?int $userId = null, string $sender = MAIL_SENDER_NOREPLY): bool
{
    $config = mailConfig();
    $resolved = mailSender($sender);
    $from = $resolved['from'];
    $fromName = $resolved['from_name'];

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
        $ok = @mail($to, mailEncodeSubject($subject), $body, implode("\n", $headers));
    } else {
        $ok = mailToFile($to, $subject, $body, $headers);
    }

    logEmail($to, $kind, $subject, $ok, $userId);

    return $ok;
}

/**
 * Records one send in email_log, for the admin Email Log page.
 *
 * Never throws: a message that went out (or a driver that refused it) must not
 * be undone by the log failing to write. The subject is kept only for
 * subject-safe kinds - everything else is logged with none, so a live sign-in
 * code cannot end up in the table.
 */
function logEmail(string $to, string $kind, string $subject, bool $ok, ?int $userId): void
{
    try {
        $safeSubject = in_array($kind, MAIL_SUBJECT_SAFE_KINDS, true) ? $subject : null;
        usersDb()
            ->prepare('INSERT INTO email_log (recipient, kind, subject, status, user_id) VALUES (?, ?, ?, ?, ?)')
            ->execute([$to, $kind, $safeSubject, $ok ? 'sent' : 'failed', $userId]);
    } catch (\Throwable $e) {
        error_log('[email_log] could not record a send: ' . $e->getMessage());
    }
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

    // From support@ - a welcome is the one account mail a person might reply to.
    return sendMail($user['email'], $text['subject'], $text['body'], MAIL_KIND_CONFIRMATION, $user['id'] ?? null, MAIL_SENDER_SUPPORT);
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

    return sendMail($user['email'], $text['subject'], $text['body'], MAIL_KIND_PASSWORD_RESET, $user['id'] ?? null);
}

/**
 * "Here is your code" - the message sent when somebody asks to sign in by
 * email rather than with a password.
 *
 * The code is in the subject line as well as the body. It is six digits typed
 * into a form on another screen, and having it in the notification saves
 * opening the message at all.
 */
function sendLoginCodeMail(array $user, string $code): bool
{
    $text = mailText([
        'en' => [
            'subject' => "Your Anotoki sign-in code: $code",
            'body' => "Hello {$user['username']},\n\n"
                . "Your sign-in code is:\n\n"
                . "    $code\n\n"
                . 'It is good for ' . MAIL_LOGIN_CODE_MINUTES . " minutes and can only be used once.\n\n"
                . "If you did not ask to sign in, you can ignore this message. Nobody can get in with this code unless they can also read this mailbox.\n",
        ],
        'sk' => [
            'subject' => "Tvoj prihlasovací kód na Anotoki: $code",
            'body' => "Ahoj {$user['username']},\n\n"
                . "Tvoj prihlasovací kód je:\n\n"
                . "    $code\n\n"
                . 'Platí ' . MAIL_LOGIN_CODE_MINUTES . " minút a dá sa použiť len raz.\n\n"
                . "Ak si o prihlásenie nežiadal, túto správu môžeš ignorovať. S týmto kódom sa nikto nedostane dnu, pokiaľ nevie čítať aj túto schránku.\n",
        ],
    ], $user['language'] ?? 'en');

    return sendMail($user['email'], $text['subject'], $text['body'], MAIL_KIND_LOGIN_CODE, $user['id'] ?? null);
}
