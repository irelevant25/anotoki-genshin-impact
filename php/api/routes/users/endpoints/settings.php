<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * The switches an admin can throw without a deploy.
 *
 *   GET /api/settings/public   what the site needs before it can draw itself
 *   GET /api/settings          the whole table, for the form
 *   PUT /api/settings          save whatever changed
 *
 * The reads are split because the audiences are. A visitor needs to know
 * whether there is a site to draw and gets exactly that; an admin needs the
 * table with its types and its history and has to be an admin to see it.
 * Keeping them apart is what makes the first one safe to serve to anybody.
 *
 * The write is one request for the whole form rather than one per switch.
 * Maintenance mode and the message on the maintenance page are one decision
 * made in one place, and saving them separately means a window - however
 * short - where the site is closed and the sign is blank.
 */

/** Reads every switch, with the name of whoever last touched it. */
function adminSettingRows(): array
{
    $statement = usersDb()->prepare(
        'SELECT s.name, s.group_name, s.type, s.options, s.value, s.sort_order, s.updated_at, u.username AS updated_by
           FROM site_settings s
           LEFT JOIN users u ON u.id = s.updated_by
          WHERE s.site = ?
          ORDER BY s.sort_order ASC, s.name ASC'
    );
    $statement->execute([currentSite()]);

    return array_map(static fn(array $row): array => [
        'name' => $row['name'],
        'group_name' => $row['group_name'],
        'type' => $row['type'],
        // Split here rather than in the browser: the comma is this column's
        // business, and a form should be handed a list.
        'options' => $row['options'] === null || $row['options'] === ''
            ? []
            : array_map('trim', explode(',', (string) $row['options'])),
        'value' => $row['value'],
        'updated_at' => $row['updated_at'],
        'updated_by' => $row['updated_by'],
    ], $statement->fetchAll(PDO::FETCH_ASSOC));
}

/**
 * Why this value is not allowed for this setting, or null when it is.
 *
 * The column is text and the type is a declaration beside it, so this is the
 * only thing standing between the form and a `disabled_routes` of "yes". It
 * checks shape rather than meaning: a route name nothing recognises is a
 * section that is off and does not exist, which is harmless, but a value that
 * will not parse would have every reader of the table falling back to its
 * default and wondering why the switch does nothing.
 */
function settingValueRefusal(array $setting, string $value): ?string
{
    switch ($setting['type']) {
        case 'boolean':
            return in_array($value, ['true', 'false'], true)
                ? null
                : "{$setting['name']} is a switch - expected 'true' or 'false'";

        case 'choice':
            return in_array($value, $setting['options'], true)
                ? null
                : "{$setting['name']} must be one of: " . implode(', ', $setting['options']);

        case 'i18n':
            $decoded = json_decode($value, true);
            if (!is_array($decoded) || array_is_list($decoded)) {
                return "{$setting['name']} is one message per language - expected an object keyed by language code";
            }
            foreach ($decoded as $text) {
                if (!is_string($text)) {
                    return "{$setting['name']} holds text, and one of those was not text";
                }
            }
            return null;

        case 'routes':
            $decoded = json_decode($value, true);
            if (!is_array($decoded) || !array_is_list($decoded)) {
                return "{$setting['name']} is a list of sections";
            }
            foreach ($decoded as $section) {
                if (!is_string($section)) {
                    return "{$setting['name']} is a list of section names";
                }
            }
            return null;

        default:
            return null;
    }
}

// ── GET /api/settings/public ─────────────────────────────────────────────────
//
// Open, and asked once at start-up before anything else. It has to be: the
// first decision the site makes is whether to draw itself at all, and it
// cannot make that after drawing itself. This is also why it survives
// maintenance mode - see maintenanceGate(), which lets it through.

$app->get('/api/settings/public', function (Request $request, Response $response) {
    return respondJson($response, publicSiteSettings());
})->add(responds(PublicSiteSettings::class));

// ── GET /api/settings ────────────────────────────────────────────────────────

$app->get('/api/settings', function (Request $request, Response $response) {
    return respondJson($response, ['settings' => adminSettingRows()]);
})->add(responds(SiteSettingList::class))->add(requireRole('ADMIN'))->add(requireAuth());

// ── PUT /api/settings ────────────────────────────────────────────────────────
//
// Takes only the switches that changed, and takes them together. A name that
// has no row is refused rather than inserted: the settings that exist are
// declared in a migration, so an unknown one is a typo or a client from a
// different version, and quietly creating it would leave a switch in the table
// that nothing reads.

$app->put('/api/settings', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $incoming = $body['settings'] ?? null;

    if (!is_array($incoming)) {
        return respondJson($response, ['error' => 'settings must be a list of { name, value }'], 422);
    }

    $pdo = usersDb();
    $user = $request->getAttribute('user');

    $known = [];
    foreach (adminSettingRows() as $row) {
        $known[$row['name']] = $row;
    }

    // Everything is checked before anything is written. Half a saved form is
    // worse than a refused one: these switches are read together, and
    // "maintenance on, message rejected" is the one combination that must not
    // reach the table.
    $changes = [];
    foreach ($incoming as $entry) {
        $name = (string) ($entry['name'] ?? '');

        if (!isset($known[$name])) {
            return respondJson($response, ['error' => "There is no setting called '$name'"], 422);
        }

        $value = (string) ($entry['value'] ?? '');

        if ($refusal = settingValueRefusal($known[$name], $value)) {
            return respondJson($response, ['error' => $refusal], 422);
        }

        // Unchanged values are dropped here rather than written and
        // overwritten, so `updated_at` keeps saying when the switch was
        // actually last thrown instead of when somebody last pressed Save.
        if ($value !== (string) $known[$name]['value']) {
            $changes[$name] = $value;
        }
    }

    if ($changes !== []) {
        $pdo->beginTransaction();
        try {
            $statement = $pdo->prepare(
                'UPDATE site_settings SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE site = ? AND name = ?'
            );

            foreach ($changes as $name => $value) {
                $statement->execute([$value, (int) $user['id'], currentSite(), $name]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        // This request has already read the old values once, and is about to
        // answer with the new ones.
        siteSettingsForget();
    }

    return respondJson($response, ['settings' => adminSettingRows()]);
})->add(responds(SiteSettingList::class))->add(requireRole('ADMIN'))->add(requireAuth());
