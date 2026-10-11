<?php

/**
 * Which entity a change belongs to, as opposed to which row it touched.
 *
 * An entry's target (target_type, target_id in the anotoki library's
 * anotoki_audit_log - audit_logs' table_name and record_id before
 * genshin_impact/028) has always been the row that changed, and that is the
 * right thing for it to hold. It is just not the question anybody asks.
 * Editing one character rewrites its talents, its ascension costs, its voice
 * overs - dozens of rows across a dozen tables, each logged under its own
 * table and its own id, none of which says "character 42". So the log could
 * answer "what happened to talent 900" and could not answer "what happened to
 * Amber", which is the only one worth asking.
 *
 * The scope (scope_type, scope_id; entity_table and entity_id before) is that
 * second answer. For a change to a character it is the character; for a
 * change to one of its talent costs it is still the character. Filtering by
 * it gives the whole history of one thing, which is what the audit screen is
 * for.
 *
 * Two ways it gets filled. A `/full` save knows which entity it is saving, so
 * it says so with auditScope() and every write underneath inherits it. Anything
 * else - a plain create, a file being catalogued - is its own entity, and
 * auditContent() (api/audit_log.php) falls back to the row it just wrote. Who
 * made the change and from which sign-in is the library's to hold for the
 * request (AuditContextMiddleware, api/index.php).
 */

/**
 * child table => [parent table, the column pointing at it]
 *
 * Only the tables that hang off something. Anything absent is a root: it is its
 * own entity, and the walk below stops there. Costs sit two hops down - a
 * talent cost belongs to a talent, which belongs to a character - and that is
 * why this resolves by walking rather than by a single lookup.
 */
function auditParentMap(): array
{
    return [
        'artifacts_pieces' => ['artifacts', 'artifact_id'],
        'banners_characters' => ['banners', 'banner_id'],
        'banners_weapons' => ['banners', 'banner_id'],
        'enemies_phases' => ['enemies', 'enemy_id'],
        'enemies_drops' => ['enemies', 'enemy_id'],
        'enemies_damage_types_elements' => ['enemies_phases', 'enemy_phase_id'],
        'foods_recipe' => ['foods', 'food_id'],
        'materials_groups_join' => ['materials', 'material_id'],
        'characters_ascensions' => ['characters_ascensions_sets', 'ascension_set_id'],
        'characters_ascensions_cost' => ['characters_ascensions', 'character_ascension_id'],
        'characters_constellations' => ['characters_constellations_sets', 'constellation_set_id'],
        'characters_relationships' => ['characters', 'character_id'],
        'characters_roles' => ['characters', 'character_id'],
        'characters_talents' => ['characters_talents_sets', 'talent_set_id'],
        // Straight to the talent set, not through a talent - talent costs are a
        // flat per-set list, unlike the ascension costs that hang off a row.
        'characters_talents_cost' => ['characters_talents_sets', 'talent_set_id'],
        'characters_voice_overs' => ['characters_voice_overs_sets', 'voice_over_set_id'],
        'weapons_ascensions' => ['weapons', 'weapon_id'],
        'weapons_ascensions_cost' => ['weapons_ascensions', 'weapon_ascension_id'],
        'weapons_refinements' => ['weapons', 'weapon_id'],
    ];
}

/**
 * The entity every write in this request belongs to, until it is cleared.
 *
 * Called with a table and an id to set it, with nothing to read it, and with
 * null to clear it. A `/full` handler sets it around the save and clears it
 * afterwards, so the children it re-inserts are filed under the thing being
 * edited rather than each under itself.
 */
function auditScope(?string $table = null, ?string $id = null, bool $clear = false): ?array
{
    static $scope = null;

    if ($clear) {
        $scope = null;
        return null;
    }

    if ($table !== null) {
        $scope = ['table' => $table, 'id' => (string) $id];
    }

    return $scope;
}

/** Runs a save with everything it writes filed under one entity. */
function withAuditScope(string $table, ?string $id, callable $work): mixed
{
    auditScope($table, $id);

    try {
        return $work();
    } finally {
        auditScope(clear: true);
    }
}
