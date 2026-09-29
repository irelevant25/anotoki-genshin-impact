-----------------------------------------------------------
-- WHICH ENTITY A CHANGE BELONGS TO
--
-- record_id has always held the id of the row that changed, and that is the
-- right thing for it to hold. It is just not the question anybody asks.
-- Editing one character rewrites its talents, its ascension costs and its
-- voice overs - dozens of rows across a dozen tables, each logged under its
-- own table and its own id, none of which says "character 42". The log could
-- answer "what happened to talent 900" and could not answer "what happened to
-- Amber".
--
-- These two columns are that second answer, and the audit screen filters on
-- them. A /full save sets the entity once and every write underneath inherits
-- it - see api/audit_scope.php - so nothing has to be worked out afterwards.
--
-- The backfill below does have to work it out afterwards, and can only do so
-- where the row is still there to be joined to. A /full save deletes and
-- re-inserts its children, so most historical child ids no longer exist and
-- those rows keep a null entity: the log knows what changed, and no longer
-- knows what it belonged to. Everything written from here on does.
-----------------------------------------------------------

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_table VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100);

-- What the audit screen filters on.
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_table, entity_id);

-- ── A root entity is its own ─────────────────────────────────────────────
--
-- Anything the manifest does not call a child: a character, a weapon, a file.
UPDATE audit_logs SET entity_table = table_name, entity_id = record_id
 WHERE entity_table IS NULL
   AND table_name NOT IN ('artifacts_pieces', 'banners_characters', 'banners_weapons', 'enemies_phases', 'enemies_drops', 'enemies_damage_types_elements', 'foods_recipe', 'materials_groups_join', 'characters_ascensions', 'characters_ascensions_cost', 'characters_constellations', 'characters_relationships', 'characters_roles', 'characters_talents', 'characters_talents_cost', 'characters_voice_overs', 'weapons_ascensions', 'weapons_ascensions_cost', 'weapons_refinements');

-- ── A child belongs to whatever it hangs off ─────────────────────────────

