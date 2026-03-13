-- Migration: 003_migration_20260311_005826.sql
-- Generated: 2026-03-11 00:58:26

CREATE TABLE IF NOT EXISTS "enemy_groups" (
  "name" VARCHAR(50) PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS "enemies_damage_types_elements" (
  "id" SERIAL PRIMARY KEY,
  "enemy_id" VARCHAR(100) NOT NULL,
  "damage_type_element" VARCHAR(50) NOT NULL,
  "order" SMALLINT NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "created_by" INT NOT NULL,
  "updated_at" TIMESTAMP,
  "updated_by" INT
);
ALTER TABLE "enemy_families" ALTER COLUMN "name" TYPE VARCHAR(50) PRIMARY KEY;
ALTER TABLE "enemies" DROP COLUMN "damage_type_element";
ALTER TABLE "enemies" DROP COLUMN "other_elements";
ALTER TABLE "enemies" ALTER COLUMN "living_being_family" TYPE VARCHAR(50);
ALTER TABLE "enemies" ALTER COLUMN "living_being_family" SET NOT NULL;
ALTER TABLE "enemies" ALTER COLUMN "living_being_group" TYPE VARCHAR(50);
