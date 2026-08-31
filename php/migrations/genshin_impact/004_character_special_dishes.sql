-----------------------------------------------------------
-- CHARACTER SPECIAL DISHES
--
-- characters.special_dish has been null for every row since the schema was
-- written, which leaves the dish quiz with nothing to ask about: it shows a
-- character's own dish and asks whose it is.
--
-- The pairings were never lost, only left behind - they are in the old site's
-- data file, old/data/characters.js, which is still in the repository. This
-- reads them back in by name rather than by id, because the ids in that file
-- do not exist here.
--
-- Matching on name is exact and deliberate. A dish that has been renamed since
-- should fail to match and stay null rather than quietly attach itself to the
-- wrong character, so the join below drops anything it cannot resolve. All 89
-- pairings resolve today. The characters with no row here had no dish in the
-- old data either, and the twelve travellers never had one.
--
-- Nothing already set is overwritten, so a dish assigned in the admin site
-- survives a re-run.
-----------------------------------------------------------

WITH pairing (character_name, dish_name) AS (
  VALUES
    ('Albedo', 'Woodland Dream'),
    ('Alhaitham', 'Ideal Circumstance'),
    ('Aloy', 'Satiety Gel'),
    ('Arataki Itto', 'Way of the Strong'),
    ('Baizhu', 'Heat-Quelling Soup'),
    ('Barbara', 'Spicy Stew'),
    ('Beidou', 'Flash-Fried Filet'),
    ('Bennett', 'Teyvat Charred Egg'),
    ('Candace', 'Utmost Care'),
    ('Charlotte', 'Exclusive Scoop: Gourmet Column'),
    ('Chasca', 'Moment of Respite'),
    ('Chiori', '"Fashion Show"'),
    ('Chongyun', 'Cold Noodles with Mountain Delicacies'),
    ('Citlali', 'Secret Art'),
    ('Clorinde', '"Tagged and Bagged"'),
    ('Collei', 'Yearning'),
    ('Cyno', 'Duel Soul'),
    ('Dehya', 'Goldflame Tajine'),
    ('Diluc', '"Once Upon a Time in Mondstadt"'),
    ('Diona', 'Definitely Not Bar Food!'),
    ('Dori', 'Show Me the Mora'),
    ('Emilie', 'A Fragrant Feast of Flavors'),
    ('Escoffier', 'Gateau Debord: Magnifique'),
    ('Eula', 'Stormcrest Pie'),
    ('Faruzan', 'Traditionally-Made Charcoal-Baked Ajilenakh Cake'),
    ('Fischl', 'Die Heilige Sinfonie'),
    ('Freminet', '"Seabird''s Sojourn"'),
    ('Furina', '"Pour la Justice"'),
    ('Gaming', 'Yummy Yum Cha'),
    ('Ganyu', 'Prosperous Peace'),
    ('Gorou', 'Victorious Legend'),
    ('Hu Tao', 'Ghostly March'),
    ('Iansan', 'Gold-Standard Healthy Meal'),
    ('Ifa', 'Emotional Support'),
    ('Jean', 'Invigorating Pizza'),
    ('Kachina', 'Impeccably Organized'),
    ('Kaedehara Kazuha', 'All-Weather Beauty'),
    ('Kaeya', 'Fruity Skewers'),
    ('Kamisato Ayaka', '"Snow on the Hearth"'),
    ('Kamisato Ayato', 'Quiet Elegance'),
    ('Kaveh', 'The Endeavor'),
    ('Keqing', 'Survival Grilled Fish'),
    ('Kirara', 'Energizing Bento'),
    ('Klee', 'Fish-Flavored Toast'),
    ('Kujou Sara', 'Faith Eternal'),
    ('Kuki Shinobu', 'Omurice Waltz'),
    ('Lan Yan', 'Jade-Cut Flowers'),
    ('Layla', 'Extravagant Slumber'),
    ('Lisa', 'Mysterious Bolognese'),
    ('Lynette', 'A Leisurely Sip'),
    ('Lyney', 'Cubic Tricks'),
    ('Mavuika', 'Hymn of Gathered Flame'),
    ('Mona', 'Der Weisheit Letzter Schluss (Life)'),
    ('Mualani', 'Pass the Luck'),
    ('Nahida', 'Halvamazd'),
    ('Navia', '"Pick What You Like!"'),
    ('Neuvillette', '"Consommé Purete"'),
    ('Nilou', 'Swirling Steps'),
    ('Ningguang', 'Qiankun Mora Meat'),
    ('Noelle', 'Lighter-Than-Air Pancake'),
    ('Ororon', 'Honey-Glazed Ceviche'),
    ('Qiqi', 'No Tomorrow'),
    ('Razor', 'Puppy-Paw Hash Brown'),
    ('Rosaria', 'Dinner of Judgment'),
    ('Sangonomiya Kokomi', 'A Stunning Stratagem'),
    ('Sayu', 'Dizziness-Be-Gone no Jutsu Version 2.0'),
    ('Sethos', 'Super-Dee-Duper Delicious Meat Roll'),
    ('Shenhe', 'Heartstring Noodles'),
    ('Shikanoin Heizou', 'The Only Truth'),
    ('Sigewinne', 'Well-Balanced Meal'),
    ('Sucrose', 'Nutritious Meal (V.593)'),
    ('Tartaglia', 'A Prize Catch'),
    ('Thoma', '"Warmth"'),
    ('Varesa', 'Mt. Mushroom (For One)'),
    ('Venti', 'A Buoyant Breeze'),
    ('Wanderer', 'Shimi Chazuke'),
    ('Wriothesley', 'Secret Sauce BBQ Ribs'),
    ('Xianyun', 'Encompassing Gladness'),
    ('Xiao', '"Sweet Dream"'),
    ('Xilonen', 'Fruit-Flavored Milk Candies'),
    ('Xingqiu', 'All-Delicacy Parcels'),
    ('Yae Miko', 'Fukuuchi Udon'),
    ('Yanfei', '"My Way"'),
    ('Yaoyao', 'Qingce Household Dish'),
    ('Yelan', 'Dew-Dipped Shrimp'),
    ('Yoimiya', 'Summer Festival Fish'),
    ('Yumemizuki Mizuki', 'Dreams of Healing'),
    ('Yun Jin', 'Cloud-Shrouded Jade'),
    ('Zhongli', 'Slow-Cooked Bamboo Shoot Soup')
)
UPDATE characters c
   SET special_dish = f.id,
       updated_at = CURRENT_TIMESTAMP
  FROM pairing p
  JOIN foods f ON f.name = p.dish_name AND f.deleted = FALSE
 WHERE c.name = p.character_name
   AND c.deleted = FALSE
   AND c.special_dish IS NULL;
