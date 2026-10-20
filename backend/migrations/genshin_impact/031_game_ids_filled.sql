-----------------------------------------------------------
-- THE GAME'S OWN IDS, FILLED IN BY NAME
--
-- Generated 2026-10-20 by `php game-ids.php --write-migration` (backend/) from
-- the game's own data lists - the public lists the build analyzer read its
-- catalog from until now - and this site's rows,
-- as https://genshin.anotoki.eu's public lists answered them.
-- Not edited by hand: run the tool again, and only while this file is
-- applied nowhere.
--
-- genshin_impact/030 made `game_id`; this fills it where a name tells it:
-- 136 characters (the Travelers by name and element: every Aether row
-- 10000005, every Lumine row 10000007), 252 weapons and 63 artifact sets.
-- Rows are found by name - and element, for a Traveler - never by a
-- database's row ids, so it applies to the host's database as to this
-- computer's. A row that has an id keeps it, a deleted row is left alone, and
-- an id another live row already holds is filled into nobody (030's indexes
-- allow one live row an id) - so nothing here fails on a database edited
-- since: what it cannot fill stays as it was, for the admin forms' "Game ID".
-- What it leaves without an id, and why:
--   weapons: Prized Isshin Blade (Awakened) - a quest weapon: no list of the game's carries it
--   weapons: Prized Isshin Blade (Shattered) - a quest weapon: no list of the game's carries it
--   weapons: Sword of Narzissenkreuz (Quest) - the quest's copy: the list has one Sword of Narzissenkreuz (11428), which the row of that name takes
--   artifact sets: Initiate - a set nobody can obtain: no list of the game's carries it
--
-- From here on the owner's importer sends `game_id` with what it writes, and
-- the admin forms take one; this file is not run again.
-----------------------------------------------------------

-- 1. Every row as it stands, for the gate: gone with this file's transaction.
CREATE TEMPORARY TABLE game_ids_031_before ON COMMIT DROP AS
    SELECT 'characters'::text AS list, id, game_id FROM characters
    UNION ALL
    SELECT 'weapons', id, game_id FROM weapons
    UNION ALL
    SELECT 'artifacts', id, game_id FROM artifacts;

