<?php

// ---------------------------------------------------------------------------
// config/visitors.php - the limits on playing without signing in, and whose
// word a request's address is taken on
// ---------------------------------------------------------------------------
// While the IAM does not require signing in here, somebody who plays without
// signing in keeps their games and statistics on the server as a visitor
// (api/visitors.php). How many visitors there may be, how fast new ones may
// come, how much one may keep and how long an unused one is kept are the
// numbers below. Each has a default that suits the hosting; an installation
// may change any of them in the OPTIONAL config/visitors.local.php -
// gitignored like every *.local.php, never written by setup.php, put on the
// host by hand (FTP) when it is wanted at all:
//
//   <?php return [
//       'visitors' => ['max_visitors' => 500, 'keep_days' => 30],
//       'client_address' => ['trusted_proxies' => []],   // a host that is not behind Cloudflare
//   ];
//
// client_address is where every limit that counts per address reads it - the
// visitors' here, and the anotoki library's (feedback, the error log, the
// pages' error reports), which api/client_address.php hands the same rule.
//
//   visitors.max_visitors              visitors with a key, at once (1000); a
//                                      full site refuses NEW visitors only
//   visitors.new_per_hour_per_address  new visitors an hour from one address -
//                                      an IPv4 address, or an IPv6 /64 (10)
//   visitors.new_per_hour              new visitors an hour in all (60)
//   visitors.max_results               the answers one visitor's statistics
//                                      keep (5000)
//   visitors.state_max_bytes           the size of one saved game of a visitor
//                                      (16384 bytes of JSON)
//   visitors.keep_days                 a visitor unseen this many days is
//                                      deleted with everything of theirs (30);
//                                      the pages say the same number
//   visitors.sweep_batch               visitors deleted in one transaction (20)
//   visitors.sweep_timeout_ms          the time one statement of the sweep may
//                                      take (2000)
//   visitors.sweep_budget_ms           the time one whole sweep may take (5000)
//   visitors.move_lock_timeout_ms      how long moving a visitor's games into
//                                      an account at sign-in waits for a row
//                                      another request holds (5000)
//   client_address.trusted_proxies     the proxies whose CF-Connecting-IP names
//                                      a request's address: CIDR ranges or
//                                      single addresses. Cloudflare's published
//                                      ranges (below): the site is behind
//                                      Cloudflare - without them every visitor
//                                      would count as Cloudflare's edge. [] -
//                                      REMOTE_ADDR is the address - on a host
//                                      that is not.
//
// The header is Cloudflare's CF-Connecting-IP, always, and no setting (the
// owner's rule of 2026-10-11): one address the proxy writes whole. Another a
// visitor could have sent through Cloudflare untouched (X-Real-IP,
// True-Client-IP, X-Forwarded-For) is never read.
//
// Every value is checked, because a hand-written file is where a typo lands
// and some typos are costly - keep_days 0 would delete every visitor at the
// next sweep. A whole number out of its range, a number written as a string:
// that value keeps its default, and the PHP log says so (once, not on every
// request). A client_address or a trusted_proxies that is no list trusts no
// proxy until it is mended - never Cloudflare's ranges by default. A proxy entry that is not an address
// or a CIDR range is dropped, and so is one that takes in nearly everybody (an
// IPv4 range wider than a /8, an IPv6 one wider than a /16: 0.0.0.0/0 would
// let anybody name their own address). A key nobody reads is reported too. A
// file that cannot be read cleanly (config/local.php: it does not start with
// <?php, it prints, PHP cannot read it) leaves the visitors' limits at their
// defaults and TRUSTS NO PROXY - every request counts as the address it came
// from - until it is mended: it may be the very file that said [] for a host
// that is not behind Cloudflare, and Cloudflare's ranges believed then would
// be looser than its owner meant (coarser, never looser; the anotoki family's
// rule of 2026-10-18). It never makes the site "not set up".
// ---------------------------------------------------------------------------

require_once __DIR__ . '/local.php';

/** The defaults: what an installation without config/visitors.local.php runs on. */
const VISITOR_SETTING_DEFAULTS = [
    'visitors' => [
        'max_visitors' => 1000,
        'new_per_hour_per_address' => 10,
        'new_per_hour' => 60,
        'max_results' => 5000,
        'state_max_bytes' => 16384,
        'keep_days' => 30,
        'sweep_batch' => 20,
        'sweep_timeout_ms' => 2000,
        'sweep_budget_ms' => 5000,
        'move_lock_timeout_ms' => 5000,
    ],
    // The site is behind Cloudflare (the owner's decision of 2026-10-11), so
    // its published ranges are the proxies whose CF-Connecting-IP is believed -
    // from https://www.cloudflare.com/ips-v4 and /ips-v6, fetched 2026-10-11
    // (15 IPv4, 7 IPv6), the anotoki library's ClientAddress::CLOUDFLARE as
    // well (tests/addresses.test.php holds them equal). They change rarely:
    // refresh them from those two addresses when Cloudflare announces a change.
    // From anywhere else the connection's own address is counted.
    'client_address' => [
        'trusted_proxies' => [
            '173.245.48.0/20',
            '103.21.244.0/22',
            '103.22.200.0/22',
            '103.31.4.0/22',
            '141.101.64.0/18',
            '108.162.192.0/18',
            '190.93.240.0/20',
            '188.114.96.0/20',
            '197.234.240.0/22',
            '198.41.128.0/17',
            '162.158.0.0/15',
            '104.16.0.0/13',
            '104.24.0.0/14',
            '172.64.0.0/13',
            '131.0.72.0/22',
            '2400:cb00::/32',
            '2606:4700::/32',
            '2803:f800::/32',
            '2405:b500::/32',
            '2405:8100::/32',
            '2a06:98c0::/29',
            '2c0f:f248::/32',
        ],
    ],
];

