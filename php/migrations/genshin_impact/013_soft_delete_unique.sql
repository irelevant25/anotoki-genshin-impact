-----------------------------------------------------------
-- A DELETED ROW SHOULD NOT BLOCK THE ONE REPLACING IT
--
-- Saving an entity whole does not diff its children, it replaces them: every
-- constellation, talent, cost and drop is marked deleted and inserted again.
-- That is fine until one of those tables has a unique constraint, because a
-- constraint does not know what `deleted` means. The row that was just
-- soft-deleted still occupies (character 42, level 1), so re-inserting level 1
-- collides with it.
--
-- Which made editing impossible rather than awkward: saving a character with
-- constellations, a material with groups, a weapon with ascensions or an enemy
-- with drops came back 409 every time, on the first save and every one after.
--
-- Each constraint below becomes the same rule over the rows that still exist.
-- Nothing about what may be stored changes - two live rows still cannot share
-- a key - only that history stops counting as a claim on one.
--
-- Root tables keep their plain constraints: a name is unique across a table
-- whether or not a row is deleted, and nothing replaces those wholesale.
-----------------------------------------------------------

-- banners_characters (banner_id, character_id)
ALTER TABLE "banners_characters" DROP CONSTRAINT IF EXISTS "uq_banners_characters_banner_character";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_banners_characters_banner_character" ON "banners_characters" (banner_id, character_id) WHERE deleted = FALSE;

-- banners_weapons (banner_id, weapon_id)
ALTER TABLE "banners_weapons" DROP CONSTRAINT IF EXISTS "uq_banners_weapons_banner_weapon";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_banners_weapons_banner_weapon" ON "banners_weapons" (banner_id, weapon_id) WHERE deleted = FALSE;

-- characters_ascensions (character_id, phase)
ALTER TABLE "characters_ascensions" DROP CONSTRAINT IF EXISTS "uq_characters_ascensions_character_phase";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_characters_ascensions_character_phase" ON "characters_ascensions" (character_id, phase) WHERE deleted = FALSE;

-- characters_ascensions_cost (character_ascension_id, material_id)
ALTER TABLE "characters_ascensions_cost" DROP CONSTRAINT IF EXISTS "uq_characters_ascensions_cost_character_ascension_material";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_characters_ascensions_cost_character_ascension_material" ON "characters_ascensions_cost" (character_ascension_id, material_id) WHERE deleted = FALSE;

-- characters_constellations (character_id, level)
ALTER TABLE "characters_constellations" DROP CONSTRAINT IF EXISTS "uq_characters_constellations_character_level";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_characters_constellations_character_level" ON "characters_constellations" (character_id, level) WHERE deleted = FALSE;

-- characters_talents (character_id, name, type)
ALTER TABLE "characters_talents" DROP CONSTRAINT IF EXISTS "uq_characters_talents_character_name_type";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_characters_talents_character_name_type" ON "characters_talents" (character_id, name, type) WHERE deleted = FALSE;

-- characters_talents_cost (character_id, level, material_id)
ALTER TABLE "characters_talents_cost" DROP CONSTRAINT IF EXISTS "uq_characters_talents_cost_character_level";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_characters_talents_cost_character_level" ON "characters_talents_cost" (character_id, level, material_id) WHERE deleted = FALSE;

-- enemies_damage_types_elements (enemy_phase_id, damage_type_element)
ALTER TABLE "enemies_damage_types_elements" DROP CONSTRAINT IF EXISTS "uq_enemies_damage_types_elements_enemy_phase_damage_type_elemen";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_enemies_damage_types_elements_enemy_phase_damage_type_elemen" ON "enemies_damage_types_elements" (enemy_phase_id, damage_type_element) WHERE deleted = FALSE;

-- materials_groups_join (material_id, "group")
ALTER TABLE "materials_groups_join" DROP CONSTRAINT IF EXISTS "uq_materials_groups_join_material_group";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_materials_groups_join_material_group" ON "materials_groups_join" (material_id, "group") WHERE deleted = FALSE;

-- weapons_ascensions (weapon_id, phase)
ALTER TABLE "weapons_ascensions" DROP CONSTRAINT IF EXISTS "uq_weapons_ascensions_weapon_phase";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_weapons_ascensions_weapon_phase" ON "weapons_ascensions" (weapon_id, phase) WHERE deleted = FALSE;

-- weapons_ascensions_cost (weapon_ascension_id, material_id)
ALTER TABLE "weapons_ascensions_cost" DROP CONSTRAINT IF EXISTS "uq_weapons_ascensions_cost_weapon_ascension_material";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_weapons_ascensions_cost_weapon_ascension_material" ON "weapons_ascensions_cost" (weapon_ascension_id, material_id) WHERE deleted = FALSE;