-- 2. What the names give: the list (a Traveler's rows apart), the name - and
--    a Traveler's element - and the game's id.
CREATE TEMPORARY TABLE game_ids_031 (
    list     TEXT     NOT NULL,
    name     TEXT     NOT NULL,
    element  TEXT,
    game_id  INTEGER  NOT NULL
) ON COMMIT DROP;

INSERT INTO game_ids_031 (list, name, element, game_id) VALUES
    ('characters', 'Aino', NULL, 10000121),
    ('characters', 'Albedo', NULL, 10000038),
    ('characters', 'Alhaitham', NULL, 10000078),
    ('characters', 'Aloy', NULL, 10000062),
    ('characters', 'Alyosha', NULL, 10000148),
    ('characters', 'Amber', NULL, 10000021),
    ('characters', 'Arataki Itto', NULL, 10000057),
    ('characters', 'Arlecchino', NULL, 10000096),
    ('characters', 'Baizhu', NULL, 10000082),
    ('characters', 'Barbara', NULL, 10000014),
    ('characters', 'Beidou', NULL, 10000024),
    ('characters', 'Bennett', NULL, 10000032),
    ('characters', 'Candace', NULL, 10000072),
    ('characters', 'Charlotte', NULL, 10000088),
    ('characters', 'Chasca', NULL, 10000104),
    ('characters', 'Chevreuse', NULL, 10000090),
    ('characters', 'Chiori', NULL, 10000094),
    ('characters', 'Chongyun', NULL, 10000036),
    ('characters', 'Citlali', NULL, 10000107),
    ('characters', 'Clorinde', NULL, 10000098),
    ('characters', 'Collei', NULL, 10000067),
    ('characters', 'Columbina', NULL, 10000125),
    ('characters', 'Cyno', NULL, 10000071),
    ('characters', 'Dahlia', NULL, 10000115),
    ('characters', 'Dehya', NULL, 10000079),
    ('characters', 'Diluc', NULL, 10000016),
    ('characters', 'Diona', NULL, 10000039),
    ('characters', 'Dori', NULL, 10000068),
    ('characters', 'Durin', NULL, 10000123),
    ('characters', 'Emilie', NULL, 10000099),
    ('characters', 'Escoffier', NULL, 10000112),
    ('characters', 'Eula', NULL, 10000051),
    ('characters', 'Faruzan', NULL, 10000076),
    ('characters', 'Fischl', NULL, 10000031),
    ('characters', 'Flins', NULL, 10000120),
    ('characters', 'Freminet', NULL, 10000085),
    ('characters', 'Furina', NULL, 10000089),
    ('characters', 'Gaming', NULL, 10000092),
    ('characters', 'Ganyu', NULL, 10000037),
    ('characters', 'Gorou', NULL, 10000055),
    ('characters', 'Hu Tao', NULL, 10000046),
    ('characters', 'Iansan', NULL, 10000110),
    ('characters', 'Ifa', NULL, 10000113),
    ('characters', 'Illuga', NULL, 10000127),
    ('characters', 'Ineffa', NULL, 10000116),
    ('characters', 'Jahoda', NULL, 10000124),
    ('characters', 'Jean', NULL, 10000003),
    ('characters', 'Kachina', NULL, 10000100),
    ('characters', 'Kaedehara Kazuha', NULL, 10000047),
    ('characters', 'Kaeya', NULL, 10000015),
    ('characters', 'Kamisato Ayaka', NULL, 10000002),
    ('characters', 'Kamisato Ayato', NULL, 10000066),
    ('characters', 'Kaveh', NULL, 10000081),
    ('characters', 'Keqing', NULL, 10000042),
    ('characters', 'Kinich', NULL, 10000101),
    ('characters', 'Kirara', NULL, 10000061),
    ('characters', 'Klee', NULL, 10000029),
    ('characters', 'Kujou Sara', NULL, 10000056),
    ('characters', 'Kuki Shinobu', NULL, 10000065),
    ('characters', 'Lan Yan', NULL, 10000108),
    ('characters', 'Lauma', NULL, 10000119),
    ('characters', 'Layla', NULL, 10000074),
    ('characters', 'Linnea', NULL, 10000130),
    ('characters', 'Lisa', NULL, 10000006),
    ('characters', 'Lohen', NULL, 10000129),
    ('characters', 'Lynette', NULL, 10000083),
    ('characters', 'Lyney', NULL, 10000084),
    ('characters', 'Manekin', NULL, 10000117),
    ('characters', 'Manekina', NULL, 10000118),
    ('characters', 'Mavuika', NULL, 10000106),
    ('characters', 'Mika', NULL, 10000080),
    ('characters', 'Mona', NULL, 10000041),
    ('characters', 'Mualani', NULL, 10000102),
    ('characters', 'Nahida', NULL, 10000073),
    ('characters', 'Navia', NULL, 10000091),
    ('characters', 'Nefer', NULL, 10000122),
    ('characters', 'Neuvillette', NULL, 10000087),
    ('characters', 'Nicole', NULL, 10000131),
    ('characters', 'Nilou', NULL, 10000070),
    ('characters', 'Ningguang', NULL, 10000027),
    ('characters', 'Noelle', NULL, 10000034),
    ('characters', 'Odette', NULL, 10000150),
    ('characters', 'Ororon', NULL, 10000105),
    ('characters', 'Prune', NULL, 10000132),
    ('characters', 'Qiqi', NULL, 10000035),
    ('characters', 'Raiden Shogun', NULL, 10000052),
    ('characters', 'Razor', NULL, 10000020),
    ('characters', 'Rosaria', NULL, 10000045),
    ('characters', 'Sandrone', NULL, 10000133),
    ('characters', 'Sangonomiya Kokomi', NULL, 10000054),
    ('characters', 'Sayu', NULL, 10000053),
    ('characters', 'Sethos', NULL, 10000097),
    ('characters', 'Shenhe', NULL, 10000063),
    ('characters', 'Shikanoin Heizou', NULL, 10000059),
    ('characters', 'Sigewinne', NULL, 10000095),
    ('characters', 'Skirk', NULL, 10000114),
    ('characters', 'Sucrose', NULL, 10000043),
    ('characters', 'Tartaglia', NULL, 10000033),
    ('characters', 'Thoma', NULL, 10000050),
    ('characters', 'Tighnari', NULL, 10000069),
    ('characters', 'Varesa', NULL, 10000111),
    ('characters', 'Varka', NULL, 10000128),
    ('characters', 'Venti', NULL, 10000022),
    ('characters', 'Vesna', NULL, 10000143),
    ('characters', 'Vodyanitsa', NULL, 10000140),
    ('characters', 'Wanderer', NULL, 10000075),
    ('characters', 'Wriothesley', NULL, 10000086),
    ('characters', 'Xiangling', NULL, 10000023),
    ('characters', 'Xianyun', NULL, 10000093),
    ('characters', 'Xiao', NULL, 10000026),
    ('characters', 'Xilonen', NULL, 10000103),
    ('characters', 'Xingqiu', NULL, 10000025),
    ('characters', 'Xinyan', NULL, 10000044),
    ('characters', 'Yae Miko', NULL, 10000058),
    ('characters', 'Yanfei', NULL, 10000048),
    ('characters', 'Yaoyao', NULL, 10000077),
    ('characters', 'Yelan', NULL, 10000060),
    ('characters', 'Yoimiya', NULL, 10000049),
    ('characters', 'Yumemizuki Mizuki', NULL, 10000109),
    ('characters', 'Yun Jin', NULL, 10000064),
    ('characters', 'Zhongli', NULL, 10000030),
    ('characters', 'Zibai', NULL, 10000126),
    ('travelers', 'Aether', 'Anemo', 10000005),
    ('travelers', 'Aether', 'Cryo', 10000005),
    ('travelers', 'Aether', 'Dendro', 10000005),
    ('travelers', 'Aether', 'Electro', 10000005),
    ('travelers', 'Aether', 'Geo', 10000005),
    ('travelers', 'Aether', 'Hydro', 10000005),
    ('travelers', 'Aether', 'Pyro', 10000005),
    ('travelers', 'Lumine', 'Anemo', 10000007),
    ('travelers', 'Lumine', 'Cryo', 10000007),
    ('travelers', 'Lumine', 'Dendro', 10000007),
    ('travelers', 'Lumine', 'Electro', 10000007),
    ('travelers', 'Lumine', 'Geo', 10000007),
    ('travelers', 'Lumine', 'Hydro', 10000007),
    ('travelers', 'Lumine', 'Pyro', 10000007),
    ('weapons', '"The Catch"', NULL, 13415),
    ('weapons', '"Ultimate Overlord''s Mega Magic Sword"', NULL, 12426),
    ('weapons', 'A Teaspoon of Transcendence', NULL, 12516),
    ('weapons', 'A Thousand Blazing Suns', NULL, 12514),
    ('weapons', 'A Thousand Floating Dreams', NULL, 14511),
    ('weapons', 'Absolution', NULL, 11515),
    ('weapons', 'Akuoumaru', NULL, 12416),
    ('weapons', 'Alley Hunter', NULL, 15410),
    ('weapons', 'Amenoma Kageuchi', NULL, 11414),
    ('weapons', 'Amos'' Bow', NULL, 15502),
    ('weapons', 'Angelos'' Heptades', NULL, 14523),
    ('weapons', 'Apprentice''s Notes', NULL, 14101),
    ('weapons', 'Aqua Simulacra', NULL, 15508),
    ('weapons', 'Aquila Favonia', NULL, 11501),
    ('weapons', 'Ash-Graven Drinking Horn', NULL, 14427),
    ('weapons', 'Astral Vulture''s Crimson Plumage', NULL, 15514),
    ('weapons', 'Athame Artis', NULL, 11518),
    ('weapons', 'Azurelight', NULL, 11517),
    ('weapons', 'Ballad of the Boundless Blue', NULL, 14426),
    ('weapons', 'Ballad of the Fjords', NULL, 13424),
    ('weapons', 'Beacon of the Reed Sea', NULL, 12511),
    ('weapons', 'Beginner''s Protector', NULL, 13101),
    ('weapons', 'Beyond the Chrysalis', NULL, 11522),
    ('weapons', 'Black Tassel', NULL, 13303),
    ('weapons', 'Blackcliff Agate', NULL, 14408),
    ('weapons', 'Blackcliff Longsword', NULL, 11408),
    ('weapons', 'Blackcliff Pole', NULL, 13404),
    ('weapons', 'Blackcliff Slasher', NULL, 12408),
    ('weapons', 'Blackcliff Warbow', NULL, 15408),
    ('weapons', 'Blackmarrow Lantern', NULL, 14433),
    ('weapons', 'Blade of Atonement', NULL, 12436),
    ('weapons', 'Bloodsoaked Ruins', NULL, 13516),
    ('weapons', 'Bloodtainted Greatsword', NULL, 12302),
    ('weapons', 'Breezeborne Refrain', NULL, 15437),
    ('weapons', 'Calamity Queller', NULL, 13507),
    ('weapons', 'Calamity of Eshu', NULL, 11432),
    ('weapons', 'Cashflow Supervision', NULL, 14513),
    ('weapons', 'Chain Breaker', NULL, 15431),
    ('weapons', 'Cinnabar Spindle', NULL, 11415),
    ('weapons', 'Clash of Kings', NULL, 14435),
    ('weapons', 'Cloudforged', NULL, 15426),
    ('weapons', 'Compound Bow', NULL, 15407),
    ('weapons', 'Cool Steel', NULL, 11301),
    ('weapons', 'Covenant of Frost and Snow', NULL, 15436),
    ('weapons', 'Crane''s Echoing Call', NULL, 14515),
    ('weapons', 'Crescent Pike', NULL, 13403),
    ('weapons', 'Crimson Moon''s Semblance', NULL, 13512),
    ('weapons', 'Dark Iron Sword', NULL, 11304),
    ('weapons', 'Dawning Frost', NULL, 14434),
    ('weapons', 'Deathmatch', NULL, 13405),
    ('weapons', 'Debate Club', NULL, 12305),
    ('weapons', 'Dialogues of the Desert Sages', NULL, 13426),
    ('weapons', 'Disaster and Remorse', NULL, 13517),
    ('weapons', 'Dodoco Tales', NULL, 14413),
    ('weapons', 'Dragon''s Bane', NULL, 13401),
    ('weapons', 'Dragonspine Spear', NULL, 13409),
    ('weapons', 'Dull Blade', NULL, 11101),
    ('weapons', 'Earth Shaker', NULL, 12431),
    ('weapons', 'Echoes of the Heart', NULL, 14436),
    ('weapons', 'Elegy for the End', NULL, 15503),
    ('weapons', 'Emberwell', NULL, 11436),
    ('weapons', 'Emerald Orb', NULL, 14304),
    ('weapons', 'End of the Line', NULL, 15418),
    ('weapons', 'Engulfing Lightning', NULL, 13509),
    ('weapons', 'Etherlight Spindlelute', NULL, 14432),
    ('weapons', 'Everlasting Moonglow', NULL, 14506),
    ('weapons', 'Exaiphanes Blade', NULL, 11521),
    ('weapons', 'Eye of Perception', NULL, 14409),
    ('weapons', 'Fading Twilight', NULL, 15411),
    ('weapons', 'Fang of the Mountain King', NULL, 12513),
    ('weapons', 'Favonius Codex', NULL, 14401),
    ('weapons', 'Favonius Greatsword', NULL, 12401),
    ('weapons', 'Favonius Lance', NULL, 13407),
    ('weapons', 'Favonius Sword', NULL, 11401),
    ('weapons', 'Favonius Warbow', NULL, 15401),
    ('weapons', 'Ferrous Shadow', NULL, 12301),
    ('weapons', 'Festering Desire', NULL, 11413),
    ('weapons', 'Fillet Blade', NULL, 11305),
    ('weapons', 'Finale of the Deep', NULL, 11425),
    ('weapons', 'Flame-Forged Insight', NULL, 12432),
    ('weapons', 'Fleuve Cendre Ferryman', NULL, 11426),
    ('weapons', 'Flower-Wreathed Feathers', NULL, 15430),
    ('weapons', 'Flowing Purity', NULL, 14425),
    ('weapons', 'Flute of Ezpitzal', NULL, 11431),
    ('weapons', 'Footprint of the Rainbow', NULL, 13431),
    ('weapons', 'Forest Regalia', NULL, 12417),
    ('weapons', 'Forged by the Golden Melody', NULL, 12435),
    ('weapons', 'Fractured Halo', NULL, 13515),
    ('weapons', 'Freedom-Sworn', NULL, 11503),
    ('weapons', 'Frostbearer', NULL, 14412),
    ('weapons', 'Frostbreath', NULL, 13435),
    ('weapons', 'Fruit of Fulfillment', NULL, 14417),
    ('weapons', 'Fruitful Hook', NULL, 12430),
    ('weapons', 'Gest of the Mighty Wolf', NULL, 12515),
    ('weapons', 'Golden Frostbound Oath', NULL, 15516),
    ('weapons', 'Hakushin Ring', NULL, 14414),
    ('weapons', 'Halberd', NULL, 13302),
    ('weapons', 'Hamayumi', NULL, 15414),
    ('weapons', 'Haran Geppaku Futsu', NULL, 11510),
    ('weapons', 'Harbinger of Dawn', NULL, 11302),
    ('weapons', 'Heretic''s Molten Blade', NULL, 11435),
    ('weapons', 'Hunter''s Bow', NULL, 15101),
    ('weapons', 'Hunter''s Path', NULL, 15511),
    ('weapons', 'Hymn of the Maelstrom', NULL, 14524),
    ('weapons', 'Ibis Piercer', NULL, 15419),
    ('weapons', 'Iron Point', NULL, 13201),
    ('weapons', 'Iron Sting', NULL, 11407),
    ('weapons', 'Jade Vista', NULL, 15435),
    ('weapons', 'Jadefall''s Splendor', NULL, 14505),
    ('weapons', 'Kagotsurube Isshin', NULL, 11416),
    ('weapons', 'Kagura''s Verity', NULL, 14509),
    ('weapons', 'Katsuragikiri Nagamasa', NULL, 12414),
    ('weapons', 'Key of Khaj-Nisut', NULL, 11511),
    ('weapons', 'King''s Squire', NULL, 15417),
    ('weapons', 'Kitain Cross Spear', NULL, 13414),
    ('weapons', 'Light of Foliar Incision', NULL, 11512),
    ('weapons', 'Lightbearing Moonshard', NULL, 11519),
    ('weapons', 'Lion''s Roar', NULL, 11405),
    ('weapons', 'Lithic Blade', NULL, 12410),
    ('weapons', 'Lithic Spear', NULL, 13406),
    ('weapons', 'Lost Prayer to the Sacred Winds', NULL, 14502),
    ('weapons', 'Lumidouce Elegy', NULL, 13513),
    ('weapons', 'Luxurious Sea-Lord', NULL, 12412),
    ('weapons', 'Magic Guide', NULL, 14301),
    ('weapons', 'Mailed Flower', NULL, 12418),
    ('weapons', 'Makhaira Aquamarine', NULL, 12415),
    ('weapons', 'Mappa Mare', NULL, 14407),
    ('weapons', 'Master Key', NULL, 12433),
    ('weapons', 'Memory of Dust', NULL, 14504),
    ('weapons', 'Messenger', NULL, 15305),
    ('weapons', 'Missive Windspear', NULL, 13419),
    ('weapons', 'Mistsplitter Reforged', NULL, 11509),
    ('weapons', 'Mitternachts Waltz', NULL, 15412),
    ('weapons', 'Moonpiercer', NULL, 13417),
    ('weapons', 'Moonweaver''s Dawn', NULL, 11434),
    ('weapons', 'Mountain-Bracing Bolt', NULL, 13430),
    ('weapons', 'Mouun''s Moon', NULL, 15416),
    ('weapons', 'New Bough', NULL, 11437),
    ('weapons', 'Nightweaver''s Looking Glass', NULL, 14520),
    ('weapons', 'Nocturne''s Curtain Call', NULL, 14522),
    ('weapons', 'Oathsworn Eye', NULL, 14415),
    ('weapons', 'Old Merc''s Pal', NULL, 12201),
    ('weapons', 'Otherworldly Story', NULL, 14303),
    ('weapons', 'Peak Patrol Song', NULL, 11516),
    ('weapons', 'Pocket Grimoire', NULL, 14201),
    ('weapons', 'Polar Star', NULL, 15507),
    ('weapons', 'Portable Power Saw', NULL, 12427),
    ('weapons', 'Predator', NULL, 15415),
    ('weapons', 'Primordial Jade Cutter', NULL, 11505),
    ('weapons', 'Primordial Jade Winged-Spear', NULL, 13505),
    ('weapons', 'Prospector''s Drill', NULL, 13427),
    ('weapons', 'Prospector''s Shovel', NULL, 13433),
    ('weapons', 'Prototype Amber', NULL, 14406),
    ('weapons', 'Prototype Archaic', NULL, 12406),
    ('weapons', 'Prototype Crescent', NULL, 15406),
    ('weapons', 'Prototype Rancour', NULL, 11406),
    ('weapons', 'Prototype Starglitter', NULL, 13402),
    ('weapons', 'Rainbow Serpent''s Rain Bow', NULL, 15434),
    ('weapons', 'Rainslasher', NULL, 12405),
    ('weapons', 'Range Gauge', NULL, 15427),
    ('weapons', 'Raven Bow', NULL, 15301),
    ('weapons', 'Recurve Bow', NULL, 15303),
    ('weapons', 'Redhorn Stonethresher', NULL, 12510),
    ('weapons', 'Reliquary of Truth', NULL, 14521),
    ('weapons', 'Rightful Reward', NULL, 13425),
    ('weapons', 'Ring of Yaxche', NULL, 14431),
    ('weapons', 'Royal Bow', NULL, 15404),
    ('weapons', 'Royal Greatsword', NULL, 12404),
    ('weapons', 'Royal Grimoire', NULL, 14404),
    ('weapons', 'Royal Longsword', NULL, 11404),
    ('weapons', 'Royal Spear', NULL, 13408),
    ('weapons', 'Rust', NULL, 15405),
    ('weapons', 'Sacrificer''s Staff', NULL, 13434),
    ('weapons', 'Sacrificial Bow', NULL, 15403),
    ('weapons', 'Sacrificial Fragments', NULL, 14403),
    ('weapons', 'Sacrificial Greatsword', NULL, 12403),
    ('weapons', 'Sacrificial Jade', NULL, 14424),
    ('weapons', 'Sacrificial Sword', NULL, 11403),
    ('weapons', 'Sapwood Blade', NULL, 11417),
    ('weapons', 'Scion of the Blazing Sun', NULL, 15424),
    ('weapons', 'Seasoned Hunter''s Bow', NULL, 15201),
    ('weapons', 'Sequence of Solitude', NULL, 15432),
    ('weapons', 'Serenity''s Call', NULL, 11433),
    ('weapons', 'Serpent Spine', NULL, 12409),
    ('weapons', 'Sharpshooter''s Oath', NULL, 15302),
    ('weapons', 'Silver Light', NULL, 11438),
    ('weapons', 'Silver Sword', NULL, 11201),
    ('weapons', 'Silvershower Heartstrings', NULL, 15513),
    ('weapons', 'Skyrider Greatsword', NULL, 12306),
    ('weapons', 'Skyrider Sword', NULL, 11306),
    ('weapons', 'Skyward Atlas', NULL, 14501),
    ('weapons', 'Skyward Blade', NULL, 11502),
    ('weapons', 'Skyward Harp', NULL, 15501),
    ('weapons', 'Skyward Pride', NULL, 12501),
    ('weapons', 'Skyward Spine', NULL, 13502),
    ('weapons', 'Slingshot', NULL, 15304),
    ('weapons', 'Snare Hook', NULL, 15433),
    ('weapons', 'Snow-Tombed Starsilver', NULL, 12411),
    ('weapons', 'Solar Pearl', NULL, 14405),
    ('weapons', 'Song of Broken Pines', NULL, 12503),
    ('weapons', 'Song of Stillness', NULL, 15425),
    ('weapons', 'Song of the Vigil', NULL, 13436),
    ('weapons', 'Splendor of Tranquil Waters', NULL, 11513),
    ('weapons', 'Staff of Homa', NULL, 13501),
    ('weapons', 'Staff of the Scarlet Sands', NULL, 13511),
    ('weapons', 'Starcaller''s Watch', NULL, 14517),
    ('weapons', 'Sturdy Bone', NULL, 11430),
    ('weapons', 'Summit Shaper', NULL, 11504),
    ('weapons', 'Sunny Morning Sleep-In', NULL, 14518),
    ('weapons', 'Surf''s Up', NULL, 14516),
    ('weapons', 'Sword of Descension', NULL, 11412),
    ('weapons', 'Sword of Narzissenkreuz', NULL, 11428),
    ('weapons', 'Symphonist of Scents', NULL, 13514),
    ('weapons', 'Talking Stick', NULL, 12424),
    ('weapons', 'Tamayuratei no Ohanashi', NULL, 13432),
    ('weapons', 'The Alley Flash', NULL, 11410),
    ('weapons', 'The Bell', NULL, 12402),
    ('weapons', 'The Black Sword', NULL, 11409),
    ('weapons', 'The Daybreak Chronicles', NULL, 15515),
    ('weapons', 'The Dockhand''s Assistant', NULL, 11427),
    ('weapons', 'The First Great Magic', NULL, 15512),
    ('weapons', 'The Flute', NULL, 11402),
    ('weapons', 'The Stringless', NULL, 15402),
    ('weapons', 'The Unforged', NULL, 12504),
    ('weapons', 'The Viridescent Hunt', NULL, 15409),
    ('weapons', 'The Widsith', NULL, 14402),
    ('weapons', 'Thrilling Tales of Dragon Slayers', NULL, 14302),
    ('weapons', 'Thundering Pulse', NULL, 15509),
    ('weapons', 'Tidal Shadow', NULL, 12425),
    ('weapons', 'Tome of the Eternal Flow', NULL, 14514),
    ('weapons', 'Toukabou Shigure', NULL, 11422),
    ('weapons', 'Traveler''s Handy Sword', NULL, 11303),
    ('weapons', 'Tulaytullah''s Remembrance', NULL, 14512),
    ('weapons', 'Twin Nephrite', NULL, 14305),
    ('weapons', 'Uraku Misugiri', NULL, 11514),
    ('weapons', 'Verdict', NULL, 12512),
    ('weapons', 'Vivid Notions', NULL, 14519),
    ('weapons', 'Vortex Vanquisher', NULL, 13504),
    ('weapons', 'Wandering Evenstar', NULL, 14416),
    ('weapons', 'Waster Greatsword', NULL, 12101),
    ('weapons', 'Wavebreaker''s Fin', NULL, 13416),
    ('weapons', 'Waveriding Whirl', NULL, 14430),
    ('weapons', 'White Iron Greatsword', NULL, 12303),
    ('weapons', 'White Tassel', NULL, 13301),
    ('weapons', 'Whiteblind', NULL, 12407),
    ('weapons', 'Whitelake Frostfeather', NULL, 11520),
    ('weapons', 'Windblume Ode', NULL, 15413),
    ('weapons', 'Wine and Song', NULL, 14410),
    ('weapons', 'Winter''s Heavy Heart', NULL, 14437),
    ('weapons', 'Wolf''s Gravestone', NULL, 12502),
    ('weapons', 'Wolf-Fang', NULL, 11424),
    ('weapons', 'Xiphos'' Moonlight', NULL, 11418),
    ('artifacts', 'A Day Carved From Rising Winds', NULL, 15044),
    ('artifacts', 'Adventurer', NULL, 10010),
    ('artifacts', 'Archaic Petra', NULL, 15014),
    ('artifacts', 'Aubade of Morningstar and Moon', NULL, 15043),
    ('artifacts', 'Berserker', NULL, 10005),
    ('artifacts', 'Blizzard Strayer', NULL, 14001),
    ('artifacts', 'Bloodstained Chivalry', NULL, 15008),
    ('artifacts', 'Brave Heart', NULL, 10002),
    ('artifacts', 'Celestial Gift', NULL, 15045),
    ('artifacts', 'Crimson Witch of Flames', NULL, 15006),
    ('artifacts', 'Deepwood Memories', NULL, 15025),
    ('artifacts', 'Defender''s Will', NULL, 10003),
    ('artifacts', 'Desert Pavilion Chronicle', NULL, 15027),
    ('artifacts', 'Disenchantment in Deep Shadow', NULL, 15046),
    ('artifacts', 'Echoes of an Offering', NULL, 15024),
    ('artifacts', 'Emblem of Severed Fate', NULL, 15020),
    ('artifacts', 'Finale of the Deep Galleries', NULL, 15040),
    ('artifacts', 'Flower of Paradise Lost', NULL, 15028),
    ('artifacts', 'Fragment of Harmonic Whimsy', NULL, 15035),
    ('artifacts', 'Gambler', NULL, 10008),
    ('artifacts', 'Gilded Dreams', NULL, 15026),
    ('artifacts', 'Gladiator''s Finale', NULL, 15001),
    ('artifacts', 'Golden Troupe', NULL, 15032),
    ('artifacts', 'Heart of Depth', NULL, 15016),
    ('artifacts', 'Heart of the Furnace', NULL, 15048),
    ('artifacts', 'Husk of Opulent Dreams', NULL, 15021),
    ('artifacts', 'Instructor', NULL, 10007),
    ('artifacts', 'Lavawalker', NULL, 14003),
    ('artifacts', 'Long Night''s Oath', NULL, 15039),
    ('artifacts', 'Lucky Dog', NULL, 10011),
    ('artifacts', 'Maiden Beloved', NULL, 14004),
    ('artifacts', 'Marechaussee Hunter', NULL, 15031),
    ('artifacts', 'Martial Artist', NULL, 10006),
    ('artifacts', 'Night of the Sky''s Unveiling', NULL, 15041),
    ('artifacts', 'Nighttime Whispers in the Echoing Woods', NULL, 15034),
    ('artifacts', 'Noblesse Oblige', NULL, 15007),
    ('artifacts', 'Nymph''s Dream', NULL, 15029),
    ('artifacts', 'Obsidian Codex', NULL, 15038),
    ('artifacts', 'Ocean-Hued Clam', NULL, 15022),
    ('artifacts', 'Pale Flame', NULL, 15018),
    ('artifacts', 'Prayers for Destiny', NULL, 15010),
    ('artifacts', 'Prayers for Illumination', NULL, 15009),
    ('artifacts', 'Prayers for Wisdom', NULL, 15011),
    ('artifacts', 'Prayers to Springtime', NULL, 15013),
    ('artifacts', 'Resolution of Sojourner', NULL, 10001),
    ('artifacts', 'Retracing Bolide', NULL, 15015),
    ('artifacts', 'Scarlet Proof', NULL, 15047),
    ('artifacts', 'Scholar', NULL, 10012),
    ('artifacts', 'Scroll of the Hero of Cinder City', NULL, 15037),
    ('artifacts', 'Shimenawa''s Reminiscence', NULL, 15019),
    ('artifacts', 'Silken Moon''s Serenade', NULL, 15042),
    ('artifacts', 'Song of Days Past', NULL, 15033),
    ('artifacts', 'Tenacity of the Millelith', NULL, 15017),
    ('artifacts', 'The Exile', NULL, 10009),
    ('artifacts', 'Thundering Fury', NULL, 15005),
    ('artifacts', 'Thundersoother', NULL, 14002),
    ('artifacts', 'Tiny Miracle', NULL, 10004),
    ('artifacts', 'Traveling Doctor', NULL, 10013),
    ('artifacts', 'Unfinished Reverie', NULL, 15036),
    ('artifacts', 'Vermillion Hereafter', NULL, 15023),
    ('artifacts', 'Viridescent Venerer', NULL, 15002),
    ('artifacts', 'Vourukasha''s Glow', NULL, 15030),
    ('artifacts', 'Wanderer''s Troupe', NULL, 15003);

-- 3. Characters that are not Travelers: by name - one live row of it alone
--    (a name is unique with the element, not on its own) - where it has no
--    id yet and no other live row holds this one.
UPDATE characters AS c
   SET game_id = g.game_id
  FROM game_ids_031 AS g
 WHERE g.list = 'characters'
   AND c.name = g.name
   AND c.deleted = FALSE
   AND c.is_traveler = FALSE
   AND c.game_id IS NULL
   AND (SELECT count(*) FROM characters AS d WHERE d.name = c.name AND d.deleted = FALSE AND d.is_traveler = FALSE) = 1
   AND NOT EXISTS (SELECT 1 FROM characters AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE AND o.is_traveler = FALSE);

-- 4. The Travelers: by name and element, one id for every row of each.
UPDATE characters AS c
   SET game_id = g.game_id
  FROM game_ids_031 AS g
 WHERE g.list = 'travelers'
   AND c.name = g.name
   AND c.element = g.element
   AND c.deleted = FALSE
   AND c.is_traveler
   AND c.game_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM characters AS o WHERE o.game_id = g.game_id AND o.element = g.element AND o.deleted = FALSE AND o.is_traveler);

