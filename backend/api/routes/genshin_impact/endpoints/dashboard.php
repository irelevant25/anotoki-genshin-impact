<?php

use Anotoki\Lib\Admin\Schema as AdminSchema;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Everything the admin dashboard shows, in one request.
 *
 *   GET /api/dashboard/stats
 *
 * The dashboard answers two questions: what needs attention now, and what is
 * still missing from the database. It is not a report on how much data there
 * is - that number never changes usefully - so most of what follows is counts
 * of things that are *absent*.
 */

/**
 * Records with no related rows of a kind they ought to have.
 *
 * Each entry is a headline, the table to count, the related table, and the
 * column joining them. `related2` adds a second table that also counts, for
 * rows that are only really empty when both are missing.
 *
 * Every one of these has to be a real editing job or it is noise. Two checks
 * were dropped for failing that: foods often have no recipe by design, and
 * "banners with no characters" was counting every weapon banner as incomplete.
 */
const DASHBOARD_GAPS = [
    ['label' => 'Characters with no build',       'table' => 'characters', 'related' => 'characters_builds',         'column' => 'character_id', 'route' => 'characters'],
    ['label' => 'Characters with no talents',     'table' => 'characters', 'related' => 'characters_talents',        'column' => 'talent_set_id',        'localColumn' => 'talent_set_id',        'route' => 'characters'],
    ['label' => 'Characters with no constellations', 'table' => 'characters', 'related' => 'characters_constellations', 'column' => 'constellation_set_id', 'localColumn' => 'constellation_set_id', 'route' => 'characters'],
    ['label' => 'Characters with no ascension',   'table' => 'characters', 'related' => 'characters_ascensions',     'column' => 'ascension_set_id',  'localColumn' => 'ascension_set_id',  'route' => 'characters'],
    ['label' => 'Characters with no voice overs', 'table' => 'characters', 'related' => 'characters_voice_overs',    'column' => 'voice_over_set_id', 'localColumn' => 'voice_over_set_id', 'route' => 'characters'],
    ['label' => 'Weapons with no refinements',    'table' => 'weapons',    'related' => 'weapons_refinements',       'column' => 'weapon_id',    'route' => 'weapons'],
    ['label' => 'Weapons with no ascension',      'table' => 'weapons',    'related' => 'weapons_ascensions',        'column' => 'weapon_id',    'route' => 'weapons'],
    ['label' => 'Artifacts with no pieces',       'table' => 'artifacts',  'related' => 'artifacts_pieces',          'column' => 'artifact_id',  'route' => 'artifacts'],
    ['label' => 'Enemies with no drops',          'table' => 'enemies',    'related' => 'enemies_drops',             'column' => 'enemy_id',     'route' => 'enemies'],
    ['label' => 'Enemies with no phases',         'table' => 'enemies',    'related' => 'enemies_phases',            'column' => 'enemy_id',     'route' => 'enemies'],
    ['label' => 'Banners with nothing in them',   'table' => 'banners',    'related' => 'banners_characters',        'column' => 'banner_id',    'route' => 'banners', 'related2' => 'banners_weapons'],
];

/** Empty columns worth chasing. Not every blank is a gap, so this is a list, not a scan. */
const DASHBOARD_BLANKS = [
    ['label' => 'Characters with no demo music',  'table' => 'characters', 'column' => 'demo_music_file_id', 'route' => 'characters'],
    ['label' => 'Characters with no birthday',    'table' => 'characters', 'column' => 'birthday',     'route' => 'characters'],
    ['label' => 'Characters with no region',      'table' => 'characters', 'column' => 'region',       'route' => 'characters'],
    ['label' => 'Characters with no release date','table' => 'characters', 'column' => 'release_date', 'route' => 'characters'],
];

const DASHBOARD_CONTENT = [
    ['label' => 'Characters', 'table' => 'characters', 'route' => 'characters', 'icon' => 'icon-swords'],
    ['label' => 'Enemies',    'table' => 'enemies',    'route' => 'enemies',    'icon' => 'icon-skull'],
    ['label' => 'Weapons',    'table' => 'weapons',    'route' => 'weapons',    'icon' => 'icon-sword'],
    ['label' => 'Artifacts',  'table' => 'artifacts',  'route' => 'artifacts',  'icon' => 'icon-ring'],
    ['label' => 'Materials',  'table' => 'materials',  'route' => 'materials',  'icon' => 'icon-boxes'],
    ['label' => 'Foods',      'table' => 'foods',      'route' => 'foods',      'icon' => 'icon-utensils'],
    ['label' => 'Banners',    'table' => 'banners',    'route' => 'banners',    'icon' => 'icon-scroll'],
];

/**
 * The feedback card: how much there is, how much is new, lately, and by kind
 * (bug, idea, other) - off the library's table, anotoki_feedback.
 */
