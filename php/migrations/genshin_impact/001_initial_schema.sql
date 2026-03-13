-----------------------------------------------------------
-- MIGRATIONS
-- name: Migration
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS migrations (
    id         SERIAL          PRIMARY KEY,
    filename   VARCHAR(255)    NOT NULL UNIQUE,
    applied_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------------------------
-- TRIGGER FUNCTION: auto-update updated_at on row change
-- Requires PostgreSQL 14+ for CREATE OR REPLACE TRIGGER.
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-----------------------------------------------------------
-- PROTECT CREATED FIELDS
-- Requires PostgreSQL 14+ for CREATE OR REPLACE TRIGGER.
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION protect_created_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-----------------------------------------------------------
-- ELEMENTS
-- name: Element
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS elements (
    name    VARCHAR(50)     PRIMARY KEY,
    icon    VARCHAR(100)    NOT NULL
);
INSERT INTO elements (name, icon) VALUES
    ('Anemo', 'assets/elements/Anemo.avif'), ('Geo', 'assets/elements/Geo.avif'), 
    ('Electro', 'assets/elements/Electro.avif'), ('Dendro', 'assets/elements/Dendro.avif'), 
    ('Hydro', 'assets/elements/Hydro.avif'), ('Pyro', 'assets/elements/Pyro.avif'), 
    ('Cryo', 'assets/elements/Cryo.avif')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- WEAPON_TYPES
-- name: WeaponType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS weapon_types (
    name    VARCHAR(50)     PRIMARY KEY,
    icon    VARCHAR(100)    NOT NULL
);
INSERT INTO weapon_types (name, icon) VALUES
    ('Sword', 'assets/weapon_types/Sword.avif'), ('Claymore', 'assets/weapon_types/Claymore.avif'), 
    ('Polearm', 'assets/weapon_types/Polearm.avif'), ('Bow', 'assets/weapon_types/Bow.avif'), 
    ('Catalyst', 'assets/weapon_types/Catalyst.avif')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- VOICE_OVER_TYPES
-- name: VoiceOverType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS voice_over_types (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO voice_over_types (name) VALUES ('story'), ('combat')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- RELATIONSHIP_TYPES
-- name: RelationshipType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS relationship_types (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO relationship_types (name) VALUES
    ('Mother'), ('Grandmother'), ('Father'), ('Grandfather'),
    ('Sister'), ('Brother'), ('Friend'), ('Enemy'),
    ('Ancestor'), ('Relative'), ('Master'), ('Uncle'),
    ('Daughter'), ('Son'), ('Other')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- CHARACTER_STATES
-- name: CharacterState
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS character_states (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO character_states (name) VALUES ('Alive'), ('Deceased'), ('Unknown')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- TALENT_TYPES
-- name: TalentType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS talent_types (
    name VARCHAR(100) PRIMARY KEY
);
INSERT INTO talent_types (name) VALUES
    ('Normal Attack'), ('Elemental Skill'), ('Elemental Burst'), ('Utility Passive'),
    ('1st Ascension Passive'), ('2nd Ascension Passive'), ('3rd Ascension Passive'),
    ('4th Ascension Passive'), ('5th Ascension Passive'), ('6th Ascension Passive'),
    ('Night Realm''s Gift Passive'), ('Passive Talent'), ('Alternate Sprint')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- LANGUAGES
-- name: Language
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS languages (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO languages (name) VALUES
    ('English'), ('Chinese'), ('Japanese'), ('Korean')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- MATERIAL_CATEGORIES
-- name: MaterialCategory
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS material_categories (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO material_categories (name) VALUES
    ('Ascension'), ('Talent'), ('Weapon'), ('Cooking'),
    ('Local Specialty'), ('Monster Drop'), ('Other'), ('Materials')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- REGIONS
-- name: Region
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS regions (
    name    VARCHAR(50)     PRIMARY KEY,
    icon    VARCHAR(100)    NOT NULL
);
INSERT INTO regions (name, icon) VALUES
    ('Mondstadt', 'assets/regions/Mondstadt.avif'), ('Liyue', 'assets/regions/Liyue.avif'), 
    ('Inazuma', 'assets/regions/Inazuma.avif'), ('Sumeru', 'assets/regions/Sumeru.avif'),
    ('Fontaine', 'assets/regions/Fontaine.avif'), ('Natlan', 'assets/regions/Natlan.avif'), 
    ('Nod-Krai', 'assets/regions/Nod-Krai.avif')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- CHARACTER_ROLES
-- name: CharacterRole
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO roles (name) VALUES
    ('Support'), ('Off-field DPS'), ('On-field DPS'), ('Healer'), ('Healer / Support'),
    ('Hydro enabler'), ('Hydro enabler / Support'),
    ('Pyro enabler'), ('Pyro enabler / Support'),
    ('Electro enabler'), ('Electro enabler / Support'),
    ('Cryo enabler'), ('Cryo enabler / Support'),
    ('Geo enabler'), ('Geo enabler / Support'),
    ('Anemo enabler'), ('Anemo enabler / Support'),
    ('Dendro enabler'), ('Dendro enabler / Support')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- ARTIFACT_PIECE_TYPES
-- name: ArtifactPieceType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifact_piece_types (
    name    VARCHAR(50)     PRIMARY KEY,
    icon    VARCHAR(100)    NOT NULL
);
INSERT INTO artifact_piece_types (name, icon) VALUES
    ('Flower of Life', 'assets/artifact_piece_types/Flower of Life.avif'), 
    ('Plume of Death', 'assets/artifact_piece_types/Plume of Death.avif'), 
    ('Sands of Eon', 'assets/artifact_piece_types/Sands of Eon.avif'),
    ('Goblet of Eonothem', 'assets/artifact_piece_types/Goblet of Eonothem.avif'), 
    ('Circlet of Logos', 'assets/artifact_piece_types/Circlet of Logos.avif')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- ENEMY_TYPES
-- name: EnemyType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemy_types (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO enemy_types (name) VALUES
    ('Common Enemies'), ('Elite Enemies'), ('Normal Bosses'), ('Weekly Bosses')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- ENEMY_FAMILIES
-- name: EnemyFamily
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemy_families (
    name VARCHAR(100) PRIMARY KEY
);
INSERT INTO enemy_families (name) VALUES
    ('Automatons'), ('Elemental Lifeforms'), ('Hilichurls'), ('Mystical Beasts'),
    ('The Abyss'), ('Fatui'), ('Enemies of Note'), ('Other Human Factions')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- STATS
-- name: Stat
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS stats (
    name        VARCHAR(50)    PRIMARY KEY
);
INSERT INTO stats (name) VALUES
    ('HP'), ('HP %'),('ATK'), ('ATK %'),('DEF'), ('DEF %'), 
    ('Elemental Mastery'), ('Stamina'), ('Crit Rate %'), ('Crit DMG %'),
    ('Healing Bonus %'), ('Incoming Healing Bonus %'), ('Energy Recharge %'),
    ('Cooldown Reduction %'), ('Shield Strength %'), 
    ('Physical DMG Bonus %'), ('Pyro DMG Bonus %'),
    ('Hydro DMG Bonus %'), ('Electro DMG Bonus %'), ('Cryo DMG Bonus %'),
    ('Anemo DMG Bonus %'), ('Geo DMG Bonus %'), ('Dendro DMG Bonus %'),
    ('Physical RES %'), ('Pyro RES %'), ('Hydro RES %'), ('Electro RES %'),
    ('Cryo RES %'), ('Anemo RES %'), ('Geo RES %'), ('Dendro RES %')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- QUIZZES
-- name: Quiz
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    deleted     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------------------------
-- MATERIALS
-- name: Material
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS materials (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    category        VARCHAR(50)     NOT NULL,
    region          VARCHAR(50),
    how_to_obtain   JSONB,
    version         VARCHAR(10),
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT fk_materials_category   FOREIGN KEY (category)   REFERENCES material_categories(name),
    CONSTRAINT fk_materials_region     FOREIGN KEY (region)     REFERENCES regions(name)
);
CREATE OR REPLACE TRIGGER trg_materials_protect_created
    BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- FOODS
-- name: Food
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS foods (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    description     TEXT,
    effect          TEXT,
    type            VARCHAR(100),
    icon            VARCHAR(100)    NOT NULL,
    rarity          SMALLINT        NOT NULL,
    proficiency     SMALLINT        NOT NULL,
    base_dish_id    INT,
    variant         VARCHAR(100),
    event           VARCHAR(100),
    region          VARCHAR(50),
    how_to_obtain   JSONB,
    effects         JSONB,
    version         VARCHAR(10),
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT fk_foods_region      FOREIGN KEY (region)       REFERENCES regions(name),
    CONSTRAINT fk_foods_base_dish   FOREIGN KEY (base_dish_id) REFERENCES materials(id)
);
CREATE OR REPLACE TRIGGER trg_foods_protect_created
    BEFORE UPDATE ON foods
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_foods_updated_at
    BEFORE UPDATE ON foods
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-----------------------------------------------------------
-- CHARACTERS
-- name: Character
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters (
    id                          SERIAL          PRIMARY KEY,
    name                        VARCHAR(100)    NOT NULL,
    element                     VARCHAR(50)     NOT NULL,
    weapon_type                 VARCHAR(50)     NOT NULL,
    rarity                      SMALLINT        NOT NULL,
    title                       VARCHAR(100),
    secondary_title             VARCHAR(100),
    region                      VARCHAR(100),
    model                       VARCHAR(100)    NOT NULL,
    birthday                    DATE,
    special_dish                INT,
    how_to_obtain               TEXT            NOT NULL,
    is_traveler                 BOOLEAN         NOT NULL DEFAULT FALSE,
    namecard_description        TEXT            NOT NULL,
    namecard_sources            JSONB,
    namecard_icon               VARCHAR(100)    NOT NULL,
    namecard_background         VARCHAR(100)    NOT NULL,
    namecard_banner             VARCHAR(100)    NOT NULL,
    card_icon                   VARCHAR(100)    NOT NULL,
    wish_icon                   VARCHAR(100)    NOT NULL,
    ingame_icon_name            VARCHAR(100),
    ingame_icon                 VARCHAR(100)    NOT NULL,
    ingame_icon_2_name          VARCHAR(100),
    ingame_icon_2               VARCHAR(100),
    icon                        VARCHAR(100)    NOT NULL,
    release_date                DATE,
    version                     VARCHAR(10)     NOT NULL,
    introduced                  VARCHAR(10),
    demo_music                  VARCHAR(100),
    voice_actor_english         VARCHAR(100)    NOT NULL,
    voice_actor_japanese        VARCHAR(100)    NOT NULL,
    voice_actor_korean          VARCHAR(100)    NOT NULL,
    voice_actor_chinese         VARCHAR(100)    NOT NULL,
    deleted                     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by                  INT             NOT NULL,
    updated_at                  TIMESTAMP,
    updated_by                  INT,

    CONSTRAINT uq_characters_name_element UNIQUE (name, element),
    CONSTRAINT fk_characters_region FOREIGN KEY (region) REFERENCES regions(name),
    CONSTRAINT fk_characters_special_dish FOREIGN KEY (special_dish) REFERENCES foods(id),
    CONSTRAINT fk_characters_element FOREIGN KEY (element) REFERENCES elements(name),
    CONSTRAINT fk_characters_weapon_type FOREIGN KEY (weapon_type) REFERENCES weapon_types(name)
);
CREATE OR REPLACE TRIGGER trg_characters_protect_created
    BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- WEAPONS
-- name: Weapon
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS weapons (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    type            VARCHAR(50)     NOT NULL,
    rarity          SMALLINT        NOT NULL,
    icon_name       VARCHAR(100),
    icon            VARCHAR(100)    NOT NULL,
    icon_2_name     VARCHAR(100),
    icon_2          VARCHAR(100),
    icon_ascension  VARCHAR(100),
    how_to_obtain   JSONB,
    release_date    DATE,
    secondary_stat  VARCHAR(50),
    version         VARCHAR(10),
    description     TEXT,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT fk_weapons_type FOREIGN KEY (type) REFERENCES weapon_types(name),
    CONSTRAINT fk_weapons_secondary_stat FOREIGN KEY (secondary_stat) REFERENCES stats(name)
);
CREATE OR REPLACE TRIGGER trg_weapons_protect_created
    BEFORE UPDATE ON weapons
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_weapons_updated_at
    BEFORE UPDATE ON weapons
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- ARTIFACTS
-- name: Artifact
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifacts (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    icon            VARCHAR(100)    NOT NULL,
    how_to_obtain   JSONB,
    version         VARCHAR(10),
    effects         JSONB,
    two_piece       TEXT,
    four_piece      TEXT,
    rarity          SMALLINT        NOT NULL DEFAULT 5,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT
);
CREATE OR REPLACE TRIGGER trg_artifacts_protect_created
    BEFORE UPDATE ON artifacts
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_artifacts_updated_at
    BEFORE UPDATE ON artifacts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- BANNERS
-- name: Banner
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners (
    id              SERIAL          PRIMARY KEY,
    version         VARCHAR(10)     NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    duration_from   TIMESTAMP       NOT NULL,
    duration_to     TIMESTAMP,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT

);
CREATE OR REPLACE TRIGGER trg_banners_protect_created
    BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_banners_updated_at
    BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- AFFILIATIONS
-- name: Affiliation
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS affiliations (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    deleted     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP,
    updated_by  INT

);
CREATE OR REPLACE TRIGGER trg_affiliations_protect_created
    BEFORE UPDATE ON affiliations
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_affiliations_updated_at
    BEFORE UPDATE ON affiliations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- BACKGROUNDS
-- name: Background
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS backgrounds (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    deleted     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP,
    updated_by  INT

);
CREATE OR REPLACE TRIGGER trg_backgrounds_protect_created
    BEFORE UPDATE ON backgrounds
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_backgrounds_updated_at
    BEFORE UPDATE ON backgrounds
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- QUIZZES_STATES
-- name: QuizState
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes_states (
    user_id         INT         NOT NULL,
    quiz_id         INT         NOT NULL,
    state           JSONB,
    is_daily        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, quiz_id),
    CONSTRAINT fk_quizzes_states_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-----------------------------------------------------------
-- BANNERS_CHARACTERS
-- name: BannerCharacter
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners_characters (
    id              SERIAL          PRIMARY KEY,
    banner_id       INT             NOT NULL,
    character_id    INT             NOT NULL,
    "order"         SMALLINT        NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT uq_banners_characters_banner_character UNIQUE (banner_id, character_id),
    CONSTRAINT fk_banners_characters_banner     FOREIGN KEY (banner_id)    REFERENCES banners(id),
    CONSTRAINT fk_banners_characters_character  FOREIGN KEY (character_id) REFERENCES characters(id)
);
CREATE OR REPLACE TRIGGER trg_banners_characters_protect_created
    BEFORE UPDATE ON banners_characters
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_banners_characters_updated_at
    BEFORE UPDATE ON banners_characters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- BANNERS_WEAPONS
-- name: BannerWeapon
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners_weapons (
    id              SERIAL          PRIMARY KEY,
    banner_id       INT             NOT NULL,
    weapon_id       INT             NOT NULL,
    "order"         SMALLINT        NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT uq_banners_weapons_banner_weapon UNIQUE (banner_id, weapon_id),
    CONSTRAINT fk_banners_weapons_banner     FOREIGN KEY (banner_id)  REFERENCES banners(id),
    CONSTRAINT fk_banners_weapons_weapon     FOREIGN KEY (weapon_id)  REFERENCES weapons(id)
);
CREATE OR REPLACE TRIGGER trg_banners_weapons_protect_created
    BEFORE UPDATE ON banners_weapons
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_banners_weapons_updated_at
    BEFORE UPDATE ON banners_weapons
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_ROLES
-- name: CharacterRole
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_roles (
    id              SERIAL          PRIMARY KEY,
    character_id    INT             NOT NULL,
    role_name       VARCHAR(50)     NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT uq_characters_roles_character_role UNIQUE (character_id, role_name),
    CONSTRAINT fk_characters_roles_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_roles_role FOREIGN KEY (role_name) REFERENCES roles(name)
);
CREATE OR REPLACE TRIGGER trg_characters_roles_protect_created
    BEFORE UPDATE ON characters_roles
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_roles_updated_at
    BEFORE UPDATE ON characters_roles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_AFFILIATIONS
-- name: CharacterAffiliation
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_affiliations (
    id              SERIAL          PRIMARY KEY,
    character_id    INT             NOT NULL,
    affiliation_id  INT             NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT uq_characters_affiliations_character_affiliation UNIQUE (character_id, affiliation_id),
    CONSTRAINT fk_characters_affiliations_character   FOREIGN KEY (character_id)   REFERENCES characters(id),
    CONSTRAINT fk_characters_affiliations_affiliation FOREIGN KEY (affiliation_id) REFERENCES affiliations(id)
);
CREATE OR REPLACE TRIGGER trg_characters_affiliations_protect_created
    BEFORE UPDATE ON characters_affiliations
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_affiliations_updated_at
    BEFORE UPDATE ON characters_affiliations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_VOICE_OVERS
-- name: CharacterVoiceOver
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_voice_overs (
    id                  SERIAL          PRIMARY KEY,
    character_id        INT             NOT NULL,   -- default element variant 1/7 
    character_id_2      INT             NULL,       -- another element variant 2/7
    character_id_3      INT             NULL,       -- another element variant 3/7
    character_id_4      INT             NULL,       -- another element variant 4/7
    character_id_5      INT             NULL,       -- another element variant 5/7
    character_id_6      INT             NULL,       -- another element variant 6/7
    character_id_7      INT             NULL,       -- another element variant 7/7
    "order"             SMALLINT        NOT NULL,
    type                VARCHAR(50)     NOT NULL,
    language            VARCHAR(50)     NOT NULL,
    title               VARCHAR(100)    NOT NULL,
    text                TEXT            NOT NULL,
    reading             TEXT,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT fk_characters_voice_overs_type       FOREIGN KEY (type)         REFERENCES voice_over_types(name),
    CONSTRAINT fk_characters_voice_overs_language   FOREIGN KEY (language)     REFERENCES languages(name),
    CONSTRAINT fk_characters_voice_overs_character  FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_voice_overs_character_2 FOREIGN KEY (character_id_2) REFERENCES characters(id),
    CONSTRAINT fk_characters_voice_overs_character_3 FOREIGN KEY (character_id_3) REFERENCES characters(id),
    CONSTRAINT fk_characters_voice_overs_character_4 FOREIGN KEY (character_id_4) REFERENCES characters(id),
    CONSTRAINT fk_characters_voice_overs_character_5 FOREIGN KEY (character_id_5) REFERENCES characters(id),
    CONSTRAINT fk_characters_voice_overs_character_6 FOREIGN KEY (character_id_6) REFERENCES characters(id),
    CONSTRAINT fk_characters_voice_overs_character_7 FOREIGN KEY (character_id_7) REFERENCES characters(id)
);
CREATE OR REPLACE TRIGGER trg_characters_voice_overs_protect_created
    BEFORE UPDATE ON characters_voice_overs
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_voice_overs_updated_at
    BEFORE UPDATE ON characters_voice_overs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_RELATIONSHIPS
-- name: CharacterRelationship
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_relationships (
    id              SERIAL          PRIMARY KEY,
    character_id    INT             NOT NULL,
    type            VARCHAR(50)     NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    state           VARCHAR(50)     NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT fk_characters_relationships_type       FOREIGN KEY (type)         REFERENCES relationship_types(name),
    CONSTRAINT fk_characters_relationships_state      FOREIGN KEY (state)        REFERENCES character_states(name),
    CONSTRAINT fk_characters_relationships_character  FOREIGN KEY (character_id) REFERENCES characters(id)
);
CREATE OR REPLACE TRIGGER trg_characters_relationships_protect_created
    BEFORE UPDATE ON characters_relationships
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_relationships_updated_at
    BEFORE UPDATE ON characters_relationships
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_CONSTELLATIONS
-- name: CharacterConstellation
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_constellations (
    id              SERIAL          PRIMARY KEY,
    character_id    INT             NOT NULL,
    icon            VARCHAR(100)    NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    level           SMALLINT        NOT NULL,
    description     TEXT,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT uq_characters_constellations_character_level UNIQUE (character_id, level),
    CONSTRAINT fk_characters_constellations_character  FOREIGN KEY (character_id) REFERENCES characters(id)
);
CREATE OR REPLACE TRIGGER trg_characters_constellations_protect_created
    BEFORE UPDATE ON characters_constellations
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_constellations_updated_at
    BEFORE UPDATE ON characters_constellations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_TALENTS
-- name: CharacterTalent
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_talents (
    id              SERIAL          PRIMARY KEY,
    character_id    INT             NOT NULL,
    icon            VARCHAR(100)    NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    type            VARCHAR(100)    NOT NULL,
    description     TEXT,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT uq_characters_talents_character_name_type UNIQUE (character_id, name, type),
    CONSTRAINT fk_characters_talents_type       FOREIGN KEY (type)         REFERENCES talent_types(name),
    CONSTRAINT fk_characters_talents_character  FOREIGN KEY (character_id) REFERENCES characters(id)
);
CREATE OR REPLACE TRIGGER trg_characters_talents_protect_created
    BEFORE UPDATE ON characters_talents
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_talents_updated_at
    BEFORE UPDATE ON characters_talents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_TALENTS_COST
-- name: CharacterTalentCost
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_talents_cost (
    id                      SERIAL          PRIMARY KEY,
    character_talent_id     INT             NOT NULL,
    level                   SMALLINT        NOT NULL,
    material_id             INT             NOT NULL,
    quantity                INT             NOT NULL,
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT,

    CONSTRAINT uq_characters_talents_cost_character_talent_level UNIQUE (character_talent_id, level, material_id),
    CONSTRAINT fk_characters_talents_cost_characters_talent_id FOREIGN KEY (character_talent_id) REFERENCES characters_talents(id),
    CONSTRAINT fk_characters_talents_cost_material   FOREIGN KEY (material_id) REFERENCES materials(id)
);
CREATE OR REPLACE TRIGGER trg_characters_talents_cost_protect_created
    BEFORE UPDATE ON characters_talents_cost
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_talents_cost_updated_at
    BEFORE UPDATE ON characters_talents_cost
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_ASCENSIONS
-- name: CharacterAscension
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_ascensions (
    id                  SERIAL          PRIMARY KEY,
    character_id        INT             NOT NULL,
    phase               SMALLINT        NOT NULL,
    primary_stat        VARCHAR(50)    NOT NULL,
    primary_stat_value  INT             NOT NULL,
    start_level_hp      INT             NOT NULL,
    start_level_atk     INT             NOT NULL,
    start_level_def     INT             NOT NULL,
    end_level_hp        INT             NOT NULL,
    end_level_atk       INT             NOT NULL,
    end_level_def       INT             NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT uq_characters_ascensions_character_phase UNIQUE (character_id, phase),
    CONSTRAINT fk_characters_ascensions_character    FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_ascensions_primary_stat FOREIGN KEY (primary_stat) REFERENCES stats(name)
);
CREATE OR REPLACE TRIGGER trg_characters_ascensions_protect_created
    BEFORE UPDATE ON characters_ascensions
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_ascensions_updated_at
    BEFORE UPDATE ON characters_ascensions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_ASCENSIONS_COST
-- name: CharacterAscensionCost
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_ascensions_cost (
    id                      SERIAL          PRIMARY KEY,
    character_ascension_id  INT             NOT NULL,
    material_id             INT             NOT NULL,
    quantity                INT             NOT NULL,
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT,

    CONSTRAINT uq_characters_ascensions_cost_character_ascension_material UNIQUE (character_ascension_id, material_id),
    CONSTRAINT fk_characters_ascensions_cost_character_ascension_id FOREIGN KEY (character_ascension_id) REFERENCES characters_ascensions(id),
    CONSTRAINT fk_characters_ascensions_cost_material FOREIGN KEY (material_id) REFERENCES materials(id)
);
CREATE OR REPLACE TRIGGER trg_characters_ascensions_cost_protect_created
    BEFORE UPDATE ON characters_ascensions_cost
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_ascensions_cost_updated_at
    BEFORE UPDATE ON characters_ascensions_cost
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_BUILDS
-- name: CharacterBuild
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds (
    id              SERIAL          PRIMARY KEY,
    character_id    INT             NOT NULL,
    version         VARCHAR(10)     NOT NULL,
    role            VARCHAR(50)     NOT NULL,      
    description     TEXT,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT uq_characters_builds_character_version UNIQUE (character_id, version, role),
    CONSTRAINT fk_characters_builds_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_builds_role FOREIGN KEY (role) REFERENCES roles(name)
);
CREATE OR REPLACE TRIGGER trg_characters_builds_protect_created
    BEFORE UPDATE ON characters_builds
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_builds_updated_at
    BEFORE UPDATE ON characters_builds
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_BUILDS_WEAPONS
-- name: CharacterBuildWeapon
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_weapons (
    id                  SERIAL          PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    weapon_id           INT             NOT NULL,
    "order"             SMALLINT        NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT uq_characters_builds_weapons_character_build_weapon UNIQUE (character_build_id, weapon_id),
    CONSTRAINT fk_characters_builds_weapons_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_weapons_weapon          FOREIGN KEY (weapon_id)          REFERENCES weapons(id)
);
CREATE OR REPLACE TRIGGER trg_characters_builds_weapons_protect_created
    BEFORE UPDATE ON characters_builds_weapons
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_builds_weapons_updated_at
    BEFORE UPDATE ON characters_builds_weapons
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_BUILDS_ARTIFACTS
-- name: CharacterBuildArtifact
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_artifacts (
    id                  SERIAL          PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    artifact_id         INT             NOT NULL,
    pc_2                BOOLEAN         NOT NULL DEFAULT FALSE,
    pc_4                BOOLEAN         NOT NULL DEFAULT TRUE,
    "order"             SMALLINT        NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT uq_characters_builds_artifacts_character_build_artifact UNIQUE (character_build_id, artifact_id, "order"),
    CONSTRAINT fk_characters_builds_artifacts_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_artifacts_artifact        FOREIGN KEY (artifact_id)        REFERENCES artifacts(id)
);
CREATE OR REPLACE TRIGGER trg_characters_builds_artifacts_protect_created
    BEFORE UPDATE ON characters_builds_artifacts
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_builds_artifacts_updated_at
    BEFORE UPDATE ON characters_builds_artifacts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_BUILDS_TALENTS
-- name: CharacterBuildTalent
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_talents (
    id                  SERIAL          PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    talent_id           INT             NOT NULL,
    "order"             SMALLINT        NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT uq_characters_builds_talents_character_build_talent UNIQUE (character_build_id, talent_id),
    CONSTRAINT fk_characters_builds_talents_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_talents_talent          FOREIGN KEY (talent_id)          REFERENCES characters_talents(id)
);
CREATE OR REPLACE TRIGGER trg_characters_builds_talents_protect_created
    BEFORE UPDATE ON characters_builds_talents
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_builds_talents_updated_at
    BEFORE UPDATE ON characters_builds_talents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_BUILDS_MAIN_STATS
-- name: CharacterBuildMainStat
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_main_stats (
    id                  SERIAL          PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    stat_name           VARCHAR(50)    NOT NULL,
    artifact_type       VARCHAR(50)     NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT uq_characters_builds_main_stats_character_build_stat_type UNIQUE (character_build_id, stat_name, artifact_type),
    CONSTRAINT fk_characters_builds_main_stats_artifact_type FOREIGN KEY (artifact_type) REFERENCES artifact_piece_types(name),
    CONSTRAINT fk_characters_builds_main_stats_character_build  FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_main_stats_stat FOREIGN KEY (stat_name) REFERENCES stats(name)
);
CREATE OR REPLACE TRIGGER trg_characters_builds_main_stats_protect_created
    BEFORE UPDATE ON characters_builds_main_stats
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_builds_main_stats_updated_at
    BEFORE UPDATE ON characters_builds_main_stats
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_BUILDS_SUB_STATS
-- name: CharacterBuildSubStat
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_sub_stats (
    id                  SERIAL          PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    stat_name           VARCHAR(50)    NOT NULL,
    recommended_value   VARCHAR(50),
    "order"             SMALLINT        NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT uq_characters_builds_sub_stats_character_build_stat UNIQUE (character_build_id, stat_name, "order"),
    CONSTRAINT fk_characters_builds_sub_stats_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_sub_stats_stat FOREIGN KEY (stat_name) REFERENCES stats(name)
);
CREATE OR REPLACE TRIGGER trg_characters_builds_sub_stats_protect_created
    BEFORE UPDATE ON characters_builds_sub_stats
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_builds_sub_stats_updated_at
    BEFORE UPDATE ON characters_builds_sub_stats
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_BUILDS_TEAMS
-- name: CharacterBuildTeam
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_teams (
    id                  SERIAL          PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    description         TEXT,
    "order"             SMALLINT        NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT uq_characters_builds_teams_character_build_order UNIQUE (character_build_id, "order"),
    CONSTRAINT fk_characters_builds_teams_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id)
);
CREATE OR REPLACE TRIGGER trg_characters_builds_teams_protect_created
    BEFORE UPDATE ON characters_builds_teams
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_builds_teams_updated_at
    BEFORE UPDATE ON characters_builds_teams
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_BUILDS_TEAMS_CHARACTERS
-- name: CharacterBuildTeamCharacter
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_teams_characters (
    id                          SERIAL          PRIMARY KEY,
    character_build_team_id     INT             NOT NULL,
    character_id                INT,
    "order"                     SMALLINT        NOT NULL,
    element                     VARCHAR(50),
    flex                        BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted                     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by                  INT             NOT NULL,
    updated_at                  TIMESTAMP,
    updated_by                  INT,

    CONSTRAINT uq_characters_builds_teams_characters_character_build_team_character_order_element_flex UNIQUE (character_build_team_id, character_id, "order", element, flex),
    CONSTRAINT uq_characters_builds_teams_characters_character_build_team FOREIGN KEY (character_build_team_id) REFERENCES characters_builds_teams(id),
    CONSTRAINT fk_characters_builds_teams_characters_character FOREIGN KEY (character_id) REFERENCES characters(id)
);
CREATE OR REPLACE TRIGGER trg_characters_builds_teams_characters_protect_created
    BEFORE UPDATE ON characters_builds_teams_characters
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_builds_teams_characters_updated_at
    BEFORE UPDATE ON characters_builds_teams_characters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- FOODS_RECIPE
-- name: FoodRecipe
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS foods_recipe (
    id          SERIAL          PRIMARY KEY,
    food_id     INT             NOT NULL,
    material_id INT             NOT NULL,
    quantity    INT             NOT NULL,
    deleted     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP,
    updated_by  INT,

    CONSTRAINT fk_foods_recipe_food FOREIGN KEY (food_id) REFERENCES foods(id),
    CONSTRAINT fk_foods_recipe_material FOREIGN KEY (material_id) REFERENCES materials(id)
);
CREATE OR REPLACE TRIGGER trg_foods_recipe_protect_created
    BEFORE UPDATE ON foods_recipe
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_foods_recipe_updated_at
    BEFORE UPDATE ON foods_recipe
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- ARTIFACTS_PIECES
-- name: ArtifactPiece
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifacts_pieces (
    id          SERIAL          PRIMARY KEY,
    artifact_id INT             NOT NULL,
    icon        VARCHAR(100)    NOT NULL,
    type        VARCHAR(50)     NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    deleted     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP,
    updated_by  INT,

    CONSTRAINT fk_artifacts_pieces_type       FOREIGN KEY (type)        REFERENCES artifact_piece_types(name),
    CONSTRAINT fk_artifacts_pieces_artifact   FOREIGN KEY (artifact_id) REFERENCES artifacts(id)
);
CREATE OR REPLACE TRIGGER trg_artifacts_pieces_protect_created
    BEFORE UPDATE ON artifacts_pieces
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_artifacts_pieces_updated_at
    BEFORE UPDATE ON artifacts_pieces
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- USER_QUIZ_HISTORY
-- name: QuizHistory
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_quiz_history (
    id              SERIAL          PRIMARY KEY,
    user_id         INT             NOT NULL,
    character_id    INT             NOT NULL,
    quiz_id         INT             NOT NULL,
    win             BOOLEAN         NOT NULL,
    attemps         INT             NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_quiz_history_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_user_quiz_history_quiz      FOREIGN KEY (quiz_id)      REFERENCES quizzes(id)
);

-----------------------------------------------------------
-- QUIZ_STATS_HISTORY
-- name: QuizStatsHistory
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_stats_history (
    user_id         INT             NOT NULL,
    character_id    INT             NOT NULL,
    quiz_id         INT             NOT NULL,
    wins            INT             NOT NULL,
    losses          INT             NOT NULL,
    attemps         INT             NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,

    PRIMARY KEY (user_id, character_id, quiz_id),
    CONSTRAINT fk_quiz_stats_history_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_quiz_stats_history_quiz      FOREIGN KEY (quiz_id)      REFERENCES quizzes(id)
);
CREATE OR REPLACE TRIGGER trg_quiz_stats_history_updated_at
    BEFORE UPDATE ON quiz_stats_history
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- ENEMIES
-- name: Enemy
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemies (
    id                      SERIAL          PRIMARY KEY,
    name                    VARCHAR(100)    NOT NULL,
    model_icon              VARCHAR(100)    NOT NULL,
    icon                    VARCHAR(100)    NOT NULL,
    damage_type_element     VARCHAR(50)     NOT NULL,
    other_elements          VARCHAR(50),
    has_weakpoint           BOOLEAN         DEFAULT FALSE,
    living_being_type       VARCHAR(50)     NOT NULL,
    living_being_family     VARCHAR(100)    NOT NULL,
    living_being_group      VARCHAR(100),
    interactive_map_link    VARCHAR(200),
    abilities               JSONB,
    description             TEXT,
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT,

    CONSTRAINT fk_enemies_damage_type_element FOREIGN KEY (damage_type_element) REFERENCES elements(name),
    CONSTRAINT fk_enemies_other_elements FOREIGN KEY (other_elements) REFERENCES elements(name),
    CONSTRAINT fk_enemies_living_being_type FOREIGN KEY (living_being_type) REFERENCES enemy_types(name),
    CONSTRAINT fk_enemies_living_being_family FOREIGN KEY (living_being_family) REFERENCES enemy_families(name)
);
CREATE OR REPLACE TRIGGER trg_enemies_protect_created
    BEFORE UPDATE ON enemies
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_enemies_updated_at
    BEFORE UPDATE ON enemies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- ENEMIES_DROPS
-- name: EnemyDrop
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemies_drops (
    id          SERIAL          PRIMARY KEY,
    level_from  INT             NOT NULL,
    level_to    INT,
    enemy_id    INT             NOT NULL,
    material_id INT             NOT NULL,
    quantity    INT,
    deleted     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP,
    updated_by  INT,

    CONSTRAINT fk_enemies_drops_enemy      FOREIGN KEY (enemy_id)    REFERENCES enemies(id),
    CONSTRAINT fk_enemies_drops_material   FOREIGN KEY (material_id) REFERENCES materials(id)
);
CREATE OR REPLACE TRIGGER trg_enemies_drops_protect_created
    BEFORE UPDATE ON enemies_drops
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_enemies_drops_updated_at
    BEFORE UPDATE ON enemies_drops
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
