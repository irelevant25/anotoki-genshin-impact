const ARTIFACTS = [
    {
        name: 'Initiate',
        how_to_obtain: [
            {
                quality: '1',
                sources: ['Unobtainable'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Initiate's Flower",
                icon: "assets/artifacts/Initiate's Flower.avif",
            },
            {
                type: 'Plume of Death',
                name: "Initiate's Feather",
                icon: "assets/artifacts/Initiate's Feather.avif",
            },
        ],
        effects: [],
        version: '1.0',
        icon: 'assets/artifacts/Initiate.avif',
    },
    {
        name: 'Adventurer',
        two_piece_bonus: 'Max HP increased by 1000.',
        four_piece_bonus: 'Opening a chest regenerates 30% Max HP over 5s.',
        how_to_obtain: [
            {
                quality: '1',
                sources: ['Chests', 'Investigation'],
            },
            {
                quality: '2',
                sources: ['Midsummer Courtyard', 'Shiliu (Shop)', 'Adventure Rank Rewards (7, 8, 9, 11)', 'Normal Bosses', 'Investigation'],
            },
            {
                quality: '3',
                sources: ['Midsummer Courtyard', 'Normal Bosses'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Adventurer's Flower",
                icon: "assets/artifacts/Adventurer's Flower.avif",
            },
            {
                type: 'Plume of Death',
                name: "Adventurer's Tail Feather",
                icon: "assets/artifacts/Adventurer's Tail Feather.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Adventurer's Pocket Watch",
                icon: "assets/artifacts/Adventurer's Pocket Watch.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Adventurer's Golden Goblet",
                icon: "assets/artifacts/Adventurer's Golden Goblet.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Adventurer's Bandana",
                icon: "assets/artifacts/Adventurer's Bandana.avif",
            },
        ],
        effects: ['Healing', 'HP Increase'],
        version: '1.0',
        icon: 'assets/artifacts/Adventurer.avif',
    },
    {
        name: 'Lucky Dog',
        two_piece_bonus: 'DEF increased by 100.',
        four_piece_bonus: 'Picking up Mora restores 300 HP.',
        how_to_obtain: [
            {
                quality: '1',
                sources: ['Chests', 'Investigation'],
            },
            {
                quality: '2',
                sources: ['Chests', 'Investigation', 'Zhang Shun (Shop)', 'Yamashiro Kenta (Shop)', 'Domain of Guyun', 'Normal Bosses', 'Adventurer Handbook Experience'],
            },
            {
                quality: '3',
                sources: ['Chests', 'Domain of Guyun', 'Normal Bosses', 'Adventurer Handbook Experience'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Lucky Dog's Clover",
                icon: "assets/artifacts/Lucky Dog's Clover.avif",
            },
            {
                type: 'Plume of Death',
                name: "Lucky Dog's Eagle Feather",
                icon: "assets/artifacts/Lucky Dog's Eagle Feather.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Lucky Dog's Hourglass",
                icon: "assets/artifacts/Lucky Dog's Hourglass.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Lucky Dog's Goblet",
                icon: "assets/artifacts/Lucky Dog's Goblet.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Lucky Dog's Silver Circlet",
                icon: "assets/artifacts/Lucky Dog's Silver Circlet.avif",
            },
        ],
        effects: ['Healing', 'DEF Increase'],
        version: '1.0',
        icon: 'assets/artifacts/Lucky Dog.avif',
    },
    {
        name: 'Traveling Doctor',
        two_piece_bonus: 'Increases incoming healing by 20%.',
        four_piece_bonus: 'Using Elemental Burst restores 20% HP.',
        how_to_obtain: [
            {
                quality: '1',
                sources: ['Chests', 'Investigation'],
            },
            {
                quality: '2',
                sources: ['Chests', 'Valley of Remembrance', 'Xigu Antiques (Shop)', 'Normal Bosses', 'Investigation'],
            },
            {
                quality: '3',
                sources: ['Chests', 'Valley of Remembrance', 'Adventurer Handbook Experience (Chapter 2 - all but sands)', 'Elite Enemies', 'Normal Bosses'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Traveling Doctor's Silver Lotus",
                icon: "assets/artifacts/Traveling Doctor's Silver Lotus.avif",
            },
            {
                type: 'Plume of Death',
                name: "Traveling Doctor's Owl Feather",
                icon: "assets/artifacts/Traveling Doctor's Owl Feather.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Traveling Doctor's Pocket Watch",
                icon: "assets/artifacts/Traveling Doctor's Pocket Watch.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Traveling Doctor's Medicine Pot",
                icon: "assets/artifacts/Traveling Doctor's Medicine Pot.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Traveling Doctor's Handkerchief",
                icon: "assets/artifacts/Traveling Doctor's Handkerchief.avif",
            },
        ],
        effects: ['Healing', 'Incoming Healing Bonus', 'Elemental Burst'],
        version: '1.0',
        icon: 'assets/artifacts/Traveling Doctor.avif',
    },
    {
        name: 'Resolution of Sojourner',
        two_piece_bonus: 'ATK +18%.',
        four_piece_bonus: 'Increases Charged Attack CRIT Rate by 30%.',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Adventurer Handbook Experience', 'Adventure Rank Rewards', 'Midsummer Courtyard', 'Momiji-Dyed Court', 'City of Gold', 'Denouement of Sin', 'Sanctum of Rainbow Spirits'],
            },
            {
                quality: '4',
                sources: ['Midsummer Courtyard', 'Momiji-Dyed Court', 'City of Gold', 'Denouement of Sin', 'Sanctum of Rainbow Spirits'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Heart of Comradeship',
                icon: 'assets/artifacts/Heart of Comradeship.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Feather of Homecoming',
                icon: 'assets/artifacts/Feather of Homecoming.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Sundial of the Sojourner',
                icon: 'assets/artifacts/Sundial of the Sojourner.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Goblet of the Sojourner',
                icon: 'assets/artifacts/Goblet of the Sojourner.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Crown of Parting',
                icon: 'assets/artifacts/Crown of Parting.avif',
            },
        ],
        effects: ['ATK Increase', 'CRIT Rate', 'Charged Attack DMG Increase'],
        version: '1.0',
        icon: 'assets/artifacts/Resolution of Sojourner.avif',
    },
    {
        name: 'Tiny Miracle',
        two_piece_bonus: 'All Elemental RES increased by 20%.',
        four_piece_bonus: 'Incoming Elemental DMG increases corresponding Elemental RES by 30% for 10s. Can only occur once every 10s.',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Valley of Remembrance', 'Momiji-Dyed Court', 'Spire of Solitary Enlightenment', 'Waterfall Wen', 'Derelict Masonry Dock'],
            },
            {
                quality: '4',
                sources: ['Valley of Remembrance', 'Momiji-Dyed Court', 'Spire of Solitary Enlightenment', 'Waterfall Wen', 'Derelict Masonry Dock'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Tiny Miracle's Flower",
                icon: "assets/artifacts/Tiny Miracle's Flower.avif",
            },
            {
                type: 'Plume of Death',
                name: "Tiny Miracle's Feather",
                icon: "assets/artifacts/Tiny Miracle's Feather.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Tiny Miracle's Hourglass",
                icon: "assets/artifacts/Tiny Miracle's Hourglass.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Tiny Miracle's Goblet",
                icon: "assets/artifacts/Tiny Miracle's Goblet.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Tiny Miracle's Earrings",
                icon: "assets/artifacts/Tiny Miracle's Earrings.avif",
            },
        ],
        effects: ['Elemental RES Increase', 'Pyro RES Increase', 'Cryo RES Increase', 'Dendro RES Increase', 'Geo RES Increase', 'Anemo RES Increase', 'Hydro RES Increase', 'Electro RES Increase'],
        version: '1.0',
        icon: 'assets/artifacts/Tiny Miracle.avif',
    },
    {
        name: 'Berserker',
        two_piece_bonus: 'CRIT Rate +12%',
        four_piece_bonus: 'When HP is below 70%, CRIT Rate increases by an additional 24%.',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Dropped by all Elite Enemies', 'Dropped by some Normal Bosses', 'Dropped by all Weekly Bosses', 'Domain Reliquary: Tier III', 'Chests'],
            },
            {
                quality: '4',
                sources: ['Dropped by all Elite Enemies', 'Dropped by some Normal Bosses', 'Dropped by all Weekly Bosses', 'Domain Reliquary: Tier II'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Berserker's Rose",
                icon: "assets/artifacts/Berserker's Rose.avif",
            },
            {
                type: 'Plume of Death',
                name: "Berserker's Indigo Feather",
                icon: "assets/artifacts/Berserker's Indigo Feather.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Berserker's Timepiece",
                icon: "assets/artifacts/Berserker's Timepiece.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Berserker's Bone Goblet",
                icon: "assets/artifacts/Berserker's Bone Goblet.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Berserker's Battle Mask",
                icon: "assets/artifacts/Berserker's Battle Mask.avif",
            },
        ],
        effects: ['CRIT Rate'],
        version: '1.0',
        icon: 'assets/artifacts/Berserker.avif',
    },
    {
        name: 'Instructor',
        two_piece_bonus: 'Increases Elemental Mastery by 80.',
        four_piece_bonus: "Upon triggering an Elemental Reaction, increases all party members' Elemental Mastery by 120 for 8s.",
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Dropped by all Elite Enemies', 'Dropped by some Normal Bosses', 'Dropped by all Weekly Bosses', 'Domain Reliquary: Tier III', 'Chests'],
            },
            {
                quality: '4',
                sources: ['Dropped by all Elite Enemies', 'Dropped by some Normal Bosses', 'Dropped by all Weekly Bosses', 'Domain Reliquary: Tier II'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Instructor's Brooch",
                icon: "assets/artifacts/Instructor's Brooch.avif",
            },
            {
                type: 'Plume of Death',
                name: "Instructor's Feather Accessory",
                icon: "assets/artifacts/Instructor's Feather Accessory.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Instructor's Pocket Watch",
                icon: "assets/artifacts/Instructor's Pocket Watch.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Instructor's Tea Cup",
                icon: "assets/artifacts/Instructor's Tea Cup.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Instructor's Cap",
                icon: "assets/artifacts/Instructor's Cap.avif",
            },
        ],
        effects: ['Elemental Mastery', 'Elemental Reaction', 'Party Elemental Mastery', 'Party'],
        version: '1.0',
        icon: 'assets/artifacts/Instructor.avif',
    },
    {
        name: 'The Exile',
        two_piece_bonus: 'Energy Recharge +20%',
        four_piece_bonus: 'Using an Elemental Burst regenerates 2 Energy for all party members (excluding the wearer) every 2s for 6s. This effect cannot stack.',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Dropped by all Elite Enemies', 'Dropped by some Normal Bosses', 'Dropped by all Weekly Bosses', 'Domain Reliquary: Tier III', 'Chests'],
            },
            {
                quality: '4',
                sources: ['Dropped by all Elite Enemies', 'Dropped by some Normal Bosses', 'Dropped by all Weekly Bosses', 'Domain Reliquary: Tier II'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Exile's Flower",
                icon: "assets/artifacts/Exile's Flower.avif",
            },
            {
                type: 'Plume of Death',
                name: "Exile's Feather",
                icon: "assets/artifacts/Exile's Feather.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Exile's Pocket Watch",
                icon: "assets/artifacts/Exile's Pocket Watch.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Exile's Goblet",
                icon: "assets/artifacts/Exile's Goblet.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Exile's Circlet",
                icon: "assets/artifacts/Exile's Circlet.avif",
            },
        ],
        effects: ['Energy Recharge', 'Energy Generation', 'Elemental Burst'],
        version: '1.0',
        icon: 'assets/artifacts/The Exile.avif',
    },
    {
        name: "Defender's Will",
        two_piece_bonus: 'DEF +30%',
        four_piece_bonus: "For each different element present in your own party, the wearer's Elemental RES to that corresponding element is increased by 30%.",
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Hidden Palace of Zhou Formula', 'Peak of Vindagnyr', 'Slumbering Court', 'Denouement of Sin'],
            },
            {
                quality: '4',
                sources: ['Hidden Palace of Zhou Formula', 'Peak of Vindagnyr', 'Slumbering Court', 'Denouement of Sin'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Guardian's Flower",
                icon: "assets/artifacts/Guardian's Flower.avif",
            },
            {
                type: 'Plume of Death',
                name: "Guardian's Sigil",
                icon: "assets/artifacts/Guardian's Sigil.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Guardian's Clock",
                icon: "assets/artifacts/Guardian's Clock.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Guardian's Vessel",
                icon: "assets/artifacts/Guardian's Vessel.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Guardian's Band",
                icon: "assets/artifacts/Guardian's Band.avif",
            },
        ],
        effects: [
            'DEF Increase',
            'Elemental RES Increase',
            'Pyro RES Increase',
            'Cryo RES Increase',
            'Dendro RES Increase',
            'Electro RES Increase',
            'Hydro RES Increase',
            'Anemo RES Increase',
            'Geo RES Increase',
        ],
        version: '1.0',
        icon: "assets/artifacts/Defender's Will.avif",
    },
    {
        name: 'Brave Heart',
        two_piece_bonus: 'ATK +18%.',
        four_piece_bonus: 'Increases DMG by 30% against opponents with more than 50% HP.',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Domain of Guyun', 'Ridge Watch', 'Slumbering Court', 'City of Gold', 'Faded Theater'],
            },
            {
                quality: '4',
                sources: [
                    'Domain of Guyun',
                    'Ridge Watch',
                    'Slumbering Court',
                    'City of Gold',
                    'Faded Theater',
                    'Domain of the Wayward Path',
                    'Domain of Forsaken Ruins',
                    'Hidden Palace of Guizang Formula',
                ],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Medal of the Brave',
                icon: 'assets/artifacts/Medal of the Brave.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Prospect of the Brave',
                icon: 'assets/artifacts/Prospect of the Brave.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Fortitude of the Brave',
                icon: 'assets/artifacts/Fortitude of the Brave.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Outset of the Brave',
                icon: 'assets/artifacts/Outset of the Brave.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Crown of the Brave',
                icon: 'assets/artifacts/Crown of the Brave.avif',
            },
        ],
        effects: ['ATK Increase', 'DMG Bonus', 'Enemy HP Dependent'],
        version: '1.0',
        icon: 'assets/artifacts/Brave Heart.avif',
    },
    {
        name: 'Martial Artist',
        two_piece_bonus: 'Normal and Charged Attack DMG +15%',
        four_piece_bonus: 'After using Elemental Skill, increases Normal Attack and Charged Attack DMG by 25% for 8s.',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Adventurer Handbook Experience', 'Hidden Palace of Zhou Formula', 'Ridge Watch', 'The Lost Valley', 'Molten Iron Fortress', 'Waterfall Wen'],
            },
            {
                quality: '4',
                sources: ['Hidden Palace of Zhou Formula', 'Ridge Watch', 'The Lost Valley', 'Molten Iron Fortress', 'Waterfall Wen'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Martial Artist's Red Flower",
                icon: "assets/artifacts/Martial Artist's Red Flower.avif",
            },
            {
                type: 'Plume of Death',
                name: "Martial Artist's Feather Accessory",
                icon: "assets/artifacts/Martial Artist's Feather Accessory.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Martial Artist's Water Hourglass",
                icon: "assets/artifacts/Martial Artist's Water Hourglass.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Martial Artist's Wine Cup",
                icon: "assets/artifacts/Martial Artist's Wine Cup.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Martial Artist's Bandana",
                icon: "assets/artifacts/Martial Artist's Bandana.avif",
            },
        ],
        effects: ['Normal Attack DMG Increase', 'Charged Attack DMG Increase', 'Elemental Skill', 'DMG Bonus'],
        version: '1.0',
        icon: 'assets/artifacts/Martial Artist.avif',
    },
    {
        name: 'Gambler',
        two_piece_bonus: 'Increases Elemental Skill DMG by 20%.',
        four_piece_bonus: 'Defeating an opponent has a 100% chance to remove Elemental Skill CD. Can only occur once every 15s.',
        how_to_obtain: [
            {
                quality: '3',
                sources: [
                    'Clear Pool and Mountain Cavern',
                    'Peak of Vindagnyr',
                    'The Lost Valley',
                    'Spire of Solitary Enlightenment',
                    'Sanctum of Rainbow Spirits',
                    "Under the Umbrella's Shade",
                    'Fragment of Childhood Dreams',
                    'Garden of Endless Pillars',
                ],
            },
            {
                quality: '4',
                sources: ['Clear Pool and Mountain Cavern', 'Peak of Vindagnyr', 'The Lost Valley', 'Spire of Solitary Enlightenment', 'Sanctum of Rainbow Spirits'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Gambler's Brooch",
                icon: "assets/artifacts/Gambler's Brooch.avif",
            },
            {
                type: 'Plume of Death',
                name: "Gambler's Feather Accessory",
                icon: "assets/artifacts/Gambler's Feather Accessory.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Gambler's Pocket Watch",
                icon: "assets/artifacts/Gambler's Pocket Watch.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Gambler's Dice Cup",
                icon: "assets/artifacts/Gambler's Dice Cup.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Gambler's Earrings",
                icon: "assets/artifacts/Gambler's Earrings.avif",
            },
        ],
        effects: ['Elemental Skill DMG Increase', 'Cooldown Reset', 'DMG Bonus'],
        version: '1.0',
        icon: 'assets/artifacts/Gambler.avif',
    },
    {
        name: 'Scholar',
        two_piece_bonus: 'Energy Recharge +20%',
        four_piece_bonus: 'Gaining Elemental Particles or Orbs gives 3 Energy to all party members who have a bow or a catalyst equipped. Can only occur once every 3s.',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Adventurer Handbook Experience', 'Clear Pool and Mountain Cavern', 'Molten Iron Fortress', 'Faded Theater', 'Derelict Masonry Dock'],
            },
            {
                quality: '4',
                sources: ['Adventurer Handbook Experience', 'Adventure Rank Rewards', 'Clear Pool and Mountain Cavern', 'Molten Iron Fortress', 'Faded Theater', 'Derelict Masonry Dock'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Scholar's Bookmark",
                icon: "assets/artifacts/Scholar's Bookmark.avif",
            },
            {
                type: 'Plume of Death',
                name: "Scholar's Quill Pen",
                icon: "assets/artifacts/Scholar's Quill Pen.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Scholar's Clock",
                icon: "assets/artifacts/Scholar's Clock.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Scholar's Ink Cup",
                icon: "assets/artifacts/Scholar's Ink Cup.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Scholar's Lens",
                icon: "assets/artifacts/Scholar's Lens.avif",
            },
        ],
        effects: ['Energy Recharge', 'Energy Generation', 'Catalyst Bonus', 'Bow Bonus'],
        version: '1.0',
        icon: 'assets/artifacts/Scholar.avif',
    },
    {
        name: 'Prayers for Wisdom',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Normal Bosses'],
            },
            {
                quality: '4',
                sources: ['Normal Bosses'],
            },
        ],
        pieces: [
            {
                type: 'Circlet of Logos',
                name: 'Tiara of Thunder',
                icon: 'assets/artifacts/Tiara of Thunder.avif',
            },
        ],
        effects: ['Status Duration Reduction'],
        version: '1.0',
        icon: 'assets/artifacts/Prayers for Wisdom.avif',
    },
    {
        name: 'Prayers for Destiny',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Normal Bosses'],
            },
            {
                quality: '4',
                sources: ['Normal Bosses'],
            },
        ],
        pieces: [
            {
                type: 'Circlet of Logos',
                name: 'Tiara of Torrents',
                icon: 'assets/artifacts/Tiara of Torrents.avif',
            },
        ],
        effects: ['Status Duration Reduction'],
        version: '1.0',
        icon: 'assets/artifacts/Prayers for Destiny.avif',
    },
    {
        name: 'Prayers for Illumination',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Normal Bosses'],
            },
            {
                quality: '4',
                sources: ['Normal Bosses'],
            },
        ],
        pieces: [
            {
                type: 'Circlet of Logos',
                name: 'Tiara of Flame',
                icon: 'assets/artifacts/Tiara of Flame.avif',
            },
        ],
        effects: ['Status Duration Reduction'],
        version: '1.0',
        icon: 'assets/artifacts/Prayers for Illumination.avif',
    },
    {
        name: 'Prayers to Springtime',
        how_to_obtain: [
            {
                quality: '3',
                sources: ['Normal Bosses'],
            },
            {
                quality: '4',
                sources: ['Normal Bosses'],
            },
        ],
        pieces: [
            {
                type: 'Circlet of Logos',
                name: 'Tiara of Frost',
                icon: 'assets/artifacts/Tiara of Frost.avif',
            },
        ],
        effects: ['Status Duration Reduction'],
        version: '1.0',
        icon: 'assets/artifacts/Prayers to Springtime.avif',
    },
    {
        name: "Gladiator's Finale",
        two_piece_bonus: 'ATK +18%.',
        four_piece_bonus: 'If the wielder of this artifact set uses a Sword, Claymore or Polearm, increases their Normal Attack DMG by 35%.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Dropped by Weekly Bosses at World Level 2+', 'Dropped by Normal Bosses at World Level 3+', 'Domain Reliquary: Tier II'],
            },
            {
                quality: '5',
                sources: ['Dropped by Weekly Bosses at World Level 3+', 'Dropped by Normal Bosses at World Level 5+', 'Domain Reliquary: Tier I', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Gladiator's Nostalgia",
                icon: "assets/artifacts/Gladiator's Nostalgia.avif",
            },
            {
                type: 'Plume of Death',
                name: "Gladiator's Destiny",
                icon: "assets/artifacts/Gladiator's Destiny.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Gladiator's Longing",
                icon: "assets/artifacts/Gladiator's Longing.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Gladiator's Intoxication",
                icon: "assets/artifacts/Gladiator's Intoxication.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Gladiator's Triumphus",
                icon: "assets/artifacts/Gladiator's Triumphus.avif",
            },
        ],
        effects: ['ATK Increase', 'Normal Attack DMG Increase', 'Sword Bonus', 'Claymore Bonus', 'Polearm Bonus', 'DMG Bonus'],
        version: '1.0',
        icon: "assets/artifacts/Gladiator's Finale.avif",
    },
    {
        name: "Wanderer's Troupe",
        two_piece_bonus: 'Increases Elemental Mastery by 80.',
        four_piece_bonus: 'Increases Charged Attack DMG by 35% if the character uses a Catalyst or Bow.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Dropped by Weekly Bosses at World Level 2+', 'Dropped by Normal Bosses at World Level 3+', 'Domain Reliquary: Tier II'],
            },
            {
                quality: '5',
                sources: ['Dropped by Weekly Bosses at World Level 3+', 'Dropped by Normal Bosses at World Level 5+', 'Domain Reliquary: Tier I', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Troupe's Dawnlight",
                icon: "assets/artifacts/Troupe's Dawnlight.avif",
            },
            {
                type: 'Plume of Death',
                name: "Bard's Arrow Feather",
                icon: "assets/artifacts/Bard's Arrow Feather.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Concert's Final Hour",
                icon: "assets/artifacts/Concert's Final Hour.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Wanderer's String-Kettle",
                icon: "assets/artifacts/Wanderer's String-Kettle.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Conductor's Top Hat",
                icon: "assets/artifacts/Conductor's Top Hat.avif",
            },
        ],
        effects: ['Elemental Mastery', 'Charged Attack DMG Increase', 'Catalyst Bonus', 'Bow Bonus', 'DMG Bonus'],
        version: '1.0',
        icon: "assets/artifacts/Wanderer's Troupe.avif",
    },
    {
        name: 'Noblesse Oblige',
        two_piece_bonus: 'Elemental Burst DMG +20%',
        four_piece_bonus: "Using an Elemental Burst increases all party members' ATK by 20% for 12s. This effect cannot stack.",
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Clear Pool and Mountain Cavern'],
            },
            {
                quality: '5',
                sources: ['Clear Pool and Mountain Cavern', 'Artifact Strongbox: Noblesse Oblige', 'Adventure Rank Rewards (43, 47, 48, 49, 51)', 'Nine Pillars of Peace'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Royal Flora',
                icon: 'assets/artifacts/Royal Flora.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Royal Plume',
                icon: 'assets/artifacts/Royal Plume.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Royal Pocket Watch',
                icon: 'assets/artifacts/Royal Pocket Watch.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Royal Silver Urn',
                icon: 'assets/artifacts/Royal Silver Urn.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Royal Masque',
                icon: 'assets/artifacts/Royal Masque.avif',
            },
        ],
        effects: ['Elemental Burst DMG Increase', 'Party ATK Increase', 'DMG Bonus', 'Party'],
        version: '1.0',
        icon: 'assets/artifacts/Noblesse Oblige.avif',
    },
    {
        name: 'Bloodstained Chivalry',
        two_piece_bonus: 'Physical DMG Bonus +25%',
        four_piece_bonus: 'After defeating an opponent, increases Charged Attack DMG by 50%, and reduces its Stamina cost to 0 for 10s.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Clear Pool and Mountain Cavern'],
            },
            {
                quality: '5',
                sources: ['Clear Pool and Mountain Cavern', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Bloodstained Flower of Iron',
                icon: 'assets/artifacts/Bloodstained Flower of Iron.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Bloodstained Black Plume',
                icon: 'assets/artifacts/Bloodstained Black Plume.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Bloodstained Final Hour',
                icon: 'assets/artifacts/Bloodstained Final Hour.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: "Bloodstained Chevalier's Goblet",
                icon: "assets/artifacts/Bloodstained Chevalier's Goblet.avif",
            },
            {
                type: 'Circlet of Logos',
                name: 'Bloodstained Iron Mask',
                icon: 'assets/artifacts/Bloodstained Iron Mask.avif',
            },
        ],
        effects: ['Physical DMG Bonus', 'Charged Attack DMG Increase', 'Stamina', 'DMG Bonus'],
        version: '1.0',
        icon: 'assets/artifacts/Bloodstained Chivalry.avif',
    },
    {
        name: 'Maiden Beloved',
        two_piece_bonus: 'Character Healing Effectiveness +15%',
        four_piece_bonus: 'Using an Elemental Skill or Burst increases healing received by all party members by 20% for 10s.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Valley of Remembrance', 'Adventurer Handbook'],
            },
            {
                quality: '5',
                sources: ['Valley of Remembrance', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Maiden's Distant Love",
                icon: "assets/artifacts/Maiden's Distant Love.avif",
            },
            {
                type: 'Plume of Death',
                name: "Maiden's Heart-Stricken Infatuation",
                icon: "assets/artifacts/Maiden's Heart-Stricken Infatuation.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Maiden's Passing Youth",
                icon: "assets/artifacts/Maiden's Passing Youth.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Maiden's Fleeting Leisure",
                icon: "assets/artifacts/Maiden's Fleeting Leisure.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Maiden's Fading Beauty",
                icon: "assets/artifacts/Maiden's Fading Beauty.avif",
            },
        ],
        effects: ['Healing Bonus', 'Elemental Skill', 'Elemental Burst', 'Party', 'Incoming Healing Bonus'],
        version: '1.0',
        icon: 'assets/artifacts/Maiden Beloved.avif',
    },
    {
        name: 'Viridescent Venerer',
        two_piece_bonus: 'Anemo DMG Bonus +15%',
        four_piece_bonus: "Increases Swirl DMG by 60%. Decreases opponent's Elemental RES to the element infused in the Swirl by 40% for 10s.",
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Valley of Remembrance'],
            },
            {
                quality: '5',
                sources: ['Valley of Remembrance', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'In Remembrance of Viridescent Fields',
                icon: 'assets/artifacts/In Remembrance of Viridescent Fields.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Viridescent Arrow Feather',
                icon: 'assets/artifacts/Viridescent Arrow Feather.avif',
            },
            {
                type: 'Sands of Eon',
                name: "Viridescent Venerer's Determination",
                icon: "assets/artifacts/Viridescent Venerer's Determination.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Viridescent Venerer's Vessel",
                icon: "assets/artifacts/Viridescent Venerer's Vessel.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Viridescent Venerer's Diadem",
                icon: "assets/artifacts/Viridescent Venerer's Diadem.avif",
            },
        ],
        effects: ['Elemental DMG Bonus', 'Anemo DMG Bonus', 'Swirl DMG Increase', 'Elemental Reaction', 'Cryo RES Reduction', 'Electro RES Reduction', 'Hydro RES Reduction', 'Pyro RES Reduction'],
        version: '1.0',
        icon: 'assets/artifacts/Viridescent Venerer.avif',
    },
    {
        name: 'Archaic Petra',
        two_piece_bonus: 'Geo DMG Bonus +15%',
        four_piece_bonus:
            'Upon obtaining an Elemental Shard created through a Crystallize Reaction, all party members gain 35% DMG Bonus for that particular element for 10s. Only one form of Elemental DMG Bonus can be gained in this manner at any one time.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Domain of Guyun'],
            },
            {
                quality: '5',
                sources: ['Domain of Guyun', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Flower of Creviced Cliff',
                icon: 'assets/artifacts/Flower of Creviced Cliff.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Feather of Jagged Peaks',
                icon: 'assets/artifacts/Feather of Jagged Peaks.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Sundial of Enduring Jade',
                icon: 'assets/artifacts/Sundial of Enduring Jade.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Goblet of Chiseled Crag',
                icon: 'assets/artifacts/Goblet of Chiseled Crag.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Mask of Solitude Basalt',
                icon: 'assets/artifacts/Mask of Solitude Basalt.avif',
            },
        ],
        effects: ['Cryo DMG Bonus', 'Electro DMG Bonus', 'Hydro DMG Bonus', 'Pyro DMG Bonus', 'Geo DMG Bonus', 'Party', 'Elemental Reaction', 'Elemental DMG Bonus'],
        version: '1.0',
        icon: 'assets/artifacts/Archaic Petra.avif',
    },
    {
        name: 'Retracing Bolide',
        two_piece_bonus: 'Increases Shield Strength by 35%.',
        four_piece_bonus: 'While protected by a shield, gain an additional 40% Normal and Charged Attack DMG.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Domain of Guyun'],
            },
            {
                quality: '5',
                sources: ['Domain of Guyun', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Summer Night's Bloom",
                icon: "assets/artifacts/Summer Night's Bloom.avif",
            },
            {
                type: 'Plume of Death',
                name: "Summer Night's Finale",
                icon: "assets/artifacts/Summer Night's Finale.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Summer Night's Moment",
                icon: "assets/artifacts/Summer Night's Moment.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Summer Night's Waterballoon",
                icon: "assets/artifacts/Summer Night's Waterballoon.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Summer Night's Mask",
                icon: "assets/artifacts/Summer Night's Mask.avif",
            },
        ],
        effects: ['Shield Strength', 'Normal Attack DMG Increase', 'Charged Attack DMG Increase', 'DMG Bonus'],
        version: '1.0',
        icon: 'assets/artifacts/Retracing Bolide.avif',
    },
    {
        name: 'Thundersoother',
        two_piece_bonus: 'Electro RES increased by 40%.',
        four_piece_bonus: 'Increases DMG against opponents affected by Electro by 35%.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Midsummer Courtyard'],
            },
            {
                quality: '5',
                sources: ['Midsummer Courtyard', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Thundersoother's Heart",
                icon: "assets/artifacts/Thundersoother's Heart.avif",
            },
            {
                type: 'Plume of Death',
                name: "Thundersoother's Plume",
                icon: "assets/artifacts/Thundersoother's Plume.avif",
            },
            {
                type: 'Sands of Eon',
                name: 'Hour of Soothing Thunder',
                icon: 'assets/artifacts/Hour of Soothing Thunder.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: "Thundersoother's Goblet",
                icon: "assets/artifacts/Thundersoother's Goblet.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Thundersoother's Diadem",
                icon: "assets/artifacts/Thundersoother's Diadem.avif",
            },
        ],
        effects: ['Elemental RES Increase', 'Electro RES Increase', 'DMG Bonus'],
        version: '1.0',
        icon: 'assets/artifacts/Thundersoother.avif',
    },
    {
        name: 'Thundering Fury',
        two_piece_bonus: 'Electro DMG Bonus +15%',
        four_piece_bonus:
            'Increases DMG caused by Overloaded, Electro-Charged, Superconduct, and Hyperbloom by 40%, and the DMG Bonus conferred by Aggravate is increased by 20%. When Quicken or the aforementioned Elemental Reactions are triggered, Elemental Skill CD is decreased by 1s. Can only occur once every 0.8s.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Midsummer Courtyard'],
            },
            {
                quality: '5',
                sources: ['Midsummer Courtyard', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Thunderbird's Mercy",
                icon: "assets/artifacts/Thunderbird's Mercy.avif",
            },
            {
                type: 'Plume of Death',
                name: 'Survivor of Catastrophe',
                icon: 'assets/artifacts/Survivor of Catastrophe.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Hourglass of Thunder',
                icon: 'assets/artifacts/Hourglass of Thunder.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Omen of Thunderstorm',
                icon: 'assets/artifacts/Omen of Thunderstorm.avif',
            },
            {
                type: 'Circlet of Logos',
                name: "Thunder Summoner's Crown",
                icon: "assets/artifacts/Thunder Summoner's Crown.avif",
            },
        ],
        effects: [
            'Elemental DMG Bonus',
            'Electro DMG Bonus',
            'Elemental Reaction DMG Increase',
            'Cooldown Reduction',
            'Overloaded DMG Increase',
            'Electro-Charged DMG Increase',
            'Superconduct DMG Increase',
            'Elemental Reaction',
            'Aggravate DMG Bonus Increase',
            'Hyperbloom DMG Increase',
        ],
        version: '1.0',
        icon: 'assets/artifacts/Thundering Fury.avif',
    },
    {
        name: 'Lavawalker',
        two_piece_bonus: 'Pyro RES increased by 40%.',
        four_piece_bonus: 'Increases DMG against opponents affected by Pyro by 35%.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Hidden Palace of Zhou Formula'],
            },
            {
                quality: '5',
                sources: ['Hidden Palace of Zhou Formula', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Lavawalker's Resolution",
                icon: "assets/artifacts/Lavawalker's Resolution.avif",
            },
            {
                type: 'Plume of Death',
                name: "Lavawalker's Salvation",
                icon: "assets/artifacts/Lavawalker's Salvation.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Lavawalker's Torment",
                icon: "assets/artifacts/Lavawalker's Torment.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Lavawalker's Epiphany",
                icon: "assets/artifacts/Lavawalker's Epiphany.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Lavawalker's Wisdom",
                icon: "assets/artifacts/Lavawalker's Wisdom.avif",
            },
        ],
        effects: ['Elemental RES Increase', 'Pyro RES Increase', 'DMG Bonus'],
        version: '1.0',
        icon: 'assets/artifacts/Lavawalker.avif',
    },
    {
        name: 'Crimson Witch of Flames',
        two_piece_bonus: 'Pyro DMG Bonus +15%',
        four_piece_bonus:
            'Increases Overloaded and Burning, and Burgeon DMG by 40%. Increases Vaporize and Melt DMG by 15%. Using Elemental Skill increases the 2-Piece Set Bonus by 50% of its starting value for 10s. Max 3 stacks.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Hidden Palace of Zhou Formula'],
            },
            {
                quality: '5',
                sources: ['Hidden Palace of Zhou Formula', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Witch's Flower of Blaze",
                icon: "assets/artifacts/Witch's Flower of Blaze.avif",
            },
            {
                type: 'Plume of Death',
                name: "Witch's Ever-Burning Plume",
                icon: "assets/artifacts/Witch's Ever-Burning Plume.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Witch's End Time",
                icon: "assets/artifacts/Witch's End Time.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Witch's Heart Flames",
                icon: "assets/artifacts/Witch's Heart Flames.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Witch's Scorching Hat",
                icon: "assets/artifacts/Witch's Scorching Hat.avif",
            },
        ],
        effects: [
            'Elemental DMG Bonus',
            'Pyro DMG Bonus',
            'Elemental Reaction DMG Increase',
            'Elemental Skill',
            'Overloaded DMG Increase',
            'Burning DMG Increase',
            'Vaporize DMG Increase',
            'Melt DMG Increase',
            'Burgeon DMG Increase',
        ],
        version: '1.0',
        icon: 'assets/artifacts/Crimson Witch of Flames.avif',
    },
    {
        name: 'Blizzard Strayer',
        two_piece_bonus: 'Cryo DMG Bonus +15%',
        four_piece_bonus: 'When a character attacks an opponent affected by Cryo, their CRIT Rate is increased by 20%. If the opponent is Frozen, CRIT Rate is increased by an additional 20%.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Peak of Vindagnyr', 'Stevens'],
            },
            {
                quality: '5',
                sources: ['Peak of Vindagnyr', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Snowswept Memory',
                icon: 'assets/artifacts/Snowswept Memory.avif',
            },
            {
                type: 'Plume of Death',
                name: "Icebreaker's Resolve",
                icon: "assets/artifacts/Icebreaker's Resolve.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Frozen Homeland's Demise",
                icon: "assets/artifacts/Frozen Homeland's Demise.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Frost-Weaved Dignity',
                icon: 'assets/artifacts/Frost-Weaved Dignity.avif',
            },
            {
                type: 'Circlet of Logos',
                name: "Broken Rime's Echo",
                icon: "assets/artifacts/Broken Rime's Echo.avif",
            },
        ],
        effects: ['Elemental DMG Bonus', 'Cryo DMG Bonus', 'CRIT Rate'],
        version: '1.2',
        icon: 'assets/artifacts/Blizzard Strayer.avif',
    },
    {
        name: 'Heart of Depth',
        two_piece_bonus: 'Hydro DMG Bonus +15%',
        four_piece_bonus: 'After using an Elemental Skill, increases Normal Attack and Charged Attack DMG by 30% for 15s.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Peak of Vindagnyr'],
            },
            {
                quality: '5',
                sources: ['Peak of Vindagnyr', 'Artifact Strongbox'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Gilded Corsage',
                icon: 'assets/artifacts/Gilded Corsage.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Gust of Nostalgia',
                icon: 'assets/artifacts/Gust of Nostalgia.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Copper Compass',
                icon: 'assets/artifacts/Copper Compass.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Goblet of Thundering Deep',
                icon: 'assets/artifacts/Goblet of Thundering Deep.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Wine-Stained Tricorne',
                icon: 'assets/artifacts/Wine-Stained Tricorne.avif',
            },
        ],
        effects: ['Elemental DMG Bonus', 'Hydro DMG Bonus', 'Elemental Skill', 'Normal Attack DMG Increase', 'Charged Attack DMG Increase', 'DMG Bonus'],
        version: '1.2',
        icon: 'assets/artifacts/Heart of Depth.avif',
    },
    {
        name: 'Tenacity of the Millelith',
        two_piece_bonus: 'HP +20%',
        four_piece_bonus:
            'When an Elemental Skill hits an opponent, the ATK of all nearby party members is increased by 20% and their Shield Strength is increased by 30% for 3s. This effect can be triggered once every 0.5s. This effect can still be triggered even when the character who is using this artifact set is not on the field.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Ridge Watch'],
            },
            {
                quality: '5',
                sources: ['Ridge Watch', 'Artifact Strongbox: Tenacity of the Millelith'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Flower of Accolades',
                icon: 'assets/artifacts/Flower of Accolades.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Ceremonial War-Plume',
                icon: 'assets/artifacts/Ceremonial War-Plume.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Orichalceous Time-Dial',
                icon: 'assets/artifacts/Orichalceous Time-Dial.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: "Noble's Pledging Vessel",
                icon: "assets/artifacts/Noble's Pledging Vessel.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "General's Ancient Helm",
                icon: "assets/artifacts/General's Ancient Helm.avif",
            },
        ],
        effects: ['HP Increase', 'Elemental Skill', 'Party ATK Increase', 'Shield Strength', 'Party'],
        version: '1.5',
        icon: 'assets/artifacts/Tenacity of the Millelith.avif',
    },
    {
        name: 'Pale Flame',
        two_piece_bonus: 'Physical DMG Bonus +25%',
        four_piece_bonus:
            'When an Elemental Skill hits an opponent, ATK is increased by 9% for 7s. This effect stacks up to 2 times and can be triggered once every 0.3s. Once 2 stacks are reached, the 2-set effect is increased by 100%.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Ridge Watch'],
            },
            {
                quality: '5',
                sources: ['Ridge Watch', 'Artifact Strongbox: Pale Flame'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Stainless Bloom',
                icon: 'assets/artifacts/Stainless Bloom.avif',
            },
            {
                type: 'Plume of Death',
                name: "Wise Doctor's Pinion",
                icon: "assets/artifacts/Wise Doctor's Pinion.avif",
            },
            {
                type: 'Sands of Eon',
                name: 'Moment of Cessation',
                icon: 'assets/artifacts/Moment of Cessation.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Surpassing Cup',
                icon: 'assets/artifacts/Surpassing Cup.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Mocking Mask',
                icon: 'assets/artifacts/Mocking Mask.avif',
            },
        ],
        effects: ['Physical DMG Bonus', 'Elemental Skill', 'ATK Increase'],
        version: '1.5',
        icon: 'assets/artifacts/Pale Flame.avif',
    },
    {
        name: "Shimenawa's Reminiscence",
        two_piece_bonus: 'ATK +18%',
        four_piece_bonus:
            'When casting an Elemental Skill, if the character has 15 or more Energy, they lose 15 Energy and Normal/Charged/Plunging Attack DMG is increased by 50% for 10s. This effect will not trigger again during that duration.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Momiji-Dyed Court'],
            },
            {
                quality: '5',
                sources: ['Momiji-Dyed Court', "Artifact Strongbox: Shimenawa's Reminiscence"],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Entangling Bloom',
                icon: 'assets/artifacts/Entangling Bloom.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Shaft of Remembrance',
                icon: 'assets/artifacts/Shaft of Remembrance.avif',
            },
            {
                type: 'Sands of Eon',
                name: "Morning Dew's Moment",
                icon: "assets/artifacts/Morning Dew's Moment.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Hopeful Heart',
                icon: 'assets/artifacts/Hopeful Heart.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Capricious Visage',
                icon: 'assets/artifacts/Capricious Visage.avif',
            },
        ],
        effects: ['ATK Increase', 'Normal Attack DMG Increase', 'Charged Attack DMG Increase', 'Plunging Attack DMG Increase', 'Energy Decrease', 'Elemental Skill', 'DMG Bonus', 'Energy'],
        version: '2.0',
        icon: "assets/artifacts/Shimenawa's Reminiscence.avif",
    },
    {
        name: 'Emblem of Severed Fate',
        two_piece_bonus: 'Energy Recharge +20%',
        four_piece_bonus: 'Increases Elemental Burst DMG by 25% of Energy Recharge. A maximum of 75% bonus DMG can be obtained in this way.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Momiji-Dyed Court'],
            },
            {
                quality: '5',
                sources: ['Momiji-Dyed Court', 'Artifact Strongbox: Emblem of Severed Fate'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Magnificent Tsuba',
                icon: 'assets/artifacts/Magnificent Tsuba.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Sundered Feather',
                icon: 'assets/artifacts/Sundered Feather.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Storm Cage',
                icon: 'assets/artifacts/Storm Cage.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Scarlet Vessel',
                icon: 'assets/artifacts/Scarlet Vessel.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Ornate Kabuto',
                icon: 'assets/artifacts/Ornate Kabuto.avif',
            },
        ],
        effects: ['Energy Recharge', 'Elemental Burst DMG Increase', 'DMG Bonus'],
        version: '2.0',
        icon: 'assets/artifacts/Emblem of Severed Fate.avif',
    },
    {
        name: 'Husk of Opulent Dreams',
        two_piece_bonus: 'DEF +30%',
        four_piece_bonus:
            'A character equipped with this Artifact set will obtain the Curiosity effect in the following conditions:When on the field, the character gains 1 stack after hitting an opponent with a Geo attack, triggering a maximum of once every 0.3s.When off the field, the character gains 1 stack every 3s.Curiosity can stack up to 4 times, each providing 6% DEF and a 6% Geo DMG Bonus.When 6 seconds pass without gaining a Curiosity stack, 1 stack is lost.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Slumbering Court'],
            },
            {
                quality: '5',
                sources: ['Slumbering Court', 'Artifact Strongbox: Husk of Opulent Dreams'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Bloom Times',
                icon: 'assets/artifacts/Bloom Times.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Plume of Luxury',
                icon: 'assets/artifacts/Plume of Luxury.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Song of Life',
                icon: 'assets/artifacts/Song of Life.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Calabash of Awakening',
                icon: 'assets/artifacts/Calabash of Awakening.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Skeletal Hat',
                icon: 'assets/artifacts/Skeletal Hat.avif',
            },
        ],
        effects: ['DEF Increase', 'Geo DMG Bonus', 'Elemental DMG Bonus'],
        version: '2.3',
        icon: 'assets/artifacts/Husk of Opulent Dreams.avif',
    },
    {
        name: 'Ocean-Hued Clam',
        two_piece_bonus: 'Healing Bonus +15%.',
        four_piece_bonus:
            'When the character equipping this artifact set heals a character in the party, a Sea-Dyed Foam will appear for 3 seconds, accumulating the amount of HP recovered from healing (including overflow healing).At the end of the duration, the Sea-Dyed Foam will explode, dealing DMG to nearby opponents based on 90% of the accumulated healing.(This DMG is calculated similarly to Reactions such as Electro-Charged, and Superconduct, but it is not affected by Elemental Mastery, Character Levels, or Reaction DMG Bonuses).Only one Sea-Dyed Foam can be produced every 3.5 seconds.Each Sea-Dyed Foam can accumulate up to 30,000 HP (including overflow healing).There can be no more than one Sea-Dyed Foam active at any given time.This effect can still be triggered even when the character who is using this artifact set is not on the field.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Slumbering Court'],
            },
            {
                quality: '5',
                sources: ['Slumbering Court', 'Artifact Strongbox: Ocean-Hued Clam'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Sea-Dyed Blossom',
                icon: 'assets/artifacts/Sea-Dyed Blossom.avif',
            },
            {
                type: 'Plume of Death',
                name: "Deep Palace's Plume",
                icon: "assets/artifacts/Deep Palace's Plume.avif",
            },
            {
                type: 'Sands of Eon',
                name: 'Cowry of Parting',
                icon: 'assets/artifacts/Cowry of Parting.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Pearl Cage',
                icon: 'assets/artifacts/Pearl Cage.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Crown of Watatsumi',
                icon: 'assets/artifacts/Crown of Watatsumi.avif',
            },
        ],
        effects: ['Healing Bonus', 'Physical DMG Dealing'],
        version: '2.3',
        icon: 'assets/artifacts/Ocean-Hued Clam.avif',
    },
    {
        name: 'Vermillion Hereafter',
        two_piece_bonus: 'ATK +18%.',
        four_piece_bonus:
            "After using an Elemental Burst. this character will gain the Nascent Light effect, increasing their ATK by 8% for 16s. When the character's HP decreases, their ATK will further increase by 10%. This increase can occur this way maximum of 4 times. This effect can be triggered once every 0.8s. Nascent Light will be dispelled when the character leaves the field. If an Elemental Burst is used again during the duration of Nascent Light, the original Nascent Light will be dispelled.",
        how_to_obtain: [
            {
                quality: '4',
                sources: ['The Lost Valley', 'Domain Reliquary: Tier II'],
            },
            {
                quality: '5',
                sources: ['The Lost Valley', 'Domain Reliquary: Tier I', 'Artifact Strongbox: Vermillion Hereafter'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Flowering Life',
                icon: 'assets/artifacts/Flowering Life.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Feather of Nascent Light',
                icon: 'assets/artifacts/Feather of Nascent Light.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Solar Relic',
                icon: 'assets/artifacts/Solar Relic.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Moment of the Pact',
                icon: 'assets/artifacts/Moment of the Pact.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Thundering Poise',
                icon: 'assets/artifacts/Thundering Poise.avif',
            },
        ],
        effects: ['ATK Increase', 'HP Loss'],
        version: '2.6',
        icon: 'assets/artifacts/Vermillion Hereafter.avif',
    },
    {
        name: 'Echoes of an Offering',
        two_piece_bonus: 'ATK +18%.',
        four_piece_bonus:
            'When Normal Attacks hit opponents, there is a 36% chance that it will trigger Valley Rite, which will increase Normal Attack DMG by 70% of ATK.This effect will be dispelled 0.05s after a Normal Attack deals DMG.If a Normal Attack fails to trigger Valley Rite, the odds of it triggering the next time will increase by 20%.This trigger can occur once every 0.2s.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['The Lost Valley', 'Domain Reliquary: Tier II'],
            },
            {
                quality: '5',
                sources: ['The Lost Valley', 'Domain Reliquary: Tier I', 'Artifact Strongbox: Echoes of an Offering'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Soulscent Bloom',
                icon: 'assets/artifacts/Soulscent Bloom.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Jade Leaf',
                icon: 'assets/artifacts/Jade Leaf.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Symbol of Felicitation',
                icon: 'assets/artifacts/Symbol of Felicitation.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Chalice of the Font',
                icon: 'assets/artifacts/Chalice of the Font.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Flowing Rings',
                icon: 'assets/artifacts/Flowing Rings.avif',
            },
        ],
        effects: ['ATK Increase', 'Additive Base DMG Bonus', 'Normal Attack DMG Increase'],
        version: '2.6',
        icon: 'assets/artifacts/Echoes of an Offering.avif',
    },
    {
        name: 'Deepwood Memories',
        two_piece_bonus: 'Dendro DMG Bonus +15%',
        four_piece_bonus:
            "After Elemental Skills or Bursts hit opponents, the targets' Dendro RES will be decreased by 30% for 8s. This effect can be triggered even if the equipping character is not on the field.",
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Spire of Solitary Enlightenment'],
            },
            {
                quality: '5',
                sources: ['Spire of Solitary Enlightenment', 'Artifact Strongbox: Deepwood Memories'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Labyrinth Wayfarer',
                icon: 'assets/artifacts/Labyrinth Wayfarer.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Scholar of Vines',
                icon: 'assets/artifacts/Scholar of Vines.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'A Time of Insight',
                icon: 'assets/artifacts/A Time of Insight.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Lamp of the Lost',
                icon: 'assets/artifacts/Lamp of the Lost.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Laurel Coronet',
                icon: 'assets/artifacts/Laurel Coronet.avif',
            },
        ],
        effects: ['Elemental DMG Bonus', 'Dendro DMG Bonus', 'Dendro RES Reduction'],
        version: '3.0',
        icon: 'assets/artifacts/Deepwood Memories.avif',
    },
    {
        name: 'Gilded Dreams',
        two_piece_bonus: 'Increases Elemental Mastery by 80.',
        four_piece_bonus:
            'Within 8s of triggering an Elemental Reaction, the character equipping this will obtain buffs based on the Elemental Type of the other party members. ATK is increased by 14% for each party member whose Elemental Type is the same as the equipping character, and Elemental Mastery is increased by 50 for every party member with a different Elemental Type. Each of the aforementioned buffs will count up to 3 characters. This effect can be triggered once every 8s. The character who equips this can still trigger its effects when not on the field.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Spire of Solitary Enlightenment'],
            },
            {
                quality: '5',
                sources: ['Spire of Solitary Enlightenment', 'Artifact Strongbox: Gilded Dreams'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Dreaming Steelbloom',
                icon: 'assets/artifacts/Dreaming Steelbloom.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Feather of Judgment',
                icon: 'assets/artifacts/Feather of Judgment.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'The Sunken Years',
                icon: 'assets/artifacts/The Sunken Years.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Honeyed Final Feast',
                icon: 'assets/artifacts/Honeyed Final Feast.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Shadow of the Sand King',
                icon: 'assets/artifacts/Shadow of the Sand King.avif',
            },
        ],
        effects: ['Elemental Mastery', 'ATK Increase', 'Elemental Reaction'],
        version: '3.0',
        icon: 'assets/artifacts/Gilded Dreams.avif',
    },
    {
        name: 'Desert Pavilion Chronicle',
        two_piece_bonus: 'Anemo DMG Bonus +15%.',
        four_piece_bonus:
            "When Charged Attacks hit opponents, the equipping character's Normal Attack SPD will increase by 10% while Normal, Charged, and Plunging Attack DMG will increase by 40% for 15s.",
        how_to_obtain: [
            {
                quality: '4',
                sources: ['City of Gold'],
            },
            {
                quality: '5',
                sources: ['City of Gold', 'Artifact Strongbox: Desert Pavilion Chronicle'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'The First Days of the City of Kings',
                icon: 'assets/artifacts/The First Days of the City of Kings.avif',
            },
            {
                type: 'Plume of Death',
                name: 'End of the Golden Realm',
                icon: 'assets/artifacts/End of the Golden Realm.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Timepiece of the Lost Path',
                icon: 'assets/artifacts/Timepiece of the Lost Path.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Defender of the Enchanting Dream',
                icon: 'assets/artifacts/Defender of the Enchanting Dream.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Legacy of the Desert High-Born',
                icon: 'assets/artifacts/Legacy of the Desert High-Born.avif',
            },
        ],
        effects: ['Elemental DMG Bonus', 'Anemo DMG Bonus', 'Normal Attack DMG Increase', 'Charged Attack DMG Increase', 'Plunging Attack DMG Increase', 'Attack SPD Increase'],
        version: '3.3',
        icon: 'assets/artifacts/Desert Pavilion Chronicle.avif',
    },
    {
        name: 'Flower of Paradise Lost',
        two_piece_bonus: 'Increases Elemental Mastery by 80.',
        four_piece_bonus:
            "The equipping character's Bloom, Hyperbloom, and Burgeon reaction DMG are increased by 40%. Additionally, after the equipping character triggers Bloom, Hyperbloom, or Burgeon, they will gain another 25% bonus to the effect mentioned prior. Each stack of this lasts 10s. Max 4 stacks simultaneously. This effect can only be triggered once per second. The character who equips this can still trigger its effects when not on the field.",
        how_to_obtain: [
            {
                quality: '4',
                sources: ['City of Gold'],
            },
            {
                quality: '5',
                sources: ['City of Gold', 'Artifact Strongbox: Flower of Paradise Lost'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Ay-Khanoum's Myriad",
                icon: "assets/artifacts/Ay-Khanoum's Myriad.avif",
            },
            {
                type: 'Plume of Death',
                name: 'Wilting Feast',
                icon: 'assets/artifacts/Wilting Feast.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'A Moment Congealed',
                icon: 'assets/artifacts/A Moment Congealed.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: "Secret-Keeper's Magic Bottle",
                icon: "assets/artifacts/Secret-Keeper's Magic Bottle.avif",
            },
            {
                type: 'Circlet of Logos',
                name: 'Amethyst Crown',
                icon: 'assets/artifacts/Amethyst Crown.avif',
            },
        ],
        effects: ['Bloom DMG Increase', 'Hyperbloom DMG Increase', 'Burgeon DMG Increase', 'Elemental Mastery', 'Elemental Reaction DMG Increase', 'Elemental Reaction'],
        version: '3.3',
        icon: 'assets/artifacts/Flower of Paradise Lost.avif',
    },
    {
        name: "Nymph's Dream",
        two_piece_bonus: 'Hydro DMG Bonus +15%',
        four_piece_bonus:
            'After Normal, Charged, and Plunging Attacks, Elemental Skills, and Elemental Bursts hit opponents, 1 stack of Mirrored Nymph will be triggered, lasting 8s. When under the effect of 1, 2, or 3 or more Mirrored Nymph stacks, ATK will be increased by 7%/16%/25%, and Hydro DMG will be increased by 4%/9%/15%. Mirrored Nymph created by Normal, Charged, and Plunging Attacks, Elemental Skills, and Elemental Bursts exist independently.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Molten Iron Fortress'],
            },
            {
                quality: '5',
                sources: ['Molten Iron Fortress', "Artifact Strongbox: Nymph's Dream"],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Odyssean Flower',
                icon: 'assets/artifacts/Odyssean Flower.avif',
            },
            {
                type: 'Plume of Death',
                name: "Wicked Mage's Plumule",
                icon: "assets/artifacts/Wicked Mage's Plumule.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Nymph's Constancy",
                icon: "assets/artifacts/Nymph's Constancy.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Heroes' Tea Party",
                icon: "assets/artifacts/Heroes' Tea Party.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Fell Dragon's Monocle",
                icon: "assets/artifacts/Fell Dragon's Monocle.avif",
            },
        ],
        effects: ['Elemental DMG Bonus', 'Hydro DMG Bonus', 'ATK Increase'],
        version: '3.6',
        icon: "assets/artifacts/Nymph's Dream.avif",
    },
    {
        name: "Vourukasha's Glow",
        two_piece_bonus: 'HP +20%',
        four_piece_bonus:
            'Elemental Skill and Elemental Burst DMG will be increased by 10%. After the equipping character takes DMG, the aforementioned DMG Bonus is increased by 80% for 5s. This effect increase can have 5 stacks. The duration of each stack is counted independently. These effects can be triggered even when the equipping character is not on the field.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Molten Iron Fortress'],
            },
            {
                quality: '5',
                sources: ['Molten Iron Fortress', "Artifact Strongbox: Vourukasha's Glow"],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Stamen of Khvarena's Origin",
                icon: "assets/artifacts/Stamen of Khvarena's Origin.avif",
            },
            {
                type: 'Plume of Death',
                name: 'Vibrant Pinion',
                icon: 'assets/artifacts/Vibrant Pinion.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Ancient Abscission',
                icon: 'assets/artifacts/Ancient Abscission.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Feast of Boundless Joy',
                icon: 'assets/artifacts/Feast of Boundless Joy.avif',
            },
            {
                type: 'Circlet of Logos',
                name: "Heart of Khvarena's Brilliance",
                icon: "assets/artifacts/Heart of Khvarena's Brilliance.avif",
            },
        ],
        effects: ['HP Increase', 'Elemental Skill DMG Increase', 'Elemental Burst DMG Increase'],
        version: '3.6',
        icon: "assets/artifacts/Vourukasha's Glow.avif",
    },
    {
        name: 'Marechaussee Hunter',
        two_piece_bonus: 'Normal and Charged Attack DMG +15%.',
        four_piece_bonus: 'When current HP increases or decreases, CRIT Rate will be increased by 12% for 5s. Max 3 stacks.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Denouement of Sin'],
            },
            {
                quality: '5',
                sources: ['Denouement of Sin', 'Artifact Strongbox: Marechaussee Hunter'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Hunter's Brooch",
                icon: "assets/artifacts/Hunter's Brooch.avif",
            },
            {
                type: 'Plume of Death',
                name: "Masterpiece's Overture",
                icon: "assets/artifacts/Masterpiece's Overture.avif",
            },
            {
                type: 'Sands of Eon',
                name: 'Moment of Judgment',
                icon: 'assets/artifacts/Moment of Judgment.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Forgotten Vessel',
                icon: 'assets/artifacts/Forgotten Vessel.avif',
            },
            {
                type: 'Circlet of Logos',
                name: "Veteran's Visage",
                icon: "assets/artifacts/Veteran's Visage.avif",
            },
        ],
        effects: ['Normal Attack DMG Increase', 'Charged Attack DMG Increase', 'CRIT Rate'],
        version: '4.0',
        icon: 'assets/artifacts/Marechaussee Hunter.avif',
    },
    {
        name: 'Golden Troupe',
        two_piece_bonus: 'Increases Elemental Skill DMG by 20%.',
        four_piece_bonus:
            'Increases Elemental Skill DMG by 25%. Additionally, when not on the field, Elemental Skill DMG will be further increased by 25%. This effect will be cleared 2s after taking the field.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Denouement of Sin'],
            },
            {
                quality: '5',
                sources: ['Denouement of Sin', 'Artifact Strongbox: Golden Troupe'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Golden Song's Variation",
                icon: "assets/artifacts/Golden Song's Variation.avif",
            },
            {
                type: 'Plume of Death',
                name: "Golden Bird's Shedding",
                icon: "assets/artifacts/Golden Bird's Shedding.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Golden Era's Prelude",
                icon: "assets/artifacts/Golden Era's Prelude.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Golden Night's Bustle",
                icon: "assets/artifacts/Golden Night's Bustle.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Golden Troupe's Reward",
                icon: "assets/artifacts/Golden Troupe's Reward.avif",
            },
        ],
        effects: ['Elemental Skill DMG Increase'],
        version: '4.0',
        icon: 'assets/artifacts/Golden Troupe.avif',
    },
    {
        name: 'Song of Days Past',
        two_piece_bonus: 'Healing Bonus +15%',
        four_piece_bonus:
            'When the equipping character heals a party member, the Yearning effect will be created for 6s, which records the total amount of healing provided (including overflow healing). When the duration expires, the Yearning effect will be transformed into the "Waves of Days Past" effect: When your active party member hits an opponent with a Normal Attack, Charged Attack, Plunging Attack, Elemental Skill, or Elemental Burst, the DMG dealt will be increased by 8% of the total healing amount recorded by the Yearning effect. The "Waves of Days Past" effect is removed after it has taken effect 5 times or after 10s. A single instance of the Yearning effect can record up to 15,000 healing, and only a single instance can exist at once, but it can record the healing from multiple equipping characters. Equipping characters on standby can still trigger this effect.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Waterfall Wen'],
            },
            {
                quality: '5',
                sources: ['Waterfall Wen'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Forgotten Oath of Days Past',
                icon: 'assets/artifacts/Forgotten Oath of Days Past.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Recollection of Days Past',
                icon: 'assets/artifacts/Recollection of Days Past.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Echoing Sound From Days Past',
                icon: 'assets/artifacts/Echoing Sound From Days Past.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Promised Dream of Days Past',
                icon: 'assets/artifacts/Promised Dream of Days Past.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Poetry of Days Past',
                icon: 'assets/artifacts/Poetry of Days Past.avif',
            },
        ],
        effects: ['Healing Bonus', 'Additive Base DMG Bonus'],
        version: '4.3',
        icon: 'assets/artifacts/Song of Days Past.avif',
    },
    {
        name: 'Nighttime Whispers in the Echoing Woods',
        two_piece_bonus: 'ATK +18%',
        four_piece_bonus:
            'After using an Elemental Skill, gain a 20% Geo DMG Bonus for 10s. While under a shield granted by the Crystallize reaction, the above effect will be increased by 150%, and this additional increase disappears 1s after that shield is lost.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Waterfall Wen'],
            },
            {
                quality: '5',
                sources: ['Waterfall Wen'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Selfless Floral Accessory',
                icon: 'assets/artifacts/Selfless Floral Accessory.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Honest Quill',
                icon: 'assets/artifacts/Honest Quill.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Faithful Hourglass',
                icon: 'assets/artifacts/Faithful Hourglass.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Magnanimous Ink Bottle',
                icon: 'assets/artifacts/Magnanimous Ink Bottle.avif',
            },
            {
                type: 'Circlet of Logos',
                name: "Compassionate Ladies' Hat",
                icon: "assets/artifacts/Compassionate Ladies' Hat.avif",
            },
        ],
        effects: ['ATK Increase', 'Elemental DMG Bonus', 'Geo DMG Bonus', 'Elemental Reaction'],
        version: '4.3',
        icon: 'assets/artifacts/Nighttime Whispers in the Echoing Woods.avif',
    },
    {
        name: 'Fragment of Harmonic Whimsy',
        two_piece_bonus: 'ATK +18%',
        four_piece_bonus: 'When the value of a Bond of Life increases or decreases, this character deals 18% increased DMG for 6s. Max 3 stacks.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Faded Theater'],
            },
            {
                quality: '5',
                sources: ['Faded Theater'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Harmonious Symphony Prelude',
                icon: 'assets/artifacts/Harmonious Symphony Prelude.avif',
            },
            {
                type: 'Plume of Death',
                name: "Ancient Sea's Nocturnal Musing",
                icon: "assets/artifacts/Ancient Sea's Nocturnal Musing.avif",
            },
            {
                type: 'Sands of Eon',
                name: 'The Grand Jape of the Turning of Fate',
                icon: 'assets/artifacts/The Grand Jape of the Turning of Fate.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Ichor Shower Rhapsody',
                icon: 'assets/artifacts/Ichor Shower Rhapsody.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Whimsical Dance of the Withered',
                icon: 'assets/artifacts/Whimsical Dance of the Withered.avif',
            },
        ],
        effects: ['ATK Increase', 'DMG Increase', 'Bond of Life'],
        version: '4.6',
        icon: 'assets/artifacts/Fragment of Harmonic Whimsy.avif',
    },
    {
        name: 'Unfinished Reverie',
        two_piece_bonus: 'ATK +18%',
        four_piece_bonus:
            'After leaving combat for 3s, DMG dealt increased by 50%. In combat, if no Burning opponents are nearby for more than 6s, this DMG Bonus will decrease by 10% per second until it reaches 0%. When a Burning opponent exists, it will increase by 10% instead until it reaches 50%. This effect still triggers if the equipping character is off-field.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Faded Theater'],
            },
            {
                quality: '5',
                sources: ['Faded Theater'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Dark Fruit of Bright Flowers',
                icon: 'assets/artifacts/Dark Fruit of Bright Flowers.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Faded Emerald Tail',
                icon: 'assets/artifacts/Faded Emerald Tail.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Moment of Attainment',
                icon: 'assets/artifacts/Moment of Attainment.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'The Wine-Flask Over Which the Plan Was Hatched',
                icon: 'assets/artifacts/The Wine-Flask Over Which the Plan Was Hatched.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Crownless Crown',
                icon: 'assets/artifacts/Crownless Crown.avif',
            },
        ],
        effects: ['ATK Increase', 'DMG Increase'],
        version: '4.6',
        icon: 'assets/artifacts/Unfinished Reverie.avif',
    },
    {
        name: 'Scroll of the Hero of Cinder City',
        two_piece_bonus: 'When a nearby party member triggers a Nightsoul Burst, the equipping character regenerates 6 Elemental Energy.',
        four_piece_bonus:
            "After the equipping character triggers a reaction related to their Elemental Type, all nearby party members gain a 12% Elemental DMG Bonus for the Elemental Types involved in the elemental reaction for 15s. If the equipping character is in the Nightsoul's Blessing state when triggering this effect, all nearby party members gain an additional 28% Elemental DMG Bonus for the Elemental Types involved in the elemental reaction for 20s. The equipping character can trigger this effect while off-field, and the DMG bonus from Artifact Sets with the same name do not stack.",
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Sanctum of Rainbow Spirits'],
            },
            {
                quality: '5',
                sources: ['Sanctum of Rainbow Spirits', 'Tribal Secret Space'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Beast Tamer's Talisman",
                icon: "assets/artifacts/Beast Tamer's Talisman.avif",
            },
            {
                type: 'Plume of Death',
                name: "Mountain Ranger's Marker",
                icon: "assets/artifacts/Mountain Ranger's Marker.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Mystic's Gold Dial",
                icon: "assets/artifacts/Mystic's Gold Dial.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Wandering Scholar's Claw Cup",
                icon: "assets/artifacts/Wandering Scholar's Claw Cup.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Demon-Warrior's Feather Mask",
                icon: "assets/artifacts/Demon-Warrior's Feather Mask.avif",
            },
        ],
        effects: ['Nightsoul Burst', 'Energy', 'Elemental DMG Bonus', "Nightsoul's Blessing"],
        version: '5.0',
        icon: 'assets/artifacts/Scroll of the Hero of Cinder City.avif',
    },
    {
        name: 'Obsidian Codex',
        two_piece_bonus: "While the equipping character is in Nightsoul's Blessing and is on the field, their DMG dealt is increased by 15%.",
        four_piece_bonus: 'After the equipping character consumes 1 Nightsoul point while on the field, CRIT Rate increases by 40% for 6s. This effect can trigger once every second.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Sanctum of Rainbow Spirits'],
            },
            {
                quality: '5',
                sources: ['Sanctum of Rainbow Spirits', 'Tribal Secret Space'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: 'Reckoning of the Xenogenic',
                icon: 'assets/artifacts/Reckoning of the Xenogenic.avif',
            },
            {
                type: 'Plume of Death',
                name: 'Root of the Spirit-Marrow',
                icon: 'assets/artifacts/Root of the Spirit-Marrow.avif',
            },
            {
                type: 'Sands of Eon',
                name: 'Myths of the Night Realm',
                icon: 'assets/artifacts/Myths of the Night Realm.avif',
            },
            {
                type: 'Goblet of Eonothem',
                name: 'Pre-Banquet of the Contenders',
                icon: 'assets/artifacts/Pre-Banquet of the Contenders.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Crown of the Saints',
                icon: 'assets/artifacts/Crown of the Saints.avif',
            },
        ],
        effects: ["Nightsoul's Blessing", 'DMG Increase', 'CRIT Rate', 'Nightsoul Point'],
        version: '5.0',
        icon: 'assets/artifacts/Obsidian Codex.avif',
    },
    {
        name: 'Finale of the Deep Galleries',
        two_piece_bonus: 'Cryo DMG Bonus +15%',
        four_piece_bonus:
            'When the equipping Character has 0 Elemental Energy, Normal Attack DMG is increased by 60% and Elemental Burst DMG is increased by 60%. After the equipping character deals Normal Attack DMG, the aforementioned Elemental Burst effect will stop applying for 6s. After the equipping character deals Elemental Burst DMG, the aforementioned Normal Attack effect will stop applying for 6s. This effect can trigger even if the equipping character is off the field.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Derelict Masonry Dock'],
            },
            {
                quality: '5',
                sources: ['Derelict Masonry Dock'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Deep Gallery's Echoing Song",
                icon: "assets/artifacts/Deep Gallery's Echoing Song.avif",
            },
            {
                type: 'Plume of Death',
                name: "Deep Gallery's Distant Pact",
                icon: "assets/artifacts/Deep Gallery's Distant Pact.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Deep Gallery's Moment of Oblivion",
                icon: "assets/artifacts/Deep Gallery's Moment of Oblivion.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: "Deep Gallery's Bestowed Banquet",
                icon: "assets/artifacts/Deep Gallery's Bestowed Banquet.avif",
            },
            {
                type: 'Circlet of Logos',
                name: "Deep Gallery's Lost Crown",
                icon: "assets/artifacts/Deep Gallery's Lost Crown.avif",
            },
        ],
        effects: ['Cryo DMG Bonus', 'Normal Attack DMG Increase', 'Elemental Burst DMG Increase'],
        version: '5.5',
        icon: 'assets/artifacts/Finale of the Deep Galleries.avif',
    },
    {
        name: "Long Night's Oath",
        two_piece_bonus: 'Plunging Attack DMG increased by 25%.',
        four_piece_bonus:
            'After the equipping character\'s Plunging Attack/Charged Attack/Elemental Skill hits an opponent, they will gain 1/2/2 stack(s) of "Radiance Everlasting." Plunging Attacks, Charged Attacks or Elemental Skills can each trigger this effect once every 1s. Radiance Everlasting: Plunging Attacks deal 15%. increased DMG for 6s. Max 5 stacks. Each stack\'s duration is counted independently.',
        how_to_obtain: [
            {
                quality: '4',
                sources: ['Derelict Masonry Dock'],
            },
            {
                quality: '5',
                sources: ['Derelict Masonry Dock'],
            },
        ],
        pieces: [
            {
                type: 'Flower of Life',
                name: "Lightkeeper's Pledge",
                icon: "assets/artifacts/Lightkeeper's Pledge.avif",
            },
            {
                type: 'Plume of Death',
                name: "Nightingale's Tail Feather",
                icon: "assets/artifacts/Nightingale's Tail Feather.avif",
            },
            {
                type: 'Sands of Eon',
                name: "Undying One's Mourning Bell",
                icon: "assets/artifacts/Undying One's Mourning Bell.avif",
            },
            {
                type: 'Goblet of Eonothem',
                name: 'A Horn Unwinded',
                icon: 'assets/artifacts/A Horn Unwinded.avif',
            },
            {
                type: 'Circlet of Logos',
                name: 'Dyed Tassel',
                icon: 'assets/artifacts/Dyed Tassel.avif',
            },
        ],
        effects: ['Plunging Attack DMG Increase'],
        version: '5.5',
        icon: "assets/artifacts/Long Night's Oath.avif",
    },
];