function dashboardFeedback(PDO $pdo): array
{
    $counts = $pdo->query(
        "SELECT count(*) AS total,
                count(*) FILTER (WHERE status = 'new') AS new,
                count(*) FILTER (WHERE created_at >= now() - interval '7 days') AS last7,
                count(*) FILTER (WHERE created_at >= now() - interval '30 days') AS last30
           FROM anotoki_feedback"
    )->fetch();
    $feedback = [
        'total' => (int) $counts['total'],
        'new' => (int) $counts['new'],
        'last7' => (int) $counts['last7'],
        'last30' => (int) $counts['last30'],
        'byType' => [],
    ];
    foreach ($pdo->query('SELECT kind, count(*) AS total FROM anotoki_feedback GROUP BY kind ORDER BY total DESC, kind') as $row) {
        $feedback['byType'][] = ['type' => $row['kind'], 'total' => (int) $row['total']];
    }

    return $feedback;
}

/**
 * Recent editing: what happened lately and where it left off - off the
 * library's audit log (the content's writes, the catalogue's, the words', the
 * admin tools' own). A count of the whole log is not worth showing: it is
 * dominated by the bulk import that filled the database and never changes
 * shape again.
 */
function dashboardActivity(): array
{
    $audit = siteAudit();
    $today = new DateTimeImmutable('today');
    $latest = $audit->latest(12);
    $names = peopleNamesById(array_values(array_filter(array_column($latest, 'actor_id'), 'is_int')));

    return [
        'today' => $audit->countSince($today),
        'last7' => $audit->countSince(new DateTimeImmutable('-7 days')),
        'last30' => $audit->countSince(new DateTimeImmutable('-30 days')),
        // In the shape the card has always read: the table and the row an entry
        // is about, the action (content.update, catalogue.insert, backup.created,
        // ...), when, and who.
        'recent' => array_map(static fn (array $entry): array => [
            'id' => $entry['id'],
            'table_name' => (string) ($entry['target_type'] ?? ''),
            'record_id' => (string) ($entry['target_id'] ?? ''),
            'action' => $entry['action'],
            'changed_at' => $entry['created_at'],
            'changed_by_username' => $entry['actor_id'] === null ? null : ($names[$entry['actor_id']] ?? null),
        ], $latest),
    ];
}

