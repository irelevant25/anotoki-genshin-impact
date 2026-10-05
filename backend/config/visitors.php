<?php

// ---------------------------------------------------------------------------
// config/visitors.php - the limits on playing without signing in
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
//       'client_address' => ['trusted_proxies' => ['173.245.48.0/20', '2400:cb00::/32']],
//   ];
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
//   client_address.trusted_proxies     the proxies whose header names the
//                                      visitor's address: CIDR ranges or single
//                                      addresses ([] - REMOTE_ADDR is the
//                                      address). Behind Cloudflare's proxy this
//                                      is Cloudflare's published ranges, or
//                                      every visitor counts as Cloudflare.
//   client_address.client_ip_header    that header (CF-Connecting-IP)
//
// Every value is checked, because a hand-written file is where a typo lands
// and some typos are costly - keep_days 0 would delete every visitor at the
// next sweep. A whole number out of its range, a number written as a string,
// a list that is not a list: that value keeps its default, and the PHP log
// says so (once, not on every request). A proxy entry that is not an address
// or a CIDR range is dropped. A key nobody reads is reported too. A file that
// cannot be read at all leaves every default standing - it never makes the
// site "not set up".
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
    'client_address' => [
        'trusted_proxies' => [],
        'client_ip_header' => 'CF-Connecting-IP',
    ],
];

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
 * @return array{visitors: array<string, int>, client_address: array{trusted_proxies: string[], client_ip_header: string}}
 */
function visitorSettings(): array
{
    static $settings = null;

    if ($settings === null) {
        $problems = [];
        $error = localConfigError('visitors');
        if ($error !== null) {
            $problems[] = 'config/visitors.local.php cannot be read, so every default holds: ' . $error;
            $result = ['settings' => VISITOR_SETTING_DEFAULTS, 'problems' => []];
        } else {
            $result = visitorSettingsFrom(localConfig('visitors'));
        }
        $settings = $result['settings'];
        visitorSettingsReport(array_merge($problems, $result['problems']));
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
        return [
            'settings' => $settings,
            'problems' => ['config/visitors.local.php returns ' . get_debug_type($values) . ', not an array, so every default holds'],
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

    $address = $values['client_address'] ?? [];
    if (!is_array($address)) {
        $problems[] = "'client_address' is " . get_debug_type($address) . ', not an array: no proxy is trusted';
        $address = [];
    }
    foreach (array_keys($address) as $name) {
        if (!array_key_exists($name, VISITOR_SETTING_DEFAULTS['client_address'])) {
            $problems[] = "client_address.$name is not a setting: ignored";
        }
    }

    if (array_key_exists('trusted_proxies', $address)) {
        $proxies = $address['trusted_proxies'];
        if (!is_array($proxies)) {
            $problems[] = 'client_address.trusted_proxies must be a list of addresses or CIDR ranges, not '
                . visitorSettingShown($proxies) . ': no proxy is trusted';
        } else {
            $kept = [];
            foreach ($proxies as $range) {
                $range = is_string($range) ? trim($range) : $range;
                if (!is_string($range) || !visitorSettingRangeWellFormed($range)) {
                    $problems[] = 'client_address.trusted_proxies holds ' . visitorSettingShown($range)
                        . ', which is not an address or a CIDR range: dropped';
                    continue;
                }
                $kept[] = $range;
            }
            $settings['client_address']['trusted_proxies'] = array_values(array_unique($kept));
        }
    }

    if (array_key_exists('client_ip_header', $address)) {
        $header = $address['client_ip_header'];
        if (!is_string($header) || preg_match('/^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/D', trim($header)) !== 1) {
            $problems[] = 'client_address.client_ip_header must be a header name, not ' . visitorSettingShown($header)
                . ': ' . VISITOR_SETTING_DEFAULTS['client_address']['client_ip_header'] . ' holds';
        } else {
            $settings['client_address']['client_ip_header'] = trim($header);
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