/**
 * The narrowest a trusted proxy's range may be written as wide: an IPv4 range
 * of /8 or longer, an IPv6 one of /16 or longer. A wider one - 0.0.0.0/0,
 * ::/0 - is no proxy's: it would believe the header from anybody.
 */
const VISITOR_PROXY_WIDEST = [4 => 8, 16 => 16];

/**
 * The range each whole number must be in, both ends included. 0 is allowed
 * where it means "none": no new visitors (the limits and the ceiling), no
 * answers kept. keep_days and the batch never 0 - a sweep of everybody, a
 * sweep of nobody - and a time is never 0 (PostgreSQL reads a timeout of 0 as
 * "no timeout"). The upper ends only keep a number inside what PostgreSQL's
 * integer and its timeouts take.
 */
const VISITOR_SETTING_RANGES = [
    'max_visitors' => [0, 1_000_000],
    'new_per_hour_per_address' => [0, 1_000_000],
    'new_per_hour' => [0, 1_000_000],
    'max_results' => [0, 10_000_000],
    'state_max_bytes' => [1, 1_048_576],
    'keep_days' => [1, 3650],
    'sweep_batch' => [1, 200],
    'sweep_timeout_ms' => [1, 600_000],
    'sweep_budget_ms' => [1, 600_000],
    'move_lock_timeout_ms' => [1, 600_000],
];

/**
 * The settings this request runs on: config/visitors.local.php's values over
 * the defaults, each one checked (visitorSettingsFrom()). Worked out once a
 * request; what was wrong with the file goes to the PHP log
 * (visitorSettingsReport()).
 *
 * @return array{visitors: array<string, int>, client_address: array{trusted_proxies: string[]}}
 */
function visitorSettings(): array
{
    static $settings = null;

    if ($settings === null) {
        $error = localConfigError('visitors');
        if ($error !== null) {
            // Passed over: the limits' defaults, and no proxy believed - never Cloudflare's ranges by default, which a
            // host not behind Cloudflare would have said [] to in this very file.
            $result = ['settings' => VISITOR_SETTING_DEFAULTS, 'problems' => [
                "config/visitors.local.php cannot be read cleanly ({$error}): the visitors' limits keep their defaults, and no proxy is trusted - every request counts as the address it came from - until it is mended",
            ]];
            $result['settings']['client_address']['trusted_proxies'] = [];
        } else {
            $result = visitorSettingsFrom(localConfig('visitors'));
        }
        $settings = $result['settings'];
        visitorSettingsReport($result['problems']);
    }

    return $settings;
}

/**
 * The settings from what config/visitors.local.php returned ($values: null
 * when there is no such file), and a sentence for each value that was not
 * used. A pure function: the checks are tried by handing it values.
 *
 * @return array{settings: array, problems: string[]}
 */