$app->get('/api/dashboard/stats', function (Request $request, Response $response) {
    $pdo = genshinDb();

    // ── What there is ────────────────────────────────────────────────────────
    $content = [];
    foreach (DASHBOARD_CONTENT as $entry) {
        $content[] = $entry + [
            'total' => (int) $pdo->query("SELECT count(*) FROM {$entry['table']} WHERE deleted = false")->fetchColumn(),
        ];
    }

    // ── What is missing ──────────────────────────────────────────────────────
    $gaps = [];
    foreach (DASHBOARD_GAPS as $gap) {
        $total = (int) $pdo->query("SELECT count(*) FROM {$gap['table']} WHERE deleted = false")->fetchColumn();
        // Most gaps join the child to the parent's id; the set-backed ones
        // (voice-overs, ascensions) join on the parent's *_set_id instead.
        $local = $gap['localColumn'] ?? 'id';
        $second = isset($gap['related2'])
            ? " AND NOT EXISTS (SELECT 1 FROM {$gap['related2']} r2 WHERE r2.{$gap['column']} = t.{$local} AND r2.deleted = false)"
            : '';

        $missing = (int) $pdo->query(
            "SELECT count(*) FROM {$gap['table']} t
             WHERE t.deleted = false
               AND NOT EXISTS (SELECT 1 FROM {$gap['related']} r WHERE r.{$gap['column']} = t.{$local} AND r.deleted = false)"
            . $second
        )->fetchColumn();

        $gaps[] = [
            'label'   => $gap['label'],
            'route'   => $gap['route'],
            'missing' => $missing,
            'total'   => $total,
        ];
    }
    foreach (DASHBOARD_BLANKS as $blank) {
        $total = (int) $pdo->query("SELECT count(*) FROM {$blank['table']} WHERE deleted = false")->fetchColumn();
        $missing = (int) $pdo->query(
            "SELECT count(*) FROM {$blank['table']}
             WHERE deleted = false AND ({$blank['column']} IS NULL OR {$blank['column']}::text = '')"
        )->fetchColumn();

        $gaps[] = [
            'label'   => $blank['label'],
            'route'   => $blank['route'],
            'missing' => $missing,
            'total'   => $total,
        ];
    }

    // Biggest job first, and nothing that is already done.
    $gaps = array_values(array_filter($gaps, fn($gap) => $gap['missing'] > 0));
    usort($gaps, fn($a, $b) => $b['missing'] <=> $a['missing']);

    // ── Feedback and recent editing: the ADMIN's ─────────────────────────────
    //
    // Both are read off the anotoki library's admin tools - feedback and the
    // audit log - which are the site's ADMIN's alone (the owner's decision:
    // EDITORs see none of them). An EDITOR's dashboard has neither (null), and
    // the content gaps, the words and the assets as before.
    $isAdmin = isAdminUser($request->getAttribute('user'));
    $feedback = $isAdmin && AdminSchema::has($pdo, AdminSchema::FEEDBACK_TABLE) ? dashboardFeedback($pdo) : null;
    $activity = $isAdmin && siteAudit()->ready() ? dashboardActivity() : null;

    // ── Translations ─────────────────────────────────────────────────────────
    $translations = ['keys' => 0, 'languages' => []];
    try {
        $users = usersDb();
        $translations['keys'] = (int) $users->query('SELECT count(*) FROM translation_keys')->fetchColumn();

        $stmt = $users->query(
            'SELECT l.code, l.name, l.native_name, l.enabled, count(t.key_name) AS translated
             FROM languages l LEFT JOIN translations t ON t.language_code = l.code
             GROUP BY l.code, l.name, l.native_name, l.enabled, l.sort_order
             ORDER BY l.sort_order'
        );
        foreach ($stmt as $row) {
            $translations['languages'][] = [
                'code'        => $row['code'],
                'name'        => $row['name'],
                'native_name' => $row['native_name'],
                'enabled'     => (bool) $row['enabled'],
                'translated'  => (int) $row['translated'],
            ];
        }
    } catch (\PDOException) {
        // Localization has its own migrations; a dashboard is no reason to fail
        // if they have not been run here yet.
    }

    // ── Assets ───────────────────────────────────────────────────────────────
    // Cached for a day, because it is a walk over sixty-odd thousand files.
    // Read here rather than recomputed: the dashboard is the page somebody
    // opens first, and it should not be the page that pays for the walk any
    // more often than the Files page does.
    $assets = [
        'total_files' => 0,
        'total_bytes' => 0,
        'formats' => [],
        'images' => ['sources' => 0, 'missing' => 0, 'converted_only' => 0, 'can_convert' => false],
        'audio' => ['sources' => 0, 'missing' => 0, 'converted_only' => 0, 'can_convert' => false],
        'catalogue' => ['on_disk' => 0, 'catalogued' => 0, 'uncatalogued' => 0, 'unfiled' => 0, 'missing' => 0],
        'generated_at' => '',
        'age' => 0,
    ];
    try {
        // Only what has already been worked out. Building it here would make
        // whoever opens the dashboard first after a day wait five seconds for
        // a walk over fifty thousand files; the Files page does that walk, and
        // an upload or a sweep refreshes it. Until then the card says it has
        // not been surveyed rather than making the page pay.
        $stats = assetStatsCached();
        $counts = catalogueCountsCached();
        if ($stats === null) {
            throw new RuntimeException('no survey yet');
        }
        $assets = [
            'total_files' => $stats['total_files'],
            'total_bytes' => $stats['total_bytes'],
            // All of them. There are five extensions in the whole tree, and
            // sending three meant AVIF - the format the site actually serves -
            // was the one the dashboard never mentioned.
            'formats' => $stats['formats'],
            'images' => $stats['images'] + ['can_convert' => mediaCanWriteAvif()],
            'audio' => $stats['audio'] + ['can_convert' => mediaCanWriteOpus()],
            'catalogue' => $counts ?? $assets['catalogue'],
            'generated_at' => $stats['generated_at'],
            'age' => assetStatsAge() ?? 0,
        ];
    } catch (\Throwable $e) {
        // Nothing surveyed yet, or an unreadable assets folder: one empty card,
        // not a dashboard that will not load.
        error_log('[dashboard] asset stats unavailable: ' . $e->getMessage());
    }

    // ── Visitors ─────────────────────────────────────────────────────────────
    // People playing without signing in (api/visitors.php), against the
    // ceiling that turns new ones away - so a site filling up is seen here
    // before anybody is refused. Nothing to count while users/045 waits.
    $visitors = [
        'available' => visitorsReady(),
        'count'     => 0,
        'results'   => 0,
        'max'       => visitorSetting('max_visitors'),
        'keep_days' => visitorSetting('keep_days'),
    ];
    if ($visitors['available']) {
        $visitors['count'] = (int) usersDb()->query('SELECT count(*) FROM users WHERE id < 0')->fetchColumn();
        $visitors['results'] = (int) $pdo->query('SELECT count(*) FROM user_quiz_history WHERE user_id < 0')->fetchColumn();
    }

    return respondJson($response, [
        'content'      => $content,
        'gaps'         => $gaps,
        'feedback'     => $feedback,
        'activity'     => $activity,
        'translations' => $translations,
        'assets'       => $assets,
        'visitors'     => $visitors,
    ]);
})->add(responds(DashboardStats::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());
