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
    name    VARCHAR(50)     PRIMARY KEY
);
INSERT INTO elements (name) VALUES
    ('Anemo'), ('Geo'), ('Electro'), ('Dendro'), ('Hydro'), ('Pyro'), ('Cryo')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- WEAPON_TYPES
-- name: WeaponType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS weapon_types (
    name    VARCHAR(50)     PRIMARY KEY
);
INSERT INTO weapon_types (name) VALUES
    ('Sword'), ('Bow'), ('Catalyst'), ('Claymore'), ('Polearm')
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
    ('Mother'), ('Grandmother'), ('Father'), ('Grandfather'), ('Grandparent'),
    ('Sister'), ('Brother'), ('Friend'), ('Enemy'), ('Creator'), ('Ancestry'), ('Nephew'),
    ('Ancestor'), ('Relative'), ('Master'), ('Uncle'), ('Child'), ('Creation'),
    ('Daughter'), ('Son'), ('Other'), ('Sibling'), ('Parent'), ('Aunt'), ('Cousin'),
    ('Husband'), ('Wife'), ('Spouse'), ('Adoptive parent'), ('Adoptive child'), ('Niece'),
    ('Derived from'), ('Great grandparent'), ('Great grandmother'), ('Great grandfather')
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
    ('Night Realm''s Gift Passive'), ('Passive Talent'), ('Alternate Sprint'),
    ('Witch''s Eve Rite Passive'), ('Moonsign Benediction Passive')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- -- LANGUAGES