function visitorSettingsFrom(mixed $values): array
{
    $settings = VISITOR_SETTING_DEFAULTS;
    $problems = [];

    if ($values === null) {
        return ['settings' => $settings, 'problems' => []];
    }
    if (!is_array($values)) {
        // Read cleanly but no array - a forgotten `return`, and require hands back 1: what it meant to say may have
        // been [] for the proxies of a host not behind Cloudflare, so none is trusted until it is mended (coarser,
        // never looser), and the limits keep their defaults.
        $settings['client_address']['trusted_proxies'] = [];

        return [
            'settings' => $settings,
            'problems' => ['config/visitors.local.php returns ' . get_debug_type($values) . ', not an array: the visitors\' limits keep their defaults, and no proxy is trusted - every request counts as the address it came from - until it is mended'],
        ];
    }

    foreach (array_keys($values) as $section) {
        if (!array_key_exists($section, VISITOR_SETTING_DEFAULTS)) {
            $problems[] = "'$section' is not a section of config/visitors.local.php (visitors, client_address): ignored";
        }
    }

    $visitors = $values['visitors'] ?? [];
    if (!is_array($visitors)) {
        $problems[] = "'visitors' is " . get_debug_type($visitors) . ', not an array: every visitors.* default holds';
        $visitors = [];
    }
    foreach ($visitors as $name => $value) {
        if (!array_key_exists($name, VISITOR_SETTING_RANGES)) {
            $problems[] = "visitors.$name is not a setting: ignored";
            continue;
        }
        [$least, $most] = VISITOR_SETTING_RANGES[$name];
        if (!is_int($value) || $value < $least || $value > $most) {
            $problems[] = "visitors.$name must be a whole number from $least to $most, not "
                . visitorSettingShown($value) . ': the default ' . VISITOR_SETTING_DEFAULTS['visitors'][$name] . ' holds';
            continue;
        }
        $settings['visitors'][$name] = $value;
    }

    // A section or a list that is no list meant to say something about the proxies: none is trusted until it is
    // mended - never Cloudflare's ranges by default (coarser, never looser).
    $address = $values['client_address'] ?? [];
    if (!is_array($address)) {
        $problems[] = "'client_address' is " . get_debug_type($address) . ', not an array: no proxy is trusted until it is mended';
        $settings['client_address']['trusted_proxies'] = [];
        $address = [];
    }
    foreach (array_keys($address) as $name) {
        if ($name === 'client_ip_header') {
            $problems[] = 'client_address.client_ip_header is no setting: the header is Cloudflare\'s CF-Connecting-IP, always (the owner\'s rule) - ignored';
        } elseif (!array_key_exists($name, VISITOR_SETTING_DEFAULTS['client_address'])) {
            $problems[] = "client_address.$name is not a setting: ignored";
        }
    }

    if (array_key_exists('trusted_proxies', $address)) {
        $proxies = $address['trusted_proxies'];
        if (!is_array($proxies)) {
            $problems[] = 'client_address.trusted_proxies must be a list of addresses or CIDR ranges, not '
                . visitorSettingShown($proxies) . ': no proxy is trusted until it is mended';
            $settings['client_address']['trusted_proxies'] = [];
        } else {
            $kept = [];
            foreach ($proxies as $range) {
                $range = is_string($range) ? trim($range) : $range;
                if (!is_string($range) || !visitorSettingRangeWellFormed($range)) {
                    $problems[] = 'client_address.trusted_proxies holds ' . visitorSettingShown($range)
                        . ', which is not an address or a CIDR range: dropped';
                    continue;
                }
                if (visitorSettingRangeCatchAll($range)) {
                    $problems[] = 'client_address.trusted_proxies holds ' . visitorSettingShown($range)
                        . ', wider than any proxy\'s range (a /8 or narrower for IPv4, a /16 or narrower for IPv6) - believed'
                        . ' from so many, the header would be whatever a sender likes: dropped';
                    continue;
                }
                $kept[] = $range;
            }
            $settings['client_address']['trusted_proxies'] = array_values(array_unique($kept));
        }
    }

    return ['settings' => $settings, 'problems' => $problems];
}

/** An address (IPv4 or IPv6) alone, or with a prefix length that fits it: 10.0.0.0/8, 2400:cb00::/32. */
function visitorSettingRangeWellFormed(string $range): bool
{
    $parts = explode('/', $range);
    if (count($parts) > 2) {
        return false;
    }
    $address = @inet_pton($parts[0]);
    if ($address === false || filter_var($parts[0], FILTER_VALIDATE_IP) === false) {
        return false;
    }
    if (count($parts) === 1) {
        return true;
    }

    return preg_match('/^\d{1,3}$/D', $parts[1]) === 1 && (int) $parts[1] <= strlen($address) * 8;
}

/**
 * Whether a well-formed range is wider than any proxy's (VISITOR_PROXY_WIDEST):
 * 0.0.0.0/0, ::/0, 10.0.0.0/7, 2400::/15. A bare address is one address.
 */
function visitorSettingRangeCatchAll(string $range): bool
{
    $parts = explode('/', $range);
    if (count($parts) === 1) {
        return false;
    }
    $bytes = strlen((string) @inet_pton($parts[0]));

    return (int) $parts[1] < (VISITOR_PROXY_WIDEST[$bytes] ?? PHP_INT_MAX);
}

/** A value from the file as the log shows it - short, and never more than a value. */
function visitorSettingShown(mixed $value): string
{
    $shown = is_scalar($value) || $value === null ? var_export($value, true) : get_debug_type($value);

    return strlen($shown) > 60 ? substr($shown, 0, 57) . '...' : $shown;
}

/**
 * What was wrong with config/visitors.local.php, to the PHP log - once, not
 * on every request: the sentences are remembered (their hash, in
 * storage/cache/visitors-settings-reported) and the same ones are not written
 * again until they change. Fixing the file and breaking it again reports it
 * again. A storage that cannot be written reports on every request, which is
 * noisy but never silent.
 */
function visitorSettingsReport(array $problems): void
{
    $marker = dirname(__DIR__) . '/storage/cache/visitors-settings-reported';
    $said = $problems === [] ? '' : hash('sha256', implode("\n", $problems));

    clearstatcache(true, $marker);
    $before = is_file($marker) ? (string) @file_get_contents($marker) : '';
    if ($said === $before) {
        return;
    }
    foreach ($problems as $problem) {
        error_log('[visitors] ' . $problem);
    }
    if (!is_dir(dirname($marker))) {
        @mkdir(dirname($marker), 0775, true);
    }
    @file_put_contents($marker, $said, LOCK_EX);
}
