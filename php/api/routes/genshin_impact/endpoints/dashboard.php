<?php

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
    ['label' => 'Characters with no talents',     'table' => 'characters', 'related' => 'characters_talents',        'column' => 'character_id', 'route' => 'characters'],
    ['label' => 'Characters with no constellations', 'table' => 'characters', 'related' => 'characters_constellations', 'column' => 'character_id', 'route' => 'characters'],
    ['label' => 'Characters with no ascension',   'table' => 'characters', 'related' => 'characters_ascensions',     'column' => 'character_id', 'route' => 'characters'],
    ['label' => 'Characters with no voice overs', 'table' => 'characters', 'related' => 'characters_voice_overs',    'column' => 'character_id', 'route' => 'characters'],
    ['label' => 'Weapons with no refinements',    'table' => 'weapons',    'related' => 'weapons_refinements',       'column' => 'weapon_id',    'route' => 'weapons'],
    ['label' => 'Weapons with no ascension',      'table' => 'weapons',    'related' => 'weapons_ascensions',        'column' => 'weapon_id',    'route' => 'weapons'],
    ['label' => 'Artifacts with no pieces',       'table' => 'artifacts',  'related' => 'artifacts_pieces',          'column' => 'artifact_id',  'route' => 'artifacts'],
    ['label' => 'Enemies with no drops',          'table' => 'enemies',    'related' => 'enemies_drops',             'column' => 'enemy_id',     'route' => 'enemies'],
    ['label' => 'Enemies with no phases',         'table' => 'enemies',    'related' => 'enemies_phases',            'column' => 'enemy_id',     'route' => 'enemies'],
    ['label' => 'Banners with nothing in them',   'table' => 'banners',    'related' => 'banners_characters',        'column' => 'banner_id',    'route' => 'banners', 'related2' => 'banners_weapons'],
];

/** Empty columns worth chasing. Not every blank is a gap, so this is a list, not a scan. */
const DASHBOARD_BLANKS = [
    ['label' => 'Characters with no demo music',  'table' => 'characters', 'column' => 'demo_music',   'route' => 'characters'],
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
        $second = isset($gap['related2'])
            ? " AND NOT EXISTS (SELECT 1 FROM {$gap['related2']} r2 WHERE r2.{$gap['column']} = t.id AND r2.deleted = false)"
            : '';

        $missing = (int) $pdo->query(
            "SELECT count(*) FROM {$gap['table']} t
             WHERE t.deleted = false
               AND NOT EXISTS (SELECT 1 FROM {$gap['related']} r WHERE r.{$gap['column']} = t.id AND r.deleted = false)"
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

    // ── Feedback ─────────────────────────────────────────────────────────────
    $feedback = [
        'total'  => (int) $pdo->query('SELECT count(*) FROM feedback')->fetchColumn(),
        'new'    => (int) $pdo->query("SELECT count(*) FROM feedback WHERE status = 'new'")->fetchColumn(),
        'last7'  => (int) $pdo->query("SELECT count(*) FROM feedback WHERE created_at >= now() - interval '7 days'")->fetchColumn(),
        'last30' => (int) $pdo->query("SELECT count(*) FROM feedback WHERE created_at >= now() - interval '30 days'")->fetchColumn(),
        'byType' => [],
    ];
    foreach ($pdo->query('SELECT type, count(*) AS total FROM feedback GROUP BY type ORDER BY total DESC') as $row) {
        $feedback['byType'][] = ['type' => $row['type'], 'total' => (int) $row['total']];
    }

    // ── Recent editing ───────────────────────────────────────────────────────
    //
    // A count of the whole audit trail is not worth showing: it is dominated by
    // the bulk import that filled the database and never changes shape again.
    // What is useful is what happened lately and where it left off.
    $activity = [
        'today'  => (int) $pdo->query("SELECT count(*) FROM audit_logs WHERE changed_at >= current_date")->fetchColumn(),
        'last7'  => (int) $pdo->query("SELECT count(*) FROM audit_logs WHERE changed_at >= now() - interval '7 days'")->fetchColumn(),
        'last30' => (int) $pdo->query("SELECT count(*) FROM audit_logs WHERE changed_at >= now() - interval '30 days'")->fetchColumn(),
        'recent' => [],
    ];

    $recent = $pdo->query(
        'SELECT id, table_name, record_id, action, changed_by, changed_at
         FROM audit_logs ORDER BY changed_at DESC, id DESC LIMIT 12'
    )->fetchAll();

    // Names come from the other database, so they are resolved in one go.
    $userIds = array_filter(array_unique(array_column($recent, 'changed_by')));
    $names = [];
    if ($userIds) {
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $stmt = usersDb()->prepare("SELECT id, username FROM users WHERE id IN ($placeholders)");
        $stmt->execute(array_values($userIds));
        foreach ($stmt->fetchAll() as $user) {
            $names[$user['id']] = $user['username'];
        }
    }
    foreach ($recent as &$row) {
        $row['changed_by_username'] = $names[$row['changed_by']] ?? null;
    }
    unset($row);
    $activity['recent'] = $recent;

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
        'generated_at' => '',
        'age' => 0,
    ];
    try {
        $stats = assetStats();
        $assets = [
            'total_files' => $stats['total_files'],
            'total_bytes' => $stats['total_bytes'],
            // The three biggest, which is all a dashboard card has room for.
            'formats' => array_slice($stats['formats'], 0, 3),
            'images' => $stats['images'] + ['can_convert' => mediaCanWriteAvif()],
            'audio' => $stats['audio'] + ['can_convert' => mediaCanWriteOpus()],
            'generated_at' => $stats['generated_at'],
            'age' => assetStatsAge() ?? 0,
        ];
    } catch (\Throwable $e) {
        // An unreadable assets folder is a reason for one empty card, not for
        // a dashboard that will not load.
        error_log('[dashboard] asset stats unavailable: ' . $e->getMessage());
    }

    return respondJson($response, [
        'content'      => $content,
        'gaps'         => $gaps,
        'feedback'     => $feedback,
        'activity'     => $activity,
        'translations' => $translations,
        'assets'       => $assets,
    ]);
})->add(responds(DashboardStats::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());
