<?php

// ---------------------------------------------------------------------------
// config/cloudflare.php - the origin secret: whether a request came through
// the owner's Cloudflare zone
// ---------------------------------------------------------------------------
// Cloudflare's published ranges (config/visitors.php's trusted proxies) are
// every Cloudflare customer's, not the owner's zone alone: anybody's Worker
// can open a connection to this host from them and write the CF-Connecting-IP
// it likes - a new address for every request, past every limit that counts
// per address. So a Transform Rule of the owner's zone adds a secret header,
// X-Anotoki-Origin (the anotoki library's ClientAddress::ORIGIN_HEADER), to
// every request through it (the owner's decision of 2026-10-13), and this
// site, given the same value, believes CF-Connecting-IP only on a request
// that carries it - api/client_address.php, and the library's own reading
// through the AdminContext (api/admin_tools.php). Any other request from
// Cloudflare counts as the edge it came from: coarser, never looser.
//
// The value lives in the OPTIONAL config/cloudflare.local.php - the same file
// in every anotoki site, gitignored like every *.local.php, never written or
// read by setup.php, never in build-dist.php's upload: put on the host by hand
// (FTP), with the same value in the Cloudflare rule:
//
//   <?php return ['origin_secret' => '<a long random value, 32 characters or more>'];
//
// Without it there is no secret, and CF-Connecting-IP is believed from the
// trusted proxies alone, as before: deleting the file is the one way to switch
// the secret off. A file that is there but gives no usable secret FAILS
// CLOSED: its secret is one no request carries, so every request from
// Cloudflare's ranges counts as the edge it came from until the file is
// mended. That is one that cannot be read cleanly - it does not start with
// <?php (a byte-order mark, a blank line, no <?php line: never compiled), it
// prints (text after a closing tag), or PHP cannot read it (config/local.php)
// - and, since 2026-10-18, one read cleanly whose origin_secret is not a
// string with something in it (blank, not an array, a misspelt or another key
// in its place, a number, a forgotten return), and anything else in the
// file's place, a folder too. Its owner meant a secret; believing
// CF-Connecting-IP from Cloudflare's ranges alone - every Cloudflare
// customer's - would be the looser reading (the IAM's rule of 2026-10-13, the
// anotoki family's; for a file read cleanly, the owner's "do as you think is
// the best" of 2026-10-18). Either way the site keeps running: the file never
// makes it "not set up". What was wrong goes to the PHP log, once (not on
// every request) - never the value, nor what PHP said of a file it could not
// run, which can quote it, nor a key of the file's, which a slip could have
// made the secret.
// ---------------------------------------------------------------------------

require_once __DIR__ . '/local.php';

/**
 * The origin secret this request runs on, or null when there is none - when
 * there is no config/cloudflare.local.php at all. Worked out once a request;
 * what was wrong with the file goes to the PHP log (originSecretReport()).
 *
 * Anything at the file's path counts as the file, a folder too (file_exists(),
 * where the settings reader asks is_file()), and a file that gives no usable
 * secret is a secret no request carries (originSecretUnmatchable()) - fails
 * closed, never "no secret": one passed over (localConfigError(): it does not
 * start with <?php, it prints, or PHP cannot read it), and one read cleanly
 * that names no secret (originSecretFrom()'s null).
 */
function originSecret(): ?string
{
    static $done = false;
    static $secret = null;

    if (!$done) {
        $done = true;
        $file = localConfigPath('cloudflare');
        if (!file_exists($file)) {
            originSecretReport([]);
        } else {
            $error = is_file($file) ? localConfigError('cloudflare') : 'is not a file (a folder, or something else, in its place)';
            if ($error !== null) {
                $secret = originSecretUnmatchable();
                originSecretReport([
                    "config/cloudflare.local.php cannot be read cleanly ({$error}): no request carries its secret, so every request from Cloudflare's ranges counts as the edge it came from until the file is mended",
                ]);
            } else {
                $result = originSecretFrom(localConfig('cloudflare'));
                $secret = $result['secret'] ?? originSecretUnmatchable();
                originSecretReport($result['problems']);
            }
        }
    }

    return $secret;
}

/**
 * A secret no request can carry: 256 random bits, made once a process and
 * never printed, logged or stored anywhere, so no X-Anotoki-Origin matches it
 * (the library compares in constant time).
 */
function originSecretUnmatchable(): string
{
    static $secret = null;

    return $secret ??= bin2hex(random_bytes(32));
}

/** What the log is told of a file read cleanly that names no usable secret: it fails closed, and how to switch it off. */
const ORIGIN_SECRET_NONE = 'no request carries its secret, so every request from Cloudflare\'s ranges counts as the edge it came from until the file names one - deleting the file switches the secret off';

/**
 * The secret from what a config/cloudflare.local.php that is there, read
 * cleanly, returned ($values - null too, for a file that says `return null;`),
 * and a sentence for what was not used - never the value itself. Null for the
 * secret: the file names no usable one, and originSecret() fails closed on it
 * (a secret no request carries) - never "no secret", which is the file's
 * absence alone. A pure function: the checks are tried by handing it values.
 *
 * @return array{secret: ?string, problems: string[]}
 */
function originSecretFrom(mixed $values): array
{
    if (!is_array($values)) {
        return [
            'secret' => null,
            'problems' => ['config/cloudflare.local.php returns ' . get_debug_type($values) . ', not an array: ' . ORIGIN_SECRET_NONE],
        ];
    }

    $problems = [];
    if (array_diff(array_keys($values), ['origin_secret']) !== []) {
        $problems[] = 'config/cloudflare.local.php holds a key that is no setting (origin_secret is the one): ignored';
    }
    $secret = $values['origin_secret'] ?? null;
    if (!is_string($secret) || trim($secret) === '') {
        $problems[] = 'origin_secret must be a string with something in it, not ' . (is_string($secret) ? 'an empty one' : get_debug_type($secret)) . ': ' . ORIGIN_SECRET_NONE;

        return ['secret' => null, 'problems' => $problems];
    }

    // A header's value never starts or ends with a space: one pasted in with a line's end around it is the same secret.
    return ['secret' => trim($secret), 'problems' => $problems];
}

/**
 * What was wrong with config/cloudflare.local.php, to the PHP log - once, not
 * on every request, config/visitors.php's way: the sentences are remembered
 * (their hash, in storage/cache/cloudflare-settings-reported) and the same
 * ones are not written again until they change. They never carry the secret.
 * A storage that cannot be written reports on every request, which is noisy
 * but never silent.
 */
function originSecretReport(array $problems): void
{
    $marker = dirname(__DIR__) . '/storage/cache/cloudflare-settings-reported';
    $said = $problems === [] ? '' : hash('sha256', implode("\n", $problems));

    clearstatcache(true, $marker);
    $before = is_file($marker) ? (string) @file_get_contents($marker) : '';
    if ($said === $before) {
        return;
    }
    foreach ($problems as $problem) {
        error_log('[cloudflare] ' . $problem);
    }
    if (!is_dir(dirname($marker))) {
        @mkdir(dirname($marker), 0775, true);
    }
    @file_put_contents($marker, $said, LOCK_EX);
}