-- -- name: Language
-- -----------------------------------------------------------
-- CREATE TABLE IF NOT EXISTS languages (
--     name VARCHAR(50) PRIMARY KEY
-- );
-- INSERT INTO languages (name) VALUES
--     ('English'), ('Chinese'), ('Japanese'), ('Korean')
-- ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- FOOD_TYPES
-- name: FoodType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_types (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO food_types (name) VALUES
    ('Adventure Restore Dishes'), ('Adventurer''s Dishes'), ('ATK Dishes'), ('ATK Up Dishes'), ('ATK-Boosting Dishes'), 
    ('Climbing Stamina Dishes'), ('CRIT DMG Dishes'), ('CRIT Rate Dishes'), ('CRIT Rate Up Dishes'), ('DEF Dishes'),
    ('DEF Increase Dishes'), ('DEF Up Dishes'), ('DEF-Boosting Dishes'), ('DMG Taken Dishes'), ('Elemental DMG Bonus Dishes'), 
    ('Elemental DMG Up Dishes'), ('Elemental RES Dishes'), ('Elemental RES Up Dishes'), ('Energy Recharge Increase Dishes'), 
    ('Gliding Stamina Dishes'), ('Healing Dishes'), ('Healing Improvement Dishes'), ('HP Increase Dishes'), ('HP Regen Dishes'), 
    ('HP Restore Dishes'), ('HP Restore Fixed Dishes'), ('HP Restore Percent Dishes'), ('Other Dishes'), ('Physical DMG Bonus Dishes'), 
    ('Physical DMG Dishes'), ('Recovery Dishes'), ('Regeneration Dishes'), ('Revive Dishes'), ('Sheer Cold Dishes'), ('Potions'),
    ('Sheer Cold Resistance Dishes'), ('Shield Strength Dishes'), ('Special Effect Dishes'), ('Sprinting Stamina Dishes'), ('Essential Oils'),
    ('Stamina Dishes'), ('Stamina Increase Dishes'), ('Stamina Reduction Dishes'), ('Stamina Restore Dishes'), ('Swimming Stamina Dishes')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- MATERIAL_TYPES
-- name: MaterialType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS material_types (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO material_types (name) VALUES
    ('Artifact'), ('Artifact Enhancement Material'), ('Character and Weapon Enhancement Material'), 
    ('Cooking'), ('Character Ascension Material'), ('Character EXP Material'), ('Character Level-Up Material'), 
    ('Character Talent Material'), ('Constellation Activation Material'), ('Cosmetic Catalog'), ('Currency'), 
    ('Event Item'), ('Food'), ('Forging Ore'), ('Furnishing'), ('Gadget'), ('Lobby Facility'), ('Material'), 
    ('Precious Item'), ('Quest Item'), ('Refinement Material'), ('Serenitea Pot Material'), ('Weapon'), 
    ('Weapon Ascension Material'), ('Weapon Enhancement Material'), ('Experience'),
    ('Bait'), ('Fish'), ('Gardening Material'), ('Local Specialty')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- MATERIAL_GROUPS
-- name: MaterialGroup
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS material_groups (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO material_groups (name) VALUES
    ('Abyss Mage Material'), ('Activation Device'), ('Admonition Book'), 
    ('Aerosiderite'), ('Agnidus Agate'), ('All-Devouring Narwhal Material'), ('Ancient Chord'), ('Animal'), 
    ('Animal/Indoor Creature'), ('Animal/Outdoor Creature'), ('Artful Devices'), ('Avatar of Lava Material'), 
    ('Azhdaha Material'), ('Ballad Book'), ('Billet'), ('Blazing Sacrificial Heart'), ('Borderland Billet'), 
    ('Boreal Wolf Teeth'), ('Branches of a Distant Sea'), ('Breacher Primus Material'), ('Brilliant Diamond'), 
    ('Building'), ('Building/Fontaine'), ('Building/Free Booth'), ('Building/Hilichurl Style'), ('Building/Inazuma'), 
    ('Building/Liyue'), ('Building/Mercantile'), ('Building/Mondstadt'), ('Building/Natlan'), ('Building/Nod-Krai'), 
    ('Building/Sumeru'), ('Cake for Traveler'), ('Case Record'), ('Chess Piece'), ('Childe Material'), 
    ('Chronicle Cache: Elite'), ('Chronicle Cache: Exceptional'), ('Clockwork Meka Material'), ('Companion'), 
    ('Companion/Companion'), ('Companion/The best travel companion ever!'), ('Conflict Book'), ('Consecrated Beast Material'), 
    ('Contention Book'), ('Cooking Ingredient'), ('Courtyard'), ('Courtyard/Courtyard Wall'), ('Courtyard/Large Ornament'), 
    ('Decarabian Tile'), ('Decoration'), ('Decoration/Ceiling'), ('Decoration/Ceiling Lamp'), ('Decoration/Flooring'), 
    ('Decoration/Room Door'), ('Decoration/Stairs'), ('Decoration/Wall'), ('Delirious Mask of the Sacred Lord'), 
    ('Diligence Book'), ('Domain Reliquary'), ('Dvalin Material'), ('Elegance Book'), ('Elixir'), ('Elysium Book'), 
    ('Equity Book'), ('Everlasting Lord of Arcane Wisdom Material'), ('Evermoon Seal'), ('Exterior Furnishing'), 
    ('Fatui Cicin Mage Material'), ('Fatui Operative Material'), ('Fatui Oprichniki Material'), ('Fatui Pyro Agent Material'), 
    ('Fatui Skirmisher Material'), ('Festive Fever'), ('Firework'), ('Fisher of Hidden Depths Material'), 
    ('Fontemer Aberrant Material'), ('Freedom Book'), ('Frostnight Scion Material'), ('Fungus Material'), 
    ('Furnace Shell Mountain Weasel Material'), ('Furnishing Subsystem'), ('Gladiator Shackle'), 
    ('Goblets of the Pristine Sea'), ('Gold Book'), ('Category:Golden Entreaties'), ('Guardian of Apep''s Oasis Material'), 
    ('Guidance of the Land'), ('Guyun Pillar'), ('Hilichurl Material'), ('Hilichurl Rogue Material'), 
    ('Hilichurl Shooter Material'), ('Humanoid Ruin Machine Material'), ('Ingenuity Book'), ('Interior Furnishing'), 
    ('Irismoon Seal'), ('Irismoon Seals'), ('Jade Field'), ('Justice Book'), ('Kamera Gadget'), 
    ('Khvarena Inscription Fragment'), ('Kindling Book'), ('Korybantes'), ('Korybantes Score'), ('La Signora Material'), 
    ('Landcruiser Material'), ('Landform'), ('Landform/Field'), ('Landform/Floating Platform'), ('Landform/Large Shrub'), 
    ('Landform/Mountain'), ('Landform/Rock'), ('Landform/Small Shrub'), ('Landform/Tree'), ('Landscape'), 
    ('Landscape/Curio'), ('Landscape/Large Object'), ('Landscape/Lighting'), ('Landscape/Ornament'), 
    ('Landscape/Realm Mechanism'), ('Landscape/Small Object'), ('Landscape/Special Object'), ('Landscape/Terrace'), 
    ('Large Furnishing'), ('Large Furnishing/Bed'), ('Large Furnishing/Bookcase'), ('Large Furnishing/Cabinet'), 
    ('Large Furnishing/Counter'), ('Large Furnishing/Fish Tank'), ('Large Furnishing/Table'), ('Light Book'), 
    ('Local Specialty'), ('Long Night Flints'), ('Lord of Eroded Primal Fire Material'), ('Lupus Boreas Material'), 
    ('Lustrous Materials'), ('Luxuriant Glebe'), ('Magatsu Mitake Narukami no Mikoto Material'), ('Main Building'), 
    ('Main Building/Mansion'), ('Memory'), ('Midlander Billet'), ('Mineral'), ('Mini Seelie'), ('Mirror Maiden Material'), 
    ('Mitachurl Material'), ('Moonlight Book'), ('Music Gadget'), ('Mysterious Stone Slate'), ('Nagadus Emerald'), 
    ('Narukami''s Magatama'), ('Natlan Saurian Material'), ('Night-Wind''s Mystic'), ('Nobushi Material'), 
    ('Northlander Billet'), ('Oasis Garden'), ('Obsidian Fragment'), ('Obsidian Ring'), ('Oculus'), 
    ('Oculus Resonance Stone'), ('Oni Mask'), ('Order Book'), ('Orderly Meadow'), ('Ornaments'), ('Ornaments/Lighting'), 
    ('Ornaments/Memento'), ('Ornaments/Potted Plant'), ('Ornaments/Utensil'), ('Outdoor Furnishing'), 
    ('Outdoor Furnishing/Cabinet'), ('Outdoor Furnishing/Fence'), ('Outdoor Furnishing/Fish Pond'), 
    ('Outdoor Furnishing/Furnishing Set'), ('Outdoor Furnishing/Paving'), ('Outdoor Furnishing/Seating'), 
    ('Outdoor Furnishing/Table'), ('Outdoor Furnishing/Waypoint'), ('Philosophies of the Land'), 
    ('Praetorian Golem Material'), ('Praxis Book'), ('Primal Construct Material'), ('Prithiva Topaz'), ('Prosperity Book'), 
    ('Radiant Beast Material'), ('Radiant Spincrystal'), ('Redemption Voucher'), ('Resistance Book'), 
    ('Riftwolf Material'), ('Ruin Drake Material'), ('Ruin Sentinel Material'), ('Sacred Dewdrop'), ('Sacred Seal'), 
    ('Samachurl Material'), ('Sauroform Tribal Warrior Material'), ('Scorching Might'), 
    ('Secret Source Automaton: Hunter-Seeker Material'), ('Shivada Jade'), ('Shrine of Depths Key'), ('Slime Material'),
    ('Specter Material'), ('State-Shifted Fungus Material'), ('Tainted Hydro Phantasm Material'),
    ('Talent Book'), ('Talisman of the Forest Dew'), ('Tenebrous Mimesis Material'),
    ('The Black Serpents Material'), ('The Doctor Material'), ('The Eremites Material'), ('The Game Before the Gate Material'),
    ('The Knave Material'), ('Transience Book'), ('Treasure Hoarder Material'),
    ('Vajrada Amethyst'), ('Varunada Lazurite'), ('Vayuda Turquoise'),
    ('Vishap Material'), ('Wayob Manifestation Material'), ('Weekly Boss Drop'),
    ('Whopperflower Material'), ('Wood'), ('Xuanwen Beast Material'),
    ('Ascension Gem'), ('Dye'), ('Elite Enemy Drop'), ('Event Item'), ('Forging Material'),
    ('Furnishing Material'), ('General Enemy Drop'), ('Normal Boss Drop')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- RARITIES
-- name: Rarity
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS rarities (
    name    SMALLINT        PRIMARY KEY
);
INSERT INTO rarities (name) VALUES
    (1), (2), (3), (4), (5)
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- REGIONS
-- name: Region
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS regions (
    name    VARCHAR(50)     PRIMARY KEY
);
INSERT INTO regions (name) VALUES
    ('Mondstadt'), ('Liyue'), ('Inazuma'), ('Sumeru'), ('Fontaine'), ('Natlan'), ('Nod-Krai')
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
    name    VARCHAR(50)     PRIMARY KEY
);
INSERT INTO artifact_piece_types (name) VALUES
    ('Flower of Life'), ('Plume of Death'), ('Sands of Eon'), ('Goblet of Eonothem'), ('Circlet of Logos')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- ENEMY_TYPES
-- name: EnemyType
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemy_types (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO enemy_types (name) VALUES
    ('Common Enemies'), ('Elite Enemies'), ('Normal Bosses'), ('Special Enemies'), ('Weekly Bosses')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- DOMAIN_LEVELS
-- name: DomainLevel
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS domain_levels (
    name VARCHAR(10) PRIMARY KEY
);
INSERT INTO domain_levels (name) VALUES
    ('I'), ('II'), ('III'), ('IV')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- ENEMY_FAMILIES
-- name: EnemyFamily
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemy_families (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO enemy_families (name) VALUES
    ('Automatons'), ('Elemental Lifeforms'), ('Hilichurls'), ('Mystical Beasts'),
    ('The Abyss'), ('Fatui'), ('Enemies of Note'), ('Other Human Factions'), ('Other')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- CHARACTER_MODELS
-- name: CharacterModel
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS character_models (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO character_models (name) VALUES
    ('Tall Male'), ('Medium Male'), ('Short Male'), ('Tall Female'), ('Medium Female'), ('Short Female')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- ENEMY_GROUPS
-- name: EnemyGroup
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemy_groups (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO enemy_groups (name) VALUES
    ('Category:Enemies by Group'), ('Abyss Herald'), ('Abyss Lector'), ('Abyss Mage'), 
    ('Avatar of Lava'), ('Bathysmal Vishap'), ('Breacher Primus'), ('Cicin'), ('Clockwork Meka'), 
    ('Consecrated Beast'), ('Fatui Cicin Mage'), ('Fatui Operative'), ('Fatui Oprichnik'), 
    ('Fatui Skirmisher'), ('Fontemer Aberrant'), ('Frostnight Scion'), ('Fungus'), 
    ('Hilichurl Grenadier (Enemy Group)'), ('Hilichurl Guard'), ('Hilichurl Rogue'), 
    ('Hilichurl Shooter (Enemy Group)'), ('Humanoid Ruin Machine'), ('Hydro Mimic'), 
    ('Hypostasis'), ('Kairagi'), ('Landcruiser'), ('Lawachurl'), ('Maguu Kenki: Three Shadows'), 
    ('Millelith/Enemy Group'), ('Mitachurl'), ('Natlan Saurian'), ('Nobushi'), ('Ochimusha'), 
    ('Polychrome Tri-Stars'), ('Primal Construct'), ('Proliferating Organism'), ('Radiant Beast'), 
    ('Regisvine'), ('Riftwolf'), ('Ruin Drake'), ('Ruin Machine'), ('Ruin Sentinel'), 
    ('Samachurl'), ('Sauroform Tribal Warrior'), ('Secret Source Automaton'), 
    ('Shogunate Samurai'), ('Slime'), ('Specter'), ('Spirit of Omen'), ('Tainted Hydro Phantasm'), 
    ('Tenebrous Mimesis'), ('The Black Serpents'), ('The Eremites/Enemy Group'), 
    ('Treasure Hoarder Potioneer'), ('Treasure Hoarders/Enemy Group'), ('Vishap'), 
    ('Wasteland Wild Hunt'), ('Wayob Manifestation'), ('Whopperflower')
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
    icon            VARCHAR(200),
    icon_name       VARCHAR(150),
    "type"          VARCHAR(50),
    "group"         VARCHAR(50),
    region          VARCHAR(50),
    rarity          SMALLINT,
    description     TEXT,
    how_to_obtain   JSONB,
    version         VARCHAR(10),
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT fk_materials_type FOREIGN KEY ("type") REFERENCES material_types(name),
    CONSTRAINT fk_materials_group FOREIGN KEY ("group") REFERENCES material_groups(name),
    CONSTRAINT fk_materials_region FOREIGN KEY (region) REFERENCES regions(name)
);
CREATE OR REPLACE TRIGGER trg_materials_protect_created
    BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- MATERIALS_GROUPS_JOIN
-- name: MaterialGroupJoin
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS materials_groups_join (
    id              SERIAL          PRIMARY KEY,
    material_id     INT             NOT NULL,
    "group"         VARCHAR(50),
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT uq_materials_groups_join_material_group UNIQUE (material_id, "group"),
    CONSTRAINT fk_materials_groups_join_material FOREIGN KEY (material_id) REFERENCES materials(id),
    CONSTRAINT fk_materials_groups_join_group FOREIGN KEY ("group") REFERENCES material_groups(name)
);
CREATE OR REPLACE TRIGGER trg_materials_groups_join_protect_created
    BEFORE UPDATE ON materials_groups_join
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_materials_groups_join_updated_at
    BEFORE UPDATE ON materials_groups_join
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- FOODS
-- name: Food
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS foods (
    id                      SERIAL          PRIMARY KEY,
    name                    VARCHAR(100)    NOT NULL UNIQUE,
    description_normal      TEXT,
    description_delicious   TEXT,
    description_suspicious  TEXT,
    effect                  TEXT,
    type                    VARCHAR(50),
    icon_normal             VARCHAR(100),
    icon_normal_name        VARCHAR(150),
    icon_delicious          VARCHAR(100),
    icon_delicious_name     VARCHAR(150),
    icon_suspicious         VARCHAR(100),
    icon_suspicious_name    VARCHAR(150),
    rarity                  SMALLINT,
    proficiency             SMALLINT,
    base_dish_id            INT,
    events                  JSONB,
    region                  VARCHAR(50),
    how_to_obtain           JSONB,
    effects                 JSONB,
    effect_normal           TEXT,
    effect_delicious        TEXT,
    effect_suspicious       TEXT,
    version                 VARCHAR(10),
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT,

    CONSTRAINT fk_foods_region FOREIGN KEY (region) REFERENCES regions(name),
    CONSTRAINT fk_foods_type FOREIGN KEY (type) REFERENCES food_types(name),
    CONSTRAINT fk_foods_base_dish FOREIGN KEY (base_dish_id) REFERENCES foods(id)
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
    affiliations                JSONB,
    how_to_obtain               JSONB,
    is_traveler                 BOOLEAN         NOT NULL DEFAULT FALSE,
    namecard_description        TEXT            NOT NULL,
    namecard_sources            JSONB,
    namecard_icon               VARCHAR(100)    NOT NULL,
    namecard_icon_name          VARCHAR(150),
    namecard_background         VARCHAR(100)    NOT NULL,
    namecard_background_name    VARCHAR(150),
    namecard_banner             VARCHAR(100)    NOT NULL,
    namecard_banner_name        VARCHAR(150),
    card_icon                   VARCHAR(100)    NOT NULL,
    card_icon_name              VARCHAR(150),
    card_icon_2                 VARCHAR(100),
    card_icon_2_name            VARCHAR(150),
    wish_icon                   VARCHAR(100)    NOT NULL,
    wish_icon_name              VARCHAR(150),
    ingame_icon_name            VARCHAR(150),
    ingame_icon                 VARCHAR(100)    NOT NULL,
    ingame_icon_2_name          VARCHAR(150),
    ingame_icon_2               VARCHAR(100),
    icon                        VARCHAR(100)    NOT NULL,
    icon_name                   VARCHAR(150),
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
    CONSTRAINT fk_characters_rarity FOREIGN KEY (rarity) REFERENCES rarities(name),
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
    icon_name       VARCHAR(150),
    icon            VARCHAR(100)    NOT NULL,
    icon_2_name     VARCHAR(150),
    icon_2          VARCHAR(100),
    icon_ascension  VARCHAR(100),
    icon_ascension_name VARCHAR(150),
    how_to_obtain   JSONB,
    release_date    DATE,
    effects         JSONB,
    primary_stat    VARCHAR(50),
    secondary_stat  VARCHAR(50),
    version         VARCHAR(10),
    description     TEXT,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT fk_weapons_type FOREIGN KEY (type) REFERENCES weapon_types(name),
    CONSTRAINT fk_weapons_primary_stat FOREIGN KEY (primary_stat) REFERENCES stats(name),
    CONSTRAINT fk_weapons_secondary_stat FOREIGN KEY (secondary_stat) REFERENCES stats(name)
);
CREATE OR REPLACE TRIGGER trg_weapons_protect_created
    BEFORE UPDATE ON weapons
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_weapons_updated_at
    BEFORE UPDATE ON weapons
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- WEAPONS_REFINEMENTS
-- name: WeaponRefinement
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS weapons_refinements (
    id              SERIAL          PRIMARY KEY,
    weapon_id       INT             NOT NULL,
    material_id     INT             NOT NULL,
    description     TEXT,
    quantity        INT             NOT NULL,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT fk_weapons_refinements_weapon FOREIGN KEY (weapon_id) REFERENCES weapons(id),
    CONSTRAINT fk_weapons_refinements_material FOREIGN KEY (material_id) REFERENCES materials(id)
);
CREATE OR REPLACE TRIGGER trg_weapons_refinements_protect_created
    BEFORE UPDATE ON weapons_refinements
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_weapons_refinements_updated_at
    BEFORE UPDATE ON weapons_refinements
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- WEAPONS_ASCENSIONS
-- name: WeaponAscension
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS weapons_ascensions (
    id                      SERIAL          PRIMARY KEY,
    weapon_id               INT             NOT NULL,
    phase                   SMALLINT        NOT NULL,
    primary_stat_value      REAL            NOT NULL,
    secondary_stat_value    REAL            NOT NULL,
    start_level_from        SMALLINT,
    start_level_to          SMALLINT,
    end_level_from          SMALLINT,
    end_level_to            SMALLINT,
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT,

    CONSTRAINT uq_weapons_ascensions_weapon_phase UNIQUE (weapon_id, phase),
    CONSTRAINT fk_weapons_ascensions_weapon FOREIGN KEY (weapon_id) REFERENCES weapons(id)
);
CREATE OR REPLACE TRIGGER trg_weapons_ascensions_protect_created
    BEFORE UPDATE ON weapons_ascensions
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_weapons_ascensions_updated_at
    BEFORE UPDATE ON weapons_ascensions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- WEAPONS_ASCENSIONS_COST
-- name: WeaponAscensionCost
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS weapons_ascensions_cost (
    id                      SERIAL          PRIMARY KEY,
    weapon_ascension_id     INT             NOT NULL,
    material_id             INT             NOT NULL,
    quantity                INT             NOT NULL,
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT,

    CONSTRAINT uq_weapons_ascensions_cost_weapon_ascension_material UNIQUE (weapon_ascension_id, material_id),
    CONSTRAINT fk_weapons_ascensions_cost_material_ascension_id FOREIGN KEY (weapon_ascension_id) REFERENCES weapons_ascensions(id),
    CONSTRAINT fk_weapons_ascensions_cost_material FOREIGN KEY (material_id) REFERENCES materials(id)
);
CREATE OR REPLACE TRIGGER trg_weapons_ascensions_cost_protect_created
    BEFORE UPDATE ON weapons_ascensions_cost
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_weapons_ascensions_cost_updated_at
    BEFORE UPDATE ON weapons_ascensions_cost
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- ARTIFACTS
-- name: Artifact
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifacts (
    id                          SERIAL          PRIMARY KEY,
    name                        VARCHAR(100)    NOT NULL UNIQUE,
    icon                        VARCHAR(100)    NOT NULL,
    icon_name                   VARCHAR(150),
    how_to_obtain_quality_1     JSONB,
    how_to_obtain_quality_2     JSONB,
    how_to_obtain_quality_3     JSONB,
    how_to_obtain_quality_4     JSONB,
    how_to_obtain_quality_5     JSONB,
    version                     VARCHAR(10),
    effects                     JSONB,
    two_piece                   TEXT,
    four_piece                  TEXT,
    has_rarity_1                BOOLEAN         NOT NULL DEFAULT FALSE,
    has_rarity_2                BOOLEAN         NOT NULL DEFAULT FALSE,
    has_rarity_3                BOOLEAN         NOT NULL DEFAULT FALSE,
    has_rarity_4                BOOLEAN         NOT NULL DEFAULT FALSE,
    has_rarity_5                BOOLEAN         NOT NULL DEFAULT TRUE,
    deleted                     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by                  INT             NOT NULL,
    updated_at                  TIMESTAMP,
    updated_by                  INT
);
CREATE OR REPLACE TRIGGER trg_artifacts_protect_created
    BEFORE UPDATE ON artifacts
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_artifacts_updated_at
    BEFORE UPDATE ON artifacts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- ARTIFACTS_PIECES
-- name: ArtifactPiece
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifacts_pieces (
    id          SERIAL          PRIMARY KEY,
    artifact_id INT             NOT NULL,
    icon        VARCHAR(100)    NOT NULL,
    icon_name   VARCHAR(150),
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
-- BACKGROUNDS
-- name: Background
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS backgrounds (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    image           VARCHAR(200),
    image_name      VARCHAR(150),
    preview         VARCHAR(200),
    preview_name    VARCHAR(150),
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
-- BANNERS
-- name: Banner
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners (
    id              SERIAL          PRIMARY KEY,
    version         VARCHAR(10)     NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    icon            VARCHAR(200),
    icon_name       VARCHAR(150),
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
-- BANNERS_CHARACTERS
-- name: BannerCharacter
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners_characters (
    id              SERIAL          PRIMARY KEY,
    banner_id       INT             NOT NULL,
    character_id    INT             NOT NULL,
    "order"         SMALLINT        NOT NULL CHECK ("order" >= 1),
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
    "order"         SMALLINT        NOT NULL CHECK ("order" >= 1),
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
-- CHARACTERS_VOICE_OVERS
-- name: CharacterVoiceOver
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_voice_overs (
    id                              SERIAL          PRIMARY KEY,
    character_id                    INT             NOT NULL,   -- default element variant 1/7 
    character_id_2                  INT             NULL,       -- another element variant 2/7
    character_id_3                  INT             NULL,       -- another element variant 3/7
    character_id_4                  INT             NULL,       -- another element variant 4/7
    character_id_5                  INT             NULL,       -- another element variant 5/7
    character_id_6                  INT             NULL,       -- another element variant 6/7
    character_id_7                  INT             NULL,       -- another element variant 7/7
    "order"                         SMALLINT        NOT NULL CHECK ("order" >= 1),
    type                            VARCHAR(50)     NOT NULL,
    title_english                   VARCHAR(100)    NOT NULL,
    title_japanese                  VARCHAR(100),
    title_chinese                   VARCHAR(100),
    title_chinese_traditional       VARCHAR(100),
    title_korean                    VARCHAR(100),
    text_english                    TEXT,
    text_japanese                   TEXT,
    text_chinese                    TEXT,
    text_chinese_traditional        TEXT,
    text_korean                     TEXT,
    text_japanese_reading           TEXT,
    text_chinese_reading            TEXT,
    text_korean_reading             TEXT,
    audio_english                   VARCHAR(255),
    audio_japanese                  VARCHAR(255),
    audio_chinese                   VARCHAR(255),
    audio_korean                    VARCHAR(255),
    deleted                         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at                      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by                      INT             NOT NULL,
    updated_at                      TIMESTAMP,
    updated_by                      INT,

    CONSTRAINT fk_characters_voice_overs_type       FOREIGN KEY (type)         REFERENCES voice_over_types(name),
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
    state           VARCHAR(50),
    is_biological   BOOLEAN         NOT NULL DEFAULT FALSE,
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
    icon_name       VARCHAR(150),
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
    "order"         SMALLINT        NOT NULL CHECK ("order" >= 1),
    character_id    INT             NOT NULL,
    icon            VARCHAR(100)    NOT NULL,
    icon_name       VARCHAR(150),
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
    character_id            INT             NOT NULL,
    "order"                 SMALLINT        NOT NULL CHECK ("order" >= 1),
    level                   SMALLINT        NOT NULL,
    material_id             INT             NOT NULL,
    quantity                INT             NOT NULL,
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT,

    CONSTRAINT uq_characters_talents_cost_character_level UNIQUE (character_id, level, material_id),
    CONSTRAINT fk_characters_talents_cost_characters_id FOREIGN KEY (character_id) REFERENCES characters(id),
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
    character_id        INT             NOT NULL,   -- default element variant 1/7 
    character_id_2      INT             NULL,       -- another element variant 2/7
    character_id_3      INT             NULL,       -- another element variant 3/7
    character_id_4      INT             NULL,       -- another element variant 4/7
    character_id_5      INT             NULL,       -- another element variant 5/7
    character_id_6      INT             NULL,       -- another element variant 6/7
    character_id_7      INT             NULL,       -- another element variant 7/7
    phase               SMALLINT        NOT NULL,
    primary_stat        VARCHAR(50)     NOT NULL,
    primary_stat_value  REAL            NOT NULL,
    start_level_hp      REAL            NOT NULL,
    start_level_atk     REAL            NOT NULL,
    start_level_def     REAL            NOT NULL,
    end_level_hp        REAL            NOT NULL,
    end_level_atk       REAL            NOT NULL,
    end_level_def       REAL            NOT NULL,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT uq_characters_ascensions_character_phase UNIQUE (character_id, phase),
    CONSTRAINT fk_characters_ascensions_character FOREIGN KEY (character_id) REFERENCES characters(id),
    CONSTRAINT fk_characters_ascensions_character_2 FOREIGN KEY (character_id_2) REFERENCES characters(id),
    CONSTRAINT fk_characters_ascensions_character_3 FOREIGN KEY (character_id_3) REFERENCES characters(id),
    CONSTRAINT fk_characters_ascensions_character_4 FOREIGN KEY (character_id_4) REFERENCES characters(id),
    CONSTRAINT fk_characters_ascensions_character_5 FOREIGN KEY (character_id_5) REFERENCES characters(id),
    CONSTRAINT fk_characters_ascensions_character_6 FOREIGN KEY (character_id_6) REFERENCES characters(id),
    CONSTRAINT fk_characters_ascensions_character_7 FOREIGN KEY (character_id_7) REFERENCES characters(id),
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
    "order"                 SMALLINT        NOT NULL CHECK ("order" >= 1),
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
    "order"             SMALLINT        NOT NULL CHECK ("order" >= 1),
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
    "order"             SMALLINT        NOT NULL CHECK ("order" >= 1),
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
    "order"             SMALLINT        NOT NULL CHECK ("order" >= 1),
    description         TEXT,
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
-- CHARACTERS_BUILDS_RECOMMENDED_STATS
-- name: CharacterBuildRecommendedStat
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_recommended_stats (
    id                  SERIAL          PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    stat_name           VARCHAR(50)     NOT NULL,
    value_from          REAL            NOT NULL,
    value_to            REAL,
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by          INT             NOT NULL,
    updated_at          TIMESTAMP,
    updated_by          INT,

    CONSTRAINT uq_characters_builds_recommended_stats_character_build_stat UNIQUE (character_build_id, stat_name),
    CONSTRAINT fk_characters_builds_recommended_stats_character_build  FOREIGN KEY (character_build_id) REFERENCES characters_builds(id),
    CONSTRAINT fk_characters_builds_recommended_stats_stat FOREIGN KEY (stat_name) REFERENCES stats(name)
);
CREATE OR REPLACE TRIGGER trg_characters_builds_recommended_stats_protect_created
    BEFORE UPDATE ON characters_builds_recommended_stats
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_characters_builds_recommended_stats_updated_at
    BEFORE UPDATE ON characters_builds_recommended_stats
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- CHARACTERS_BUILDS_MAIN_STATS
-- name: CharacterBuildMainStat
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_builds_main_stats (
    id                  SERIAL          PRIMARY KEY,
    character_build_id  INT             NOT NULL,
    stat_name           VARCHAR(50)     NOT NULL,
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
    stat_name           VARCHAR(50)     NOT NULL,
    recommended_value   VARCHAR(50),
    "order"             SMALLINT        NOT NULL CHECK ("order" >= 1),
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
    "order"             SMALLINT        NOT NULL CHECK ("order" >= 1),,
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
    "order"                     SMALLINT        NOT NULL CHECK ("order" >= 1),
    element                     VARCHAR(50),
    flex                        BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted                     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by                  INT             NOT NULL,
    updated_at                  TIMESTAMP,
    updated_by                  INT,

    CONSTRAINT uq_characters_builds_teams_characters_character_build_team_character_order_element_flex UNIQUE (character_build_team_id, character_id, "order", element, flex),
    CONSTRAINT fk_characters_builds_teams_characters_character_build_team FOREIGN KEY (character_build_team_id) REFERENCES characters_builds_teams(id),
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
    icon                    VARCHAR(100)    NOT NULL,
    icon_name               VARCHAR(150),
    description             TEXT,
    version                 VARCHAR(10),
    interactive_map_link    VARCHAR(200),
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT
);
CREATE OR REPLACE TRIGGER trg_enemies_protect_created
    BEFORE UPDATE ON enemies
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_enemies_updated_at
    BEFORE UPDATE ON enemies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- ENEMIES_PHASES
-- name: EnemyPhase
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemies_phases (
    id                      SERIAL          PRIMARY KEY,
    enemy_id                INT             NOT NULL,
    title                   VARCHAR(100)    NOT NULL,
    secondary_title         VARCHAR(100),
    icon                    VARCHAR(100)    NOT NULL,
    icon_name               VARCHAR(150),
    art                     VARCHAR(100),
    art_name                VARCHAR(150),
    has_weakpoint           BOOLEAN         DEFAULT FALSE,
    living_being_type       VARCHAR(50),
    living_being_family     VARCHAR(50),
    living_being_group      VARCHAR(50),
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT,

    CONSTRAINT fk_enemies_phases_enemy FOREIGN KEY (enemy_id) REFERENCES enemies(id),
    CONSTRAINT fk_enemies_phases_living_being_type FOREIGN KEY (living_being_type) REFERENCES enemy_types(name),
    CONSTRAINT fk_enemies_phases_living_being_family FOREIGN KEY (living_being_family) REFERENCES enemy_families(name),
    CONSTRAINT fk_enemies_phases_group FOREIGN KEY (living_being_group) REFERENCES enemy_groups(name)
);
CREATE OR REPLACE TRIGGER trg_enemies_phases_protect_created
    BEFORE UPDATE ON enemies_phases
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_enemies_phases_updated_at
    BEFORE UPDATE ON enemies_phases
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- ENEMIES_DAMAGE_TYPES_ELEMENTS
-- name: EnemyDamageTypeElement
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemies_damage_types_elements (
    id                      SERIAL          PRIMARY KEY,
    enemy_phase_id          INT             NOT NULL,
    damage_type_element     VARCHAR(50)     NOT NULL,
    "order"                 SMALLINT        NOT NULL CHECK ("order" >= 1),
    deleted                 BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by              INT             NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              INT,

    CONSTRAINT uq_enemies_damage_types_elements_enemy_phase_damage_type_element UNIQUE (enemy_phase_id, damage_type_element),
    CONSTRAINT fk_enemies_damage_types_elements_enemy_phase FOREIGN KEY (enemy_phase_id) REFERENCES enemies_phases(id),
    CONSTRAINT fk_enemies_damage_types_elements_damage_type_element FOREIGN KEY (damage_type_element) REFERENCES elements(name)
);
CREATE OR REPLACE TRIGGER trg_enemies_damage_types_elements_protect_created
    BEFORE UPDATE ON enemies_damage_types_elements
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_enemies_damage_types_elements_updated_at
    BEFORE UPDATE ON enemies_damage_types_elements
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- ENEMIES_DROPS
-- name: EnemyDrop
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS enemies_drops (
    id              SERIAL          PRIMARY KEY,
    enemy_id        INT             NOT NULL,
    material_id     INT,
    artifact_id     INT,
    level_from      INT,
    level_to        INT,
    domain_level    VARCHAR(10),
    world_level     SMALLINT,
    quantity_from   INT,
    quantity_to     INT,
    drop_rate       REAL,
    average         REAL,
    rarity          SMALLINT,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    created_by      INT             NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      INT,

    CONSTRAINT fk_enemies_drops_enemy FOREIGN KEY (enemy_id) REFERENCES enemies(id),
    CONSTRAINT fk_enemies_drops_material FOREIGN KEY (material_id) REFERENCES materials(id),
    CONSTRAINT fk_enemies_drops_domain_level FOREIGN KEY (domain_level) REFERENCES domain_levels(name),
    CONSTRAINT fk_enemies_drops_rarity FOREIGN KEY (rarity) REFERENCES rarities(name)
);
CREATE OR REPLACE TRIGGER trg_enemies_drops_protect_created
    BEFORE UPDATE ON enemies_drops
    FOR EACH ROW EXECUTE FUNCTION protect_created_fields();
CREATE OR REPLACE TRIGGER trg_enemies_drops_updated_at
    BEFORE UPDATE ON enemies_drops
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- FEEDBACK AND CONTACT
-- name: Feedback
--
-- The form on the site has been collecting nothing: it logged to the console
-- and closed. This is where it lands.
--
-- Every field the form can show gets its own column rather than one JSON blob,
-- so the list can be filtered and read without unpacking. Which fields are
-- filled depends on the type: a bug carries steps and behaviour, a suggestion
-- carries details, anything else carries a message.
--
-- Who sent it is optional and separate from whether they were signed in.
-- Someone signed in may still send anonymously, and then nothing identifying
-- is written - not the id, not the name, not the address. `username` is a
-- snapshot rather than a join so a report stays readable after an account is
-- gone, and because the users live in another database.
--
-- `submitter_hash` is a salted hash of the sender's address, not the address.
-- It is only there to rate limit a public endpoint, and a hash does that job
-- without the table becoming a log of who visited from where.
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS feedback (
    id                  SERIAL          PRIMARY KEY,
    type                VARCHAR(20)     NOT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'new',
    section             VARCHAR(100),
    title               VARCHAR(200),

    user_id             INTEGER,
    username            VARCHAR(100),
    email               VARCHAR(255),

    message             TEXT,
    steps_to_reproduce  TEXT,
    expected_behavior   TEXT,
    actual_behavior     TEXT,
    browser_device_info TEXT,
    details             TEXT,
    why_important       TEXT,
    additional_info     TEXT,

    page_url            VARCHAR(500),
    user_agent          VARCHAR(500),
    language            VARCHAR(10),
    submitter_hash      VARCHAR(64),

    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP,

    CONSTRAINT chk_feedback_type   CHECK (type IN ('Bug', 'Suggestion', 'Other')),
    CONSTRAINT chk_feedback_status CHECK (status IN ('new', 'read', 'resolved', 'spam'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status     ON feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_type       ON feedback (type);

-- Rate limiting counts recent rows for one sender, so that pair is the lookup.
CREATE INDEX IF NOT EXISTS idx_feedback_submitter  ON feedback (submitter_hash, created_at DESC);

CREATE OR REPLACE TRIGGER trg_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- AUDIT_LOGS
-- name: AuditLog
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL       PRIMARY KEY,
    table_name  VARCHAR(100)    NOT NULL,
    record_id   VARCHAR(100)    NOT NULL,
    action      VARCHAR(10)     NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by  INTEGER,
    changed_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changes     JSONB
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at   ON audit_logs (changed_at);