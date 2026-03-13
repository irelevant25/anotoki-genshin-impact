-----------------------------------------------------------
-- MIGRATIONS
-- name: Migration
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS migrations (
    id         INT             AUTO_INCREMENT PRIMARY KEY,
    filename   VARCHAR(255)    NOT NULL UNIQUE,
    applied_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------------------------
-- USERS
-- name: User
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    role                ENUM('ADMIN','EDITOR','USER') NOT NULL DEFAULT 'USER',
    username            VARCHAR(100)    NOT NULL UNIQUE,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    email_confirmed     BOOLEAN         NOT NULL DEFAULT 0,
    password            VARCHAR(255)    NOT NULL,
    background          VARCHAR(100),
    deleted             BOOLEAN         NOT NULL DEFAULT 0,
    theme               ENUM('light','dark','auto') NOT NULL DEFAULT 'auto',
    version             VARCHAR(10),    -- for notification when new version is released
    token               VARCHAR(64)     NULL UNIQUE,
    token_expires_at    TIMESTAMP       NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-----------------------------------------------------------
-- QUIZZES
-- name: Quiz
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    deleted     BOOLEAN         NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------------------------
-- QUIZZES STATES
-- name: QuizState
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes_states (
    user_id         INT         NOT NULL,
    quiz_id         INT         NOT NULL,
    state           JSON,
    is_daily        BOOLEAN     NOT NULL DEFAULT 0,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, quiz_id),
    CONSTRAINT fk_quizzes_states_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_quizzes_states_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-----------------------------------------------------------
-- CHARACTERS
-- name: Character
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters (
    id                          INT             AUTO_INCREMENT PRIMARY KEY,
    name                        VARCHAR(100)    NOT NULL UNIQUE,
    element                     ENUM('Anemo','Geo','Electro','Dendro','Hydro','Pyro','Cryo') NOT NULL,
    weapon_type                 ENUM('Sword','Claymore','Polearm','Bow','Catalyst')          NOT NULL,
    rarity                      TINYINT         NOT NULL,
    title                       VARCHAR(100)    NULL,
    secondary_title             VARCHAR(100)    NULL,
    region                      VARCHAR(100)    NULL,
    model                       VARCHAR(100)    NOT NULL,
    birthday                    DATE            NULL,      -- 0000-09-13
    special_dish                VARCHAR(100)    NULL,
    how_to_obtain               VARCHAR(100)    NOT NULL,
    namecard_description        VARCHAR(100)    NOT NULL,
    namecard_sources            JSON            NULL,      -- ["Reward for reaching Friendship Level 10 with Albedo"]
    release_date                DATE            NULL,      -- 2020-12-23
    version                     VARCHAR(10)     NOT NULL,  -- 1.0
    introduced                  VARCHAR(10)     NULL,      -- 1.0
    demo_music                  VARCHAR(100)    NULL,
    voice_actor_english         VARCHAR(100)    NOT NULL,
    voice_actor_japanese        VARCHAR(100)    NOT NULL,
    voice_actor_korean          VARCHAR(100)    NOT NULL,
    voice_actor_chinese         VARCHAR(100)    NOT NULL,
    deleted                     BOOLEAN         NOT NULL DEFAULT 0,
    created_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by                  INT             NOT NULL,
    updated_at                  TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by                  INT             NULL,

    CONSTRAINT fk_characters_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- BANNERS
-- name: Banner
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    version         VARCHAR(10)     NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    duration_from   DATETIME        NOT NULL,
    duration_to     DATETIME        NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT fk_banners_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_banners_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- BANNERS_CHARACTERS
-- name: BannerCharacter
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners_characters (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    banner_id       INT             NOT NULL,
    character_id    INT             NOT NULL,
    order           TINYINT         NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT uq_banners_characters_banner_character UNIQUE (banner_id, character_id),
    CONSTRAINT fk_banners_characters_banner FOREIGN KEY (banner_id) REFERENCES banners(id),
    CONSTRAINT fk_banners_characters_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_banners_characters_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_banners_characters_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- BANNERS_WEAPONS
-- name: BannerWeapon
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners_weapons (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    banner_id       INT             NOT NULL,
    weapon_id       INT             NOT NULL,
    order           TINYINT         NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT uq_banners_weapons_banner_weapon UNIQUE (banner_id, weapon_id),
    CONSTRAINT fk_banners_weapons_banner FOREIGN KEY (banner_id) REFERENCES banners(id),
    CONSTRAINT fk_banners_weapons_weapon FOREIGN KEY (weapon_id) REFERENCES weapons(id),
    CONSTRAINT fk_banners_weapons_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_banners_weapons_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- ROLES
-- name: Role
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    deleted     BOOLEAN         NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by  INT             NULL,

    CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_ROLES
-- name: CharacterRole
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_roles (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    character_id    INT             NOT NULL,
    role_id         INT             NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT uq_characters_roles_character_role UNIQUE (character_id, role_id),
    CONSTRAINT fk_characters_roles_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_roles_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_characters_roles_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- AFFILIATIONS
-- name: Affiliation
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS affiliations (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    deleted     BOOLEAN         NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by  INT             NULL,

    CONSTRAINT fk_affiliations_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_affiliations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_AFFILIATIONS
-- name: CharacterAffiliation
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_affiliations (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    character_id    INT             NOT NULL,
    affiliation_id  INT             NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT uq_characters_affiliations_character_affiliation UNIQUE (character_id, affiliation_id),
    CONSTRAINT fk_characters_affiliations_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_affiliations_affiliation FOREIGN KEY (affiliation_id) REFERENCES affiliations(id),
    CONSTRAINT fk_characters_affiliations_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_affiliations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_VOICE_OVERS
-- name: CharacterVoiceOver
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_voice_overs (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    character_id    INT             NOT NULL,
    type            ENUM('story','combat') NOT NULL,
    language        ENUM('English','Chinese','Japanese','Korean') NOT NULL,
    title           VARCHAR(100)    NOT NULL,
    text            TEXT            NOT NULL,
    reading         TEXT            NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT uq_characters_voice_overs_character_voice_over UNIQUE (character_id, voice_over),
    CONSTRAINT fk_characters_voice_overs_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_voice_overs_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_voice_overs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_RELATIONSHIPS
-- name: CharacterRelationship
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_relationships (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    character_id    INT             NOT NULL,
    type            ENUM('Mother','Grandmother','Father','Grandfather','Sister','Brother','Friend','Enemy','Ancestor','Relative','Master','Uncle','Daughter','Son','Other') NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    state           ENUM('Alive','Deceased','Unknown') NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT fk_characters_relationships_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_relationships_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_relationships_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_CONSTELLATIONS
-- name: CharacterConstellation
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_constellations (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    character_id    INT             NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    level           TINYINT         NOT NULL,
    description     TEXT,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT uq_characters_constellations_character_level UNIQUE (character_id, level),
    CONSTRAINT fk_characters_constellations_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_constellations_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_constellations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_TALENTS
-- name: CharacterTalent
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_talents (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    character_id    INT             NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    type            ENUM('Normal Attack','Elemental Skill','Elemental Burst','Utility Passive','1st Ascension Passive','2nd Ascension Passive','3rd Ascension Passive','4th Ascension Passive','5th Ascension Passive','6th Ascension Passive')    NOT NULL,
    description     TEXT            NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT fk_characters_talents_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_talents_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_talents_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_TALENTS_COST
-- name: CharacterTalentCost
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_talents_cost (
    id                      INT             AUTO_INCREMENT PRIMARY KEY,
    character_talent_id     INT             NOT NULL,
    level                   TINYINT         NOT NULL,
    material_id             INT             NOT NULL,
    quantity                INT             NOT NULL,
    deleted                 BOOLEAN         NOT NULL DEFAULT 0,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by              INT             NULL,

    CONSTRAINT uq_characters_talents_cost_character_talent_level UNIQUE (character_talent_id, level),
    CONSTRAINT fk_characters_talents_cost_characters_talent_id FOREIGN KEY (character_talent_id) REFERENCES characters_talents(id),
    CONSTRAINT fk_characters_talents_cost_material FOREIGN KEY (material_id) REFERENCES materials(id),
    CONSTRAINT fk_characters_talents_cost_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_talents_cost_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_ASCENSIONS
-- name: CharacterAscension
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_ascensions (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    character_id        INT             NOT NULL,
    phase               TINYINT         NOT NULL,
    primary_stat        INT             NOT NULL,
    primary_stat_value  INT             NOT NULL,
    start_level_hp      INT             NOT NULL,
    start_level_atk     INT             NOT NULL,
    start_level_def     INT             NOT NULL,
    end_level_hp        INT             NOT NULL,
    end_level_atk       INT             NOT NULL,
    end_level_def       INT             NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by          INT             NULL,

    CONSTRAINT uq_characters_ascensions_character_phase UNIQUE (character_id, phase),
    CONSTRAINT fk_characters_ascensions_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_ascensions_character FOREIGN KEY (primary_stat) REFERENCES stats(id),
    CONSTRAINT fk_characters_ascensions_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_ascensions_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_ASCENSIONS_COST
-- name: CharacterAscensionCost
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_ascensions_cost (
    id                      INT             AUTO_INCREMENT PRIMARY KEY,
    character_ascension_id  INT             NOT NULL,
    material_id             INT             NOT NULL,
    quantity                INT             NOT NULL,
    deleted                 BOOLEAN         NOT NULL DEFAULT 0,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by              INT             NULL,

    CONSTRAINT uq_characters_ascensions_cost_character_ascension_material UNIQUE (character_ascension_id, material_id),
    CONSTRAINT fk_characters_ascensions_cost_character_ascension_id FOREIGN KEY (character_ascension_id) REFERENCES characters_ascensions(id),
    CONSTRAINT fk_characters_ascensions_cost_material FOREIGN KEY (material_id) REFERENCES materials(id),
    CONSTRAINT fk_characters_ascensions_cost_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_ascensions_cost_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_BUILDS
-- name: CharacterBuild
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    character_id    INT             NOT NULL,
    version         VARCHAR(10)     NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT uq_characters_builds_character_version UNIQUE (character_id, version),
    CONSTRAINT fk_characters_builds_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_builds_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_builds_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_BUILDS_WEAPONS
-- name: CharacterBuildWeapon
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_weapons (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    weapon_id           INT             NOT NULL,
    order               TINYINT         NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by          INT             NULL,

    CONSTRAINT uq_characters_builds_weapons_character_build_weapon UNIQUE (character_build_id, weapon_id),
    CONSTRAINT fk_characters_builds_weapons_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_weapons_weapon FOREIGN KEY (weapon_id) REFERENCES weapons(id),
    CONSTRAINT fk_characters_builds_weapons_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_builds_weapons_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_BUILDS_ARTIFACTS
-- name: CharacterBuildArtifact
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_artifacts (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    artifact_id         INT             NOT NULL,
    order               TINYINT         NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by          INT             NULL,

    CONSTRAINT uq_characters_builds_artifacts_character_build_artifact UNIQUE (character_build_id, artifact_id),
    CONSTRAINT fk_characters_builds_artifacts_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_artifacts_artifact FOREIGN KEY (artifact_id) REFERENCES artifacts(id),
    CONSTRAINT fk_characters_builds_artifacts_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_builds_artifacts_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_BUILDS_TALENTS
-- name: CharacterBuildTalent
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_talents (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    talent_id           INT             NOT NULL,
    order               TINYINT         NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by          INT             NULL,

    CONSTRAINT uq_characters_builds_talents_character_build_talent UNIQUE (character_build_id, talent_id),
    CONSTRAINT fk_characters_builds_talents_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_talents_talent FOREIGN KEY (talent_id) REFERENCES talents(id),
    CONSTRAINT fk_characters_builds_talents_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_builds_talents_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_BUILDS_MAIN_STATS
-- name: CharacterBuildMainStat
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_main_stats (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    stat_id             INT             NOT NULL,
    type                ENUM('sands', 'goblet', 'circlet') NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by          INT             NULL,

    CONSTRAINT uq_characters_builds_main_stats_character_build_stat_type UNIQUE (character_build_id, stat_id, type),
    CONSTRAINT fk_characters_builds_main_stats_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_main_stats_stat FOREIGN KEY (stat_id) REFERENCES stats(id),
    CONSTRAINT fk_characters_builds_main_stats_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_builds_main_stats_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_BUILDS_SUB_STATS
-- name: CharacterBuildSubStat
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_sub_stats (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    stat_id             INT             NOT NULL,
    order               TINYINT         NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by          INT             NULL,

    CONSTRAINT uq_characters_builds_sub_stats_character_build_stat UNIQUE (character_build_id, stat_id),
    CONSTRAINT fk_characters_builds_sub_stats_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_sub_stats_stat FOREIGN KEY (stat_id) REFERENCES stats(id),
    CONSTRAINT fk_characters_builds_sub_stats_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_builds_sub_stats_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- CHARACTERS_BUILDS_TEAMS
-- name: CharacterBuildTeam
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_teams (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    character_id        INT             NOT NULL,
    order               TINYINT         NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by          INT             NULL,

    CONSTRAINT uq_characters_builds_teams_character_build_character_order UNIQUE (character_build_id, character_id, order),
    CONSTRAINT fk_characters_builds_teams_character_build FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_teams_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_builds_teams_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_characters_builds_teams_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- STATS
-- name: Stat
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS stats (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    is_percent  BOOLEAN         NOT NULL DEFAULT 1,
    deleted     BOOLEAN         NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by  INT             NULL,

    CONSTRAINT fk_stats_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_stats_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- WEAPONS
-- name: Weapon
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS weapons (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    type            ENUM('Sword','Claymore','Polearm','Bow','Catalyst') NOT NULL,
    rarity          TINYINT         NOT NULL,
    how_to_obtain   JSON NULL,
    release_date    DATE NULL,      -- 2020-12-23
    secondary_stat  INT             NOT NULL,
    version         VARCHAR(10),
    description     TEXT,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT fk_weapons_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_weapons_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- WEAPONS_STATS
-- name: WeaponStat
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS weapons_stats (
    weapon_id       INT             NOT NULL,
    stat_id         INT             NOT NULL,
    stat_value      INT             NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    PRIMARY KEY (weapon_id, stat_id),
    CONSTRAINT fk_weapons_stats_weapon FOREIGN KEY (weapon_id) REFERENCES weapons(id),
    CONSTRAINT fk_weapons_stats_stat FOREIGN KEY (stat_id) REFERENCES stats(id),
    CONSTRAINT fk_weapons_stats_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_weapons_stats_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- MATERIALS
-- name: Material
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS materials (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    category        ENUM('Ascension','Talent','Weapon','Cooking','Local Specialty','Monster Drop','Other','Materials') NOT NULL,
    region          ENUM('Mondstadt','Liyue','Inazuma','Sumeru','Fontaine','Natlan','Nod-Krai'),
    how_to_obtain   JSON NULL,
    version         VARCHAR(10),
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT fk_materials_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_materials_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- BACKGROUNDS
-- name: Background
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS backgrounds (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    deleted     BOOLEAN         NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by  INT             NULL,

    CONSTRAINT fk_backgrounds_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_backgrounds_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- FOODS
-- name: Food
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS foods (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    description     TEXT,
    effect          TEXT,
    type            VARCHAR(100),
    rarity          TINYINT         NOT NULL,
    proficiency     TINYINT         NOT NULL,
    base_dish_id    INT,
    variant         VARCHAR(100),
    character_id    INT,
    event           VARCHAR(100),
    region          ENUM('Mondstadt','Liyue','Inazuma','Sumeru','Fontaine','Natlan','Nod-Krai'),
    how_to_obtain   JSON NULL,
    effects         JSON NULL,
    version         VARCHAR(10),
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT fk_foods_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_foods_base_dish FOREIGN KEY (base_dish_id) REFERENCES foods(id),
    CONSTRAINT fk_foods_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_foods_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- FOODS_RECIPE
-- name: FoodRecipe
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS foods_recipe (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    food_id     INT             NOT NULL,
    material_id INT             NOT NULL,
    quantity    INT             NOT NULL,
    deleted     BOOLEAN         NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by  INT             NULL,

    CONSTRAINT fk_foods_recipe_food FOREIGN KEY (food_id) REFERENCES foods(id),
    CONSTRAINT fk_foods_recipe_material FOREIGN KEY (material_id) REFERENCES materials(id),
    CONSTRAINT fk_foods_recipe_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_foods_recipe_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- ARTIFACTS
-- name: Artifact
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifacts (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    how_to_obtain   JSON NULL,
    version         VARCHAR(10),
    effects         JSON NULL,
    two_piece       TEXT,
    four_piece      TEXT,
    rarity          TINYINT         NOT NULL DEFAULT 5,
    deleted         BOOLEAN         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by      INT             NULL,

    CONSTRAINT fk_artifacts_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_artifacts_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- ARTIFACTS_PIECES
-- name: ArtifactPiece
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifacts_pieces (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    artifact_id INT             NOT NULL,
    type        ENUM('Flower of Life','Plume of Death','Sands of Eon','Goblet of Eonothem','Circlet of Logos') NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    deleted     BOOLEAN         NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by  INT             NULL,

    CONSTRAINT fk_artifacts_pieces_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_artifacts_pieces_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_artifacts_pieces_artifact FOREIGN KEY (artifact_id) REFERENCES artifacts(id)
);

-----------------------------------------------------------
-- USER_QUIZ_HISTORY
-- name: QuizHistory
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_quiz_history (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL,
    character_id    INT             NOT NULL,
    quiz_id         INT             NOT NULL,
    win             BOOLEAN         NOT NULL,
    attemps         INT             NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_quiz_history_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_quiz_history_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_user_quiz_history_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
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
    updated_at      TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, character_id, quiz_id),
    CONSTRAINT fk_quiz_stats_history_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_quiz_stats_history_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_quiz_stats_history_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-----------------------------------------------------------
-- ENEMIES
-- name: Enemy
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemies (
    id                      INT             AUTO_INCREMENT PRIMARY KEY,
    name                    VARCHAR(100)    NOT NULL,
    damage_type             ENUM('Physical','Pyro','Hydro','Electro','Cryo','Anemo','Geo') NOT NULL,
    other_elements          ENUM('Physical','Pyro','Hydro','Electro','Cryo','Anemo','Geo'),
    has_weakpoint           BOOLEAN         DEFAULT FALSE,
    living_being_type       ENUM('Common Enemies','Elite Enemies','Normal Bosses','Weekly Bosses') NOT NULL,
    living_being_family     ENUM('Automatons','Elemental Lifeforms','Hilichurls','Mystical Beasts','The Abyss','Fatui','Enemies of Note','Other Human Factions') NOT NULL,
    living_being_group      VARCHAR(100),
    interactive_map_link    VARCHAR(200),
    abilities               JSON NULL,
    description             TEXT,
    deleted                 BOOLEAN         NOT NULL DEFAULT 0,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by              INT             NULL,

    CONSTRAINT fk_enemies_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_enemies_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-----------------------------------------------------------
-- ENEMIES_DROPS
-- name: EnemyDrop
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemies_drops (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    level_from  INT             NOT NULL,
    level_to    INT,
    enemy_id    INT             NOT NULL,
    material_id INT             NOT NULL,
    quantity    INT,
    deleted     BOOLEAN         NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by  INT             NOT NULL,
    updated_at  TIMESTAMP       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by  INT             NULL,

    CONSTRAINT fk_enemies_drops_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_enemies_drops_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_enemies_drops_enemy FOREIGN KEY (enemy_id) REFERENCES enemies(id),
    CONSTRAINT fk_enemies_drops_material FOREIGN KEY (material_id) REFERENCES materials(id)
);