-- 5. Weapons, by name (unique in the table).
UPDATE weapons AS w
   SET game_id = g.game_id
  FROM game_ids_031 AS g
 WHERE g.list = 'weapons'
   AND w.name = g.name
   AND w.deleted = FALSE
   AND w.game_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM weapons AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE);

-- 6. Artifact sets, by name (unique in the table).
UPDATE artifacts AS a
   SET game_id = g.game_id
  FROM game_ids_031 AS g
 WHERE g.list = 'artifacts'
   AND a.name = g.name
   AND a.deleted = FALSE
   AND a.game_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM artifacts AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE);

-- 7. Prove it: no id a row had is lost or changed; every id set is the one
--    the row's name gives; and every live row the list names has its id now,
--    but one whose id another live row holds.
DO $$
DECLARE
    changed TEXT;
    wrong TEXT;
    missed TEXT;
BEGIN
    SELECT string_agg(b.list || ' #' || b.id, ', ' ORDER BY b.list, b.id) INTO changed
      FROM game_ids_031_before AS b
      LEFT JOIN characters AS c ON b.list = 'characters' AND c.id = b.id
      LEFT JOIN weapons AS w ON b.list = 'weapons' AND w.id = b.id
      LEFT JOIN artifacts AS a ON b.list = 'artifacts' AND a.id = b.id
     WHERE b.game_id IS NOT NULL
       AND b.game_id IS DISTINCT FROM COALESCE(c.game_id, w.game_id, a.game_id);
    IF changed IS NOT NULL THEN
        RAISE EXCEPTION '031: rows that had an id lost or changed it: %', changed;
    END IF;

    SELECT string_agg(set_now.label, ', ' ORDER BY set_now.label COLLATE "C") INTO wrong
      FROM (
            SELECT 'character ' || c.name AS label
              FROM characters AS c
              JOIN game_ids_031_before AS b ON b.list = 'characters' AND b.id = c.id AND b.game_id IS NULL
             WHERE c.game_id IS NOT NULL
               AND NOT EXISTS (
                       SELECT 1
                         FROM game_ids_031 AS g
                        WHERE g.game_id = c.game_id
                          AND g.name = c.name
                          AND ((g.list = 'characters' AND NOT c.is_traveler) OR (g.list = 'travelers' AND c.is_traveler AND g.element = c.element)))
            UNION ALL
            SELECT 'weapon ' || w.name
              FROM weapons AS w
              JOIN game_ids_031_before AS b ON b.list = 'weapons' AND b.id = w.id AND b.game_id IS NULL
             WHERE w.game_id IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM game_ids_031 AS g WHERE g.list = 'weapons' AND g.name = w.name AND g.game_id = w.game_id)
            UNION ALL
            SELECT 'artifact set ' || a.name
              FROM artifacts AS a
              JOIN game_ids_031_before AS b ON b.list = 'artifacts' AND b.id = a.id AND b.game_id IS NULL
             WHERE a.game_id IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM game_ids_031 AS g WHERE g.list = 'artifacts' AND g.name = a.name AND g.game_id = a.game_id)
           ) AS set_now;
    IF wrong IS NOT NULL THEN
        RAISE EXCEPTION '031: ids set that their names do not give: %', wrong;
    END IF;

    SELECT string_agg(left_out.label, ', ' ORDER BY left_out.label COLLATE "C") INTO missed
      FROM (
            SELECT 'character ' || c.name AS label
              FROM game_ids_031 AS g
              JOIN characters AS c ON c.name = g.name AND c.deleted = FALSE AND c.is_traveler = FALSE
             WHERE g.list = 'characters'
               AND c.game_id IS NULL
               AND (SELECT count(*) FROM characters AS d WHERE d.name = c.name AND d.deleted = FALSE AND d.is_traveler = FALSE) = 1
               AND NOT EXISTS (SELECT 1 FROM characters AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE AND o.is_traveler = FALSE)
            UNION ALL
            SELECT 'Traveler ' || c.name || ' (' || c.element || ')'
              FROM game_ids_031 AS g
              JOIN characters AS c ON c.name = g.name AND c.element = g.element AND c.deleted = FALSE AND c.is_traveler
             WHERE g.list = 'travelers'
               AND c.game_id IS NULL
               AND NOT EXISTS (SELECT 1 FROM characters AS o WHERE o.game_id = g.game_id AND o.element = g.element AND o.deleted = FALSE AND o.is_traveler)
            UNION ALL
            SELECT 'weapon ' || w.name
              FROM game_ids_031 AS g
              JOIN weapons AS w ON w.name = g.name AND w.deleted = FALSE
             WHERE g.list = 'weapons'
               AND w.game_id IS NULL
               AND NOT EXISTS (SELECT 1 FROM weapons AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE)
            UNION ALL
            SELECT 'artifact set ' || a.name
              FROM game_ids_031 AS g
              JOIN artifacts AS a ON a.name = g.name AND a.deleted = FALSE
             WHERE g.list = 'artifacts'
               AND a.game_id IS NULL
               AND NOT EXISTS (SELECT 1 FROM artifacts AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE)
           ) AS left_out;
    IF missed IS NOT NULL THEN
        RAISE EXCEPTION '031: rows left without the id their name gives: %', missed;
    END IF;
END $$;