-- artifacts_pieces -> artifacts
UPDATE audit_logs a SET entity_table = 'artifacts', entity_id = r.root_id::text
  FROM (SELECT "artifacts_pieces".id AS child_id, "artifacts".id AS root_id
          FROM "artifacts_pieces"
          JOIN "artifacts" ON "artifacts".id = "artifacts_pieces"."artifact_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'artifacts_pieces'
   AND a.record_id = r.child_id::text;

-- banners_characters -> banners
UPDATE audit_logs a SET entity_table = 'banners', entity_id = r.root_id::text
  FROM (SELECT "banners_characters".id AS child_id, "banners".id AS root_id
          FROM "banners_characters"
          JOIN "banners" ON "banners".id = "banners_characters"."banner_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'banners_characters'
   AND a.record_id = r.child_id::text;

-- banners_weapons -> banners
UPDATE audit_logs a SET entity_table = 'banners', entity_id = r.root_id::text
  FROM (SELECT "banners_weapons".id AS child_id, "banners".id AS root_id
          FROM "banners_weapons"
          JOIN "banners" ON "banners".id = "banners_weapons"."banner_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'banners_weapons'
   AND a.record_id = r.child_id::text;

-- enemies_phases -> enemies
UPDATE audit_logs a SET entity_table = 'enemies', entity_id = r.root_id::text
  FROM (SELECT "enemies_phases".id AS child_id, "enemies".id AS root_id
          FROM "enemies_phases"
          JOIN "enemies" ON "enemies".id = "enemies_phases"."enemy_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'enemies_phases'
   AND a.record_id = r.child_id::text;

-- enemies_drops -> enemies
UPDATE audit_logs a SET entity_table = 'enemies', entity_id = r.root_id::text
  FROM (SELECT "enemies_drops".id AS child_id, "enemies".id AS root_id
          FROM "enemies_drops"
          JOIN "enemies" ON "enemies".id = "enemies_drops"."enemy_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'enemies_drops'
   AND a.record_id = r.child_id::text;

-- enemies_damage_types_elements -> enemies (2 hops)
UPDATE audit_logs a SET entity_table = 'enemies', entity_id = r.root_id::text
  FROM (SELECT "enemies_damage_types_elements".id AS child_id, "enemies".id AS root_id
          FROM "enemies_damage_types_elements"
          JOIN "enemies_phases" ON "enemies_phases".id = "enemies_damage_types_elements"."enemy_phase_id"
          JOIN "enemies" ON "enemies".id = "enemies_phases"."enemy_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'enemies_damage_types_elements'
   AND a.record_id = r.child_id::text;

-- foods_recipe -> foods
UPDATE audit_logs a SET entity_table = 'foods', entity_id = r.root_id::text
  FROM (SELECT "foods_recipe".id AS child_id, "foods".id AS root_id
          FROM "foods_recipe"
          JOIN "foods" ON "foods".id = "foods_recipe"."food_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'foods_recipe'
   AND a.record_id = r.child_id::text;

-- materials_groups_join -> materials
UPDATE audit_logs a SET entity_table = 'materials', entity_id = r.root_id::text
  FROM (SELECT "materials_groups_join".id AS child_id, "materials".id AS root_id
          FROM "materials_groups_join"
          JOIN "materials" ON "materials".id = "materials_groups_join"."material_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'materials_groups_join'
   AND a.record_id = r.child_id::text;

-- characters_ascensions -> characters
UPDATE audit_logs a SET entity_table = 'characters', entity_id = r.root_id::text
  FROM (SELECT "characters_ascensions".id AS child_id, "characters".id AS root_id
          FROM "characters_ascensions"
          JOIN "characters" ON "characters".id = "characters_ascensions"."character_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'characters_ascensions'
   AND a.record_id = r.child_id::text;

-- characters_ascensions_cost -> characters (2 hops)
UPDATE audit_logs a SET entity_table = 'characters', entity_id = r.root_id::text
  FROM (SELECT "characters_ascensions_cost".id AS child_id, "characters".id AS root_id
          FROM "characters_ascensions_cost"
          JOIN "characters_ascensions" ON "characters_ascensions".id = "characters_ascensions_cost"."character_ascension_id"
          JOIN "characters" ON "characters".id = "characters_ascensions"."character_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'characters_ascensions_cost'
   AND a.record_id = r.child_id::text;

-- characters_constellations -> characters
UPDATE audit_logs a SET entity_table = 'characters', entity_id = r.root_id::text
  FROM (SELECT "characters_constellations".id AS child_id, "characters".id AS root_id
          FROM "characters_constellations"
          JOIN "characters" ON "characters".id = "characters_constellations"."character_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'characters_constellations'
   AND a.record_id = r.child_id::text;

-- characters_relationships -> characters
UPDATE audit_logs a SET entity_table = 'characters', entity_id = r.root_id::text
  FROM (SELECT "characters_relationships".id AS child_id, "characters".id AS root_id
          FROM "characters_relationships"
          JOIN "characters" ON "characters".id = "characters_relationships"."character_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'characters_relationships'
   AND a.record_id = r.child_id::text;

-- characters_roles -> characters
UPDATE audit_logs a SET entity_table = 'characters', entity_id = r.root_id::text
  FROM (SELECT "characters_roles".id AS child_id, "characters".id AS root_id
          FROM "characters_roles"
          JOIN "characters" ON "characters".id = "characters_roles"."character_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'characters_roles'
   AND a.record_id = r.child_id::text;

-- characters_talents -> characters
UPDATE audit_logs a SET entity_table = 'characters', entity_id = r.root_id::text
  FROM (SELECT "characters_talents".id AS child_id, "characters".id AS root_id
          FROM "characters_talents"
          JOIN "characters" ON "characters".id = "characters_talents"."character_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'characters_talents'
   AND a.record_id = r.child_id::text;

-- characters_talents_cost -> characters
UPDATE audit_logs a SET entity_table = 'characters', entity_id = r.root_id::text
  FROM (SELECT "characters_talents_cost".id AS child_id, "characters".id AS root_id
          FROM "characters_talents_cost"
          JOIN "characters" ON "characters".id = "characters_talents_cost"."character_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'characters_talents_cost'
   AND a.record_id = r.child_id::text;

-- characters_voice_overs -> characters
UPDATE audit_logs a SET entity_table = 'characters', entity_id = r.root_id::text
  FROM (SELECT "characters_voice_overs".id AS child_id, "characters".id AS root_id
          FROM "characters_voice_overs"
          JOIN "characters" ON "characters".id = "characters_voice_overs"."character_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'characters_voice_overs'
   AND a.record_id = r.child_id::text;

-- weapons_ascensions -> weapons
UPDATE audit_logs a SET entity_table = 'weapons', entity_id = r.root_id::text
  FROM (SELECT "weapons_ascensions".id AS child_id, "weapons".id AS root_id
          FROM "weapons_ascensions"
          JOIN "weapons" ON "weapons".id = "weapons_ascensions"."weapon_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'weapons_ascensions'
   AND a.record_id = r.child_id::text;

-- weapons_ascensions_cost -> weapons (2 hops)
UPDATE audit_logs a SET entity_table = 'weapons', entity_id = r.root_id::text
  FROM (SELECT "weapons_ascensions_cost".id AS child_id, "weapons".id AS root_id
          FROM "weapons_ascensions_cost"
          JOIN "weapons_ascensions" ON "weapons_ascensions".id = "weapons_ascensions_cost"."weapon_ascension_id"
          JOIN "weapons" ON "weapons".id = "weapons_ascensions"."weapon_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'weapons_ascensions_cost'
   AND a.record_id = r.child_id::text;

-- weapons_refinements -> weapons
UPDATE audit_logs a SET entity_table = 'weapons', entity_id = r.root_id::text
  FROM (SELECT "weapons_refinements".id AS child_id, "weapons".id AS root_id
          FROM "weapons_refinements"
          JOIN "weapons" ON "weapons".id = "weapons_refinements"."weapon_id"
       ) r
 WHERE a.entity_table IS NULL
   AND a.table_name = 'weapons_refinements'
   AND a.record_id = r.child_id::text;
