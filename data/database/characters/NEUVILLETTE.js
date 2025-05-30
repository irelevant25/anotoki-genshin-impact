var NEUVILLETTE = {
    name: 'Neuvillette',
    secondary_title: 'Ordainer of Inexorable Judgment',
    card_icon: 'assets/character/card/Neuvillette.avif',
    wish_icon: 'assets/character/wish/Neuvillette.avif',
    ingame_icon: 'assets/character/ingame/Neuvillette.avif',
    icon: 'assets/character/icon/Neuvillette.avif',
    quality: '5',
    weapon: {
        name: 'Catalyst',
        icon: 'assets/weapon_types/Catalyst.avif',
    },
    element: {
        name: 'Hydro',
        icon: 'assets/elements/Hydro.avif',
    },
    model: 'Tall Male',
    arkhe: 'Pneuma',
    roles: [
        {
            name: 'On-Field',
            icon: 'assets/roles/On-Field.avif',
        },
        {
            name: 'DPS',
            icon: 'assets/roles/DPS.avif',
        },
    ],
    birthday: 'December 18th',
    constellations: [
        {
            name: 'Venerable Institution',
            level: 1,
            icon: 'assets/character/constellations/Venerable Institution.avif',
            description:
                'When Neuvillette takes the field, he will obtain 1 stack of Past Draconic Glories from the Passive Talent "Heir to the Ancient Sea\'s Authority." You must first unlock the Passive Talent "Heir to the Ancient Sea\'s Authority."Additionally, his interruption resistance will be increased while using the Charged Attack Empowerment: Legal Evaluation and the Charged Attack: Equitable Judgment.',
        },
        {
            name: 'Juridical Exhortation',
            level: 2,
            icon: 'assets/character/constellations/Juridical Exhortation.avif',
            description:
                'The Passive Talent "Heir to the Ancient Sea\'s Authority" will be enhanced: Each stack of Past Draconic Glories will increase the CRIT DMG of Charged Attack: Equitable Judgment by 14%. The maximum increase that can be achieved this way is 42%.You must first unlock the Passive Talent "Heir to the Ancient Sea\'s Authority."',
        },
        {
            name: 'Ancient Postulation',
            level: 3,
            icon: 'assets/character/constellations/Ancient Postulation.avif',
            description: 'Increases the Level of Normal Attack: As Water Seeks Equilibrium by 3.Maximum upgrade level is 15.',
        },
        {
            name: 'Crown of Commiseration',
            level: 4,
            icon: 'assets/character/constellations/Crown of Commiseration.avif',
            description: 'When Neuvillette is on the field and is healed, 1 Sourcewater Droplet will be generated. This effect can occur once every 4s.',
        },
        {
            name: 'Axiomatic Judgment',
            level: 5,
            icon: 'assets/character/constellations/Axiomatic Judgment.avif',
            description: 'Increases the Level of O Tides, I Have Returned by 3.Maximum upgrade level is 15.',
        },
        {
            name: 'Wrathful Recompense',
            level: 6,
            icon: 'assets/character/constellations/Wrathful Recompense.avif',
            description:
                "When using Charged Attack: Equitable Judgment, Neuvillette can absorb nearby Sourcewater Droplets in an AoE. Each absorbed Droplet will increase the duration of Charged Attack: Equitable Judgment by 1s.Additionally, when Equitable Judgment hits opponents, it will fire off 2 additional currents every 2s, each of which will deal 10% of Neuvillette's Max HP as Hydro DMG. DMG dealt this way will count as DMG dealt by Equitable Judgment.",
        },
    ],
    region: {
        name: 'Fontaine',
        icon: 'assets/regions/Fontaine.avif',
    },
    affiliations: ['Court of Fontaine', 'Marechaussee Phantom', 'Palais Mermonia', 'Seven Sovereigns'],
    special_dish: {
        name: '"Consommé Purete"',
        icon: 'assets/foods/Consommé Purete.avif',
    },
    namecard: {
        icon: 'assets/character/namecard_icon/Neuvillette.avif',
        background: 'assets/character/namecard_background/Neuvillette.avif',
        banner: 'assets/character/namecard_banner/Neuvillette.avif',
        description: "The water's surface may seem placid as a pristine gem, but it may yet be lying in wait for an opportune moment to gush forth.",
        quality: '4',
        sources: ['Reward for reaching Friendship Level 10 with Neuvillette'],
    },
    how_to_obtain: 'Event Wish — Decree of the Deeps',
    release_date: 'September 27, 2023',
    titles: ['Iudex of Fontaine'],
    family: {},
    voice_actors: [
        {
            language: 'English',
            actor: 'Ray Chase',
        },
        {
            language: 'Chinese',
            actor: 'Sang Yuze (桑毓泽)',
        },
        {
            language: 'Japanese',
            actor: 'Kamiya Hiroshi (神谷浩史)',
        },
        {
            language: 'Korean',
            actor: 'Kwak Yoon-sang (곽윤상)',
        },
    ],
    ascensions_materials_and_stats: [
        {
            phase: 0,
            primary_stat: {
                name: 'CRIT DMG',
                value: '—',
            },
            levels: [
                {
                    level: '1/20',
                    hp: 1143.98,
                    atk: 16.22,
                    def: 44.87,
                },
                {
                    level: '20/20',
                    hp: 2967.49,
                    atk: 42.07,
                    def: 116.4,
                },
            ],
            cost: [],
        },
        {
            phase: 1,
            primary_stat: {
                name: 'CRIT DMG',
                value: '—',
            },
            levels: [
                {
                    level: '20/40',
                    hp: 3948.36,
                    atk: 55.97,
                    def: 154.87,
                },
                {
                    level: '40/40',
                    hp: 5908,
                    atk: 83.76,
                    def: 231.74,
                },
            ],
            cost: [
                {
                    name: 'Mora',
                    value: 20000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Varunada Lazurite Sliver',
                    value: 1,
                    icon: 'assets/materials/Varunada Lazurite Sliver.avif',
                    quality: '2',
                },
                {
                    name: 'Lumitoile',
                    value: 3,
                    icon: 'assets/materials/Lumitoile.avif',
                    quality: '0',
                },
                {
                    name: 'Transoceanic Pearl',
                    value: 3,
                    icon: 'assets/materials/Transoceanic Pearl.avif',
                    quality: '1',
                },
            ],
        },
        {
            phase: 2,
            primary_stat: {
                name: 'CRIT DMG',
                value: '9.6%',
            },
            levels: [
                {
                    level: '40/50',
                    hp: 6604.93,
                    atk: 93.63,
                    def: 259.08,
                },
                {
                    level: '50/50',
                    hp: 7599.05,
                    atk: 107.73,
                    def: 298.07,
                },
            ],
            cost: [
                {
                    name: 'Mora',
                    value: 40000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Fontemer Unihorn',
                    value: 2,
                    icon: 'assets/materials/Fontemer Unihorn.avif',
                    quality: '4',
                },
                {
                    name: 'Varunada Lazurite Fragment',
                    value: 3,
                    icon: 'assets/materials/Varunada Lazurite Fragment.avif',
                    quality: '3',
                },
                {
                    name: 'Lumitoile',
                    value: 10,
                    icon: 'assets/materials/Lumitoile.avif',
                    quality: '0',
                },
                {
                    name: 'Transoceanic Pearl',
                    value: 15,
                    icon: 'assets/materials/Transoceanic Pearl.avif',
                    quality: '1',
                },
            ],
        },
        {
            phase: 3,
            primary_stat: {
                name: 'CRIT DMG',
                value: '19.2%',
            },
            levels: [
                {
                    level: '50/60',
                    hp: 8528.29,
                    atk: 120.9,
                    def: 334.52,
                },
                {
                    level: '60/60',
                    hp: 9532.71,
                    atk: 135.14,
                    def: 373.92,
                },
            ],
            cost: [
                {
                    name: 'Mora',
                    value: 60000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Fontemer Unihorn',
                    value: 4,
                    icon: 'assets/materials/Fontemer Unihorn.avif',
                    quality: '4',
                },
                {
                    name: 'Varunada Lazurite Fragment',
                    value: 6,
                    icon: 'assets/materials/Varunada Lazurite Fragment.avif',
                    quality: '3',
                },
                {
                    name: 'Lumitoile',
                    value: 20,
                    icon: 'assets/materials/Lumitoile.avif',
                    quality: '0',
                },
                {
                    name: 'Transoceanic Chunk',
                    value: 12,
                    icon: 'assets/materials/Transoceanic Chunk.avif',
                    quality: '2',
                },
            ],
        },
        {
            phase: 4,
            primary_stat: {
                name: 'CRIT DMG',
                value: '19.2%',
            },
            levels: [
                {
                    level: '60/70',
                    hp: 10229.64,
                    atk: 145.02,
                    def: 401.26,
                },
                {
                    level: '70/70',
                    hp: 11243.21,
                    atk: 159.39,
                    def: 441.02,
                },
            ],
            cost: [
                {
                    name: 'Mora',
                    value: 80000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Fontemer Unihorn',
                    value: 8,
                    icon: 'assets/materials/Fontemer Unihorn.avif',
                    quality: '4',
                },
                {
                    name: 'Varunada Lazurite Chunk',
                    value: 3,
                    icon: 'assets/materials/Varunada Lazurite Chunk.avif',
                    quality: '4',
                },
                {
                    name: 'Lumitoile',
                    value: 30,
                    icon: 'assets/materials/Lumitoile.avif',
                    quality: '0',
                },
                {
                    name: 'Transoceanic Chunk',
                    value: 18,
                    icon: 'assets/materials/Transoceanic Chunk.avif',
                    quality: '2',
                },
            ],
        },
        {
            phase: 5,
            primary_stat: {
                name: 'CRIT DMG',
                value: '28.8%',
            },
            levels: [
                {
                    level: '70/80',
                    hp: 11940.14,
                    atk: 169.27,
                    def: 468.35,
                },
                {
                    level: '80/80',
                    hp: 12965.15,
                    atk: 183.8,
                    def: 508.56,
                },
            ],
            cost: [
                {
                    name: 'Mora',
                    value: 100000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Fontemer Unihorn',
                    value: 12,
                    icon: 'assets/materials/Fontemer Unihorn.avif',
                    quality: '4',
                },
                {
                    name: 'Varunada Lazurite Chunk',
                    value: 6,
                    icon: 'assets/materials/Varunada Lazurite Chunk.avif',
                    quality: '4',
                },
                {
                    name: 'Lumitoile',
                    value: 45,
                    icon: 'assets/materials/Lumitoile.avif',
                    quality: '0',
                },
                {
                    name: 'Xenochromatic Crystal',
                    value: 12,
                    icon: 'assets/materials/Xenochromatic Crystal.avif',
                    quality: '3',
                },
            ],
        },
        {
            phase: 6,
            primary_stat: {
                name: 'CRIT DMG',
                value: '38.4%',
            },
            levels: [
                {
                    level: '80/90',
                    hp: 13662.08,
                    atk: 193.68,
                    def: 535.9,
                },
                {
                    level: '90/90',
                    hp: 14695.09,
                    atk: 208.32,
                    def: 576.42,
                },
            ],
            cost: [
                {
                    name: 'Mora',
                    value: 120000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Fontemer Unihorn',
                    value: 20,
                    icon: 'assets/materials/Fontemer Unihorn.avif',
                    quality: '4',
                },
                {
                    name: 'Varunada Lazurite Gemstone',
                    value: 6,
                    icon: 'assets/materials/Varunada Lazurite Gemstone.avif',
                    quality: '5',
                },
                {
                    name: 'Lumitoile',
                    value: 60,
                    icon: 'assets/materials/Lumitoile.avif',
                    quality: '0',
                },
                {
                    name: 'Xenochromatic Crystal',
                    value: 24,
                    icon: 'assets/materials/Xenochromatic Crystal.avif',
                    quality: '3',
                },
            ],
        },
    ],
    talents: [
        {
            name: 'As Water Seeks Equilibrium',
            type: 'Normal Attack',
            icon: 'assets/character/talents/As Water Seeks Equilibrium.avif',
            description:
                "Normal AttackWith light flourishes, Neuvillette commands the tides to unleash a maximum of 3 attacks, dealing Hydro DMG.Charged Attack Empowerment: Legal EvaluationWhile charging up, Neuvillette will gather the power of water, forming it into a Seal of Arbitration. In this state, Neuvillette can move and change facing, and also absorb any Sourcewater Droplets in a certain AoE.Every Droplet he absorbs will increase the formation speed of the Seal, and will heal Neuvillette.When the charging is stopped, if the Symbol has yet to be formed, then a Charged Attack will be unleashed. If it has been formed, then a Charged Attack: Equitable Judgment will be unleashed.Charged AttackConsumes a fixed amount of Stamina to attack opponents with a rupturing blast of water, dealing AoE Hydro DMG.Charged Attack: Equitable JudgmentUnleashes surging torrents, dealing continuous AoE Hydro DMG to all opponents in a straight-line area in front of him.Equitable Judgment will not consume any Stamina and lasts 3s.If Neuvillette's HP is above 50%, he will continuously lose HP while using this attack.Plunging AttackGathering the might of Hydro, Neuvillette plunges towards the ground from mid-air, damaging all opponents in his path. Deals AoE Hydro DMG upon impact with the ground.",
        },
        {
            name: 'O Tears, I Shall Repay',
            type: 'Elemental Skill',
            icon: 'assets/character/talents/O Tears, I Shall Repay.avif',
            description:
                'Summons a Raging Waterfall that will deal AoE Hydro DMG to opponents in front of Neuvillette based on his Max HP. After hitting an opponent, this skill will generate 3 Sourcewater Droplets near that opponent.Arkhe: PneumaAt certain intervals, when the Raging Waterfall descends, a Spiritbreath Thorn will descend that will pierce opponents, dealing Pneuma-aligned Hydro DMG.',
        },
        {
            name: 'O Tides, I Have Returned',
            type: 'Elemental Burst',
            icon: 'assets/character/talents/O Tides, I Have Returned.avif',
            description:
                "Unleashes waves that will deal AoE Hydro DMG based on Neuvillette's Max HP. After a short interval, 2 waterfalls will descend and deal Hydro DMG in a somewhat smaller AoE, and will generate 6 Sourcewater Droplets within an area in front.",
        },
        {
            name: "Heir to the Ancient Sea's Authority",
            type: '1st Ascension Passive',
            icon: "assets/character/talents/Heir to the Ancient Sea's Authority.avif",
            description:
                'When a party member triggers a Vaporize, Frozen, Electro-Charged, Bloom, Hydro Swirl, or a Hydro Crystallize reaction on opponents, 1 stack of Past Draconic Glories will be granted to Neuvillette for 30s. Max 3 stacks. Past Draconic Glories causes Charged Attack: Equitable Judgment to deal 110%/125%/160% of its original DMG.The stacks of Past Draconic Glories created by each kind of Elemental Reaction exist independently.',
        },
        {
            name: 'Discipline of the Supreme Arbitration',
            type: '4th Ascension Passive',
            icon: 'assets/character/talents/Discipline of the Supreme Arbitration.avif',
            description: "For each 1% of Neuvillette's current HP greater than 30% of Max HP, he will gain 0.6% Hydro DMG Bonus. A maximum bonus of 30% can be obtained this way.",
        },
        {
            name: 'Gather Like the Tide',
            type: 'Utility Passive',
            icon: 'assets/character/talents/Gather Like the Tide.avif',
            description: 'Increases underwater Sprint SPD for your own party members by 15%.Not stackable with Passive Talents that provide the exact same effects.',
        },
    ],
    talents_materials: [
        {
            level: 2,
            cost: [
                {
                    name: 'Mora',
                    value: 12500,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Transoceanic Pearl',
                    value: 6,
                    icon: 'assets/materials/Transoceanic Pearl.avif',
                    quality: '1',
                },
                {
                    name: 'Teachings of Equity',
                    value: 3,
                    icon: 'assets/materials/Teachings of Equity.avif',
                    quality: '2',
                },
            ],
        },
        {
            level: 3,
            cost: [
                {
                    name: 'Mora',
                    value: 17500,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Transoceanic Chunk',
                    value: 3,
                    icon: 'assets/materials/Transoceanic Chunk.avif',
                    quality: '2',
                },
                {
                    name: 'Guide to Equity',
                    value: 2,
                    icon: 'assets/materials/Guide to Equity.avif',
                    quality: '3',
                },
            ],
        },
        {
            level: 4,
            cost: [
                {
                    name: 'Mora',
                    value: 25000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Transoceanic Chunk',
                    value: 4,
                    icon: 'assets/materials/Transoceanic Chunk.avif',
                    quality: '2',
                },
                {
                    name: 'Guide to Equity',
                    value: 4,
                    icon: 'assets/materials/Guide to Equity.avif',
                    quality: '3',
                },
            ],
        },
        {
            level: 5,
            cost: [
                {
                    name: 'Mora',
                    value: 30000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Transoceanic Chunk',
                    value: 6,
                    icon: 'assets/materials/Transoceanic Chunk.avif',
                    quality: '2',
                },
                {
                    name: 'Guide to Equity',
                    value: 6,
                    icon: 'assets/materials/Guide to Equity.avif',
                    quality: '3',
                },
            ],
        },
        {
            level: 6,
            cost: [
                {
                    name: 'Mora',
                    value: 37500,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Transoceanic Chunk',
                    value: 9,
                    icon: 'assets/materials/Transoceanic Chunk.avif',
                    quality: '2',
                },
                {
                    name: 'Guide to Equity',
                    value: 9,
                    icon: 'assets/materials/Guide to Equity.avif',
                    quality: '3',
                },
            ],
        },
        {
            level: 7,
            cost: [
                {
                    name: 'Mora',
                    value: 120000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Xenochromatic Crystal',
                    value: 4,
                    icon: 'assets/materials/Xenochromatic Crystal.avif',
                    quality: '3',
                },
                {
                    name: 'Philosophies of Equity',
                    value: 4,
                    icon: 'assets/materials/Philosophies of Equity.avif',
                    quality: '4',
                },
                {
                    name: 'Everamber',
                    value: 1,
                    icon: 'assets/materials/Everamber.avif',
                    quality: '5',
                },
            ],
        },
        {
            level: 8,
            cost: [
                {
                    name: 'Mora',
                    value: 260000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Xenochromatic Crystal',
                    value: 6,
                    icon: 'assets/materials/Xenochromatic Crystal.avif',
                    quality: '3',
                },
                {
                    name: 'Philosophies of Equity',
                    value: 6,
                    icon: 'assets/materials/Philosophies of Equity.avif',
                    quality: '4',
                },
                {
                    name: 'Everamber',
                    value: 1,
                    icon: 'assets/materials/Everamber.avif',
                    quality: '5',
                },
            ],
        },
        {
            level: 9,
            cost: [
                {
                    name: 'Mora',
                    value: 450000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Xenochromatic Crystal',
                    value: 9,
                    icon: 'assets/materials/Xenochromatic Crystal.avif',
                    quality: '3',
                },
                {
                    name: 'Philosophies of Equity',
                    value: 12,
                    icon: 'assets/materials/Philosophies of Equity.avif',
                    quality: '4',
                },
                {
                    name: 'Everamber',
                    value: 2,
                    icon: 'assets/materials/Everamber.avif',
                    quality: '5',
                },
            ],
        },
        {
            level: 10,
            cost: [
                {
                    name: 'Mora',
                    value: 700000,
                    icon: 'assets/materials/Mora.avif',
                    quality: '3',
                },
                {
                    name: 'Xenochromatic Crystal',
                    value: 12,
                    icon: 'assets/materials/Xenochromatic Crystal.avif',
                    quality: '3',
                },
                {
                    name: 'Philosophies of Equity',
                    value: 16,
                    icon: 'assets/materials/Philosophies of Equity.avif',
                    quality: '4',
                },
                {
                    name: 'Everamber',
                    value: 2,
                    icon: 'assets/materials/Everamber.avif',
                    quality: '5',
                },
                {
                    name: 'Crown of Insight',
                    value: 1,
                    icon: 'assets/materials/Crown of Insight.avif',
                    quality: '5',
                },
            ],
        },
    ],
    version: '4.1',
    introduced: '4.0',
    voice_overs: {
        story: {
            en: [
                {
                    title: 'Hello',
                    text: 'Greetings. I am the Chief Justice, or "Iudex" of Fontaine, but you may simply address me by using my surname, "Neuvillette." Not because I wish to keep my distance from you... No, I am merely conscious that being overly familiar may bring the impartiality of the judiciary into question in some people\'s eyes.If you have any requests or concerns, then — to the extent permissible by law, at least — we can sit down and discuss them together as we partake of some imported water from Qiaoying Village.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Hello.mp3',
                },
                {
                    title: 'Chat: Trials',
                    text: 'I see the value in my own work, but I also see the meaning in all the endeavors of the people of Fontaine. I believe I will continue to take pride in fulfilling my duties.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Chat - Trials.mp3',
                },
                {
                    title: 'Chat: Water Tasting',
                    text: "Water comes in many flavors to the discerning palate. Mondstadt's water is crisp and pure, while water from Liyue has an enduring aftertaste. In Inazuma, the water possesses a depth of flavor unlike any other. Sumeru's water, meanwhile, has a rich and complex flavor profile, but it must be savored patiently to fully appreciate it.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Chat - Water Tasting.mp3',
                },
                {
                    title: 'Chat: Melusines',
                    text: 'Melusines are beautiful creatures. They are the pride of Fontaine. Be sure to befriend them, and cause them no harm.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Chat - Melusines.mp3',
                },
                {
                    title: 'When It Rains',
                    text: 'Ah, my apologies. This heavy rain must be quite an inconvenience for you.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/When It Rains.mp3',
                },
                {
                    title: 'After the Rain',
                    text: "It's over...",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/After the Rain.mp3',
                },
                {
                    title: 'When Thunder Strikes',
                    text: 'What\'s that saying again... "A bolt from the blue"? Yes, yes, I believe that captures how it feels to me.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/When Thunder Strikes.mp3',
                },
                {
                    title: 'When It Snows',
                    text: "Snow is in fact one of water's natural self-cleansing mechanisms. But human activity tends to reduce snow's purity, so do not consume it.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/When It Snows.mp3',
                },
                {
                    title: 'When the Sun Is Out',
                    text: 'I find that the, um... beauty of bright sunlight is best appreciated from the indoors through a window.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/When the Sun Is Out.mp3',
                },
                {
                    title: 'In the Desert',
                    text: 'I cannot help but feel that you bringing me here is some sort of an assassination attempt...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/In the Desert.mp3',
                },
                {
                    title: 'Good Morning',
                    text: 'Good morning. I hope you have a wonderful day.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Good Morning.mp3',
                },
                {
                    title: 'Good Afternoon',
                    text: "Ah, it's past noon. You must be looking forward to your afternoon tea or coffee break? I certainly am.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Good Afternoon.mp3',
                },
                {
                    title: 'Good Evening',
                    text: 'Good evening. I hope you have not encountered any unpleasantness today.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Good Evening.mp3',
                },
                {
                    title: 'Good Night',
                    text: 'Good night. I am quite fond of the image of a perfectly still body of water, and it is on this note that I would like to wish you a peaceful, undisturbed sleep. May no waves of emotional distress ripple through your dreams tonight.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Good Night.mp3',
                },
                {
                    title: 'About Neuvillette: Trials',
                    text: 'I am no rabid fan of trials. I preside over them only out of duty, for this is the task that has been entrusted to me.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Neuvillette - Trials.mp3',
                },
                {
                    title: 'About Neuvillette: The Weeping Hydro Dragon',
                    text: 'So you have heard of that local legend as well? *sigh* Who told you about that? Or more pertinently, who was responsible for spreading it in the first place... Well, never mind. I don\'t think that the Hydro Dragon would "weep," per se. I think he just finds himself a little stirred when he gets a taste of the tears that have been shed on this land, on account of all the emotions they contain.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Neuvillette - The Weeping Hydro Dragon.mp3',
                },
                {
                    title: 'About Neuvillette: The Meaning of Trials',
                    text: "This is a topic that's been discussed ad nauseum... I don't mean to condescend to humanity, but it is quite clear to me that society's concepts of justice, fairness, equality, and rule of law are not equivalent, and can never be. Now of course, water always seeks its own level, and it was in this spirit that the previous Hydro Archon, Egeria, hoped to achieve universal equality by connecting all things with love. Her successor chose instead to seek equality by means of the law. But ultimately, due to various external factors, this unfortunately manifested itself in the distorted form of trials for the sake of trials. Nevertheless, there are reasons for everything. I should refrain from criticizing her.",
                    reading: '(Actual Voice-Over: [...] Nevertheless, there are reasons for everything — I suppose I should refrain from criticizing her.)',
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Neuvillette - The Meaning of Trials.mp3',
                },
                {
                    title: 'About Us: Witness',
                    text: 'Since you hail from beyond the stars, I invite you to be my witness as I judge this upended world. "This realm dismantled was of the Formidable Father himself, but what now reigns here is a cluster of filthy feathers. Though we live in a world of disarray, I shall undertake to restore all that has been broken."',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Us - Witness.mp3',
                },
                {
                    title: 'About Us: The Human World',
                    text: 'The time that I have spent living among the citizens of Fontaine, and traveling with you, has transformed my views. Besides this, I pardoned the sins of humanity long ago, so I can promise you that my future judgments will not cause any harm to the common folk. Nevertheless, my grievances with the usurpers have yet to be settled... They owe a debt of blood that shall not be forgotten.',
                    reading:
                        '(Actual Voice-Over: The time that I have spent living among the citizens of Fontaine, and traveling with you, has transformed my views. Even though before this I has pardoned the sins of humanity long ago, I can promise you that my future judgments will not cause any harm to the common folk. That being said, my grievances with the usurpers have yet to be settled... They owe a debt of blood that shall not be forgotten.)',
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Us - The Human World.mp3',
                },
                {
                    title: 'About the Vision: I',
                    text: 'I was once advised to wear a counterfeit Vision, so that I might more easily intervene during moments of crisis. To be quite frank, I was not enamored by this suggestion, nor the implication that one must only exercise the power that is rightfully theirs under false pretenses. With that said, however, I have developed a newfound appreciation for the value of human yearning and determination having spent considerable time around Vision-bearing humans.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About the Vision - I.mp3',
                },
                {
                    title: 'About the Vision: II',
                    text: "Excuse me? You're saying even some members of The Seven don a counterfeit Vision before mingling with their people? Ha... My apologies — I was just caught off guard by the absurdity of the situation.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About the Vision - II.mp3',
                },
                {
                    title: 'Something to Share: Laws',
                    text: 'Fontaine does have some rather intriguing laws on its books. For instance, "it is forbidden to release any flying objects during the first three days of each month," "during the dry season, all bivalves that wash ashore belong to the Hydro Archon, while other mollusks belong to the people," "no domestic pets shall be named after Furina," "tomato ketchup is to be consumed in restaurants only as a condiment, never on its own," and, finally, "Melusines are to be addressed using she/her pronouns, never the impersonal it/its"... That last one was my personal contribution.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Something to Share - Laws.mp3',
                },
                {
                    title: 'Something to Share: Rainy Days',
                    text: "Some days, my mind wanders, and I fantasize about walking into the rain... *sigh* Ah, but don't worry, my flights of fancy don't distract me from my work.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Something to Share - Rainy Days.mp3',
                },
                {
                    title: 'Interesting Things: Vishaps',
                    text: "The Vishaps' ancestry can be traced directly back to the Fontemer, which is why they are so adept at evolution. I am reminded of an old custom that the dragons once observed: We would take a sip of our perished young brethren's blood. Whenever the tides are disrupted by the motion of the moon and stars, the water within the bodies of us Hydro organisms surges up towards our heads, reminding us that our deceased kin will soon be revived.",
                    reading: "(Actual Voice-Over: The Vishaps' ancestry can be traced directly back to the Fontemer Sea, which is why they are so adept at evolution.[...])",
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Interesting Things - Vishaps.mp3',
                },
                {
                    title: 'Interesting Things: Humans',
                    text: 'From my observations, humans have a tendency to view themselves as being in opposition with nature. And whenever this point is raised, someone is always quick to respond by declaring that humans are in fact a part of nature, like any other organism. To someone like me, however, who knows an inkling of the truth, what would be most beneficial is if human civilization and the natural world of this planet could seek ways to co-exist with one another.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Interesting Things - Humans.mp3',
                },
                {
                    title: 'About the Geo Archon',
                    text: 'Nothing will stop me from rendering judgment on each of The Seven. As the Archon who won the Authority of Geo, Deus Auri must be called to trial. If one does not wish to see us on opposite sides of a conflict, they need not worry, for I intend to stay in Fontaine for the foreseeable future, which could well mean another four hundred years. As another point of consolation, even when the trial eventually takes place, it is still not a given that the judgment will lead to a physical confrontation.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About the Geo Archon.mp3',
                },
                {
                    title: 'About the Anemo Archon',
                    text: 'I shall fulfill my vow to judge all of The Seven in turn, even if the sky should fall and the ground give way. As the recipient of the Authority of Anemo, the God of Breeze and Hope must also stand trial. ...Hmm? He spends most of his time being a harmless drunkard, you say? Well, even so, I must meet him for myself and proceed from there.',
                    reading: '(Actual Voice-Over: [...] ...Hmm? He spends most of his time being a harmless drunkard...? *sigh* Well, even so, I must meet him for myself and proceed from there.)',
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About the Anemo Archon.mp3',
                },
                {
                    title: 'About the Electro Archon',
                    text: 'As a survivor of the dragon race who has regained my full dragonhood, I must fulfill my oath and obligations even if it means returning all the water in the oceans back to the heavens. In taking the Authority of Electro, the Narukami placed herself on the list of the usurpers. Oh, so she has isolated herself in the Plane of Euthymia, and now rarely appears in public? Then I shall pay her a visit in another few centuries.',
                    reading:
                        '(Actual Voice-Over: [...] She will— ...Oh, you say she has isolated herself in the Plane of Euthymia, and now rarely appears in public? Then I shall pay her a visit in another few centuries.)',
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About the Electro Archon.mp3',
                },
                {
                    title: 'About the Dendro Archon',
                    text: 'Though the day will come when I put her on trial, I must commend the God of Verdure on her sense of responsibility. Few things are without flaws in this world, but the devotion and benevolence she displays are a testament to her commitment to continued progress. I felt enormous regret when I learned of the mistreatment she has endured over the past five hundred years.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About the Dendro Archon.mp3',
                },
                {
                    title: 'About Wriothesley',
                    text: 'Wriothesley is a trustworthy man. I fought hard for the title and reputation he now has. I expect you to think that I\'ve simply been duped by his flattery and appearance of loyalty... But to that, I would quote the Inazuman proverb: "The words unspoken are the flower." Which means, some things are best left unsaid.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Wriothesley.mp3',
                },
                {
                    title: 'About Clorinde',
                    text: "Clorinde's peerless skills have made her the most powerful Champion Duelist in our nation. As a successor to the Marechaussee Hunters of old, she plays a vital role in ensuring the fairness and impartiality of the courtroom. Also, she's actually not as stoic as she might appear.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Clorinde.mp3',
                },
                {
                    title: 'About Lyney and Lynette',
                    text: "Their performances are just fascinating, don't you think? They draw you into a magical world where, on one hand, everything that takes place is part of an elaborate deception — but on the other, all manner of miracles are possible if you are only willing to believe.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Lyney and Lynette.mp3',
                },
                {
                    title: 'About Sigewinne',
                    text: "I don't know how Sigewinne is faring these days. But if I hear so much as the whiff of a rumor that she's being bullied, I shall summon Wriothesley here and demand an explanation. She's so kind and vulnerable... She brought me some Kamera film the last time she visited, and asked to listen to more of my commentary on the water of Natlan... How long is it until her next vacation?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Sigewinne.mp3',
                },
                {
                    title: 'About Furina',
                    text: 'Now, the curtain has finally fallen on her "performance"... The character she portrayed was an imaginary one, yet in playing that role she fulfilled her duties... Though she is meek and full of doubt by nature, she was able to use madness to stiffen her resolve and see her duty through to its conclusion. The work that she has done over the centuries is truly immense. If she were to ever make a return to the stage, I should personally attend the performance and give her my heartfelt applause... Yes, I must do so when the opportunity arises.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Furina.mp3',
                },
                {
                    title: 'About Navia',
                    text: "I regret to say that after my various interactions with her — such as when I inadvertently angered her, and when I accepted her apology — and even now, in spite of the guilt I continue to feel over what happened to her father, I feel... very distant from her, as if I'm observing the starry sky from the bottom of a deep lake. It is by no means intentional, and I also know it is not something that I can easily make up for. Unlike water, emotion does not settle quickly once agitated, nor is it naturally inclined towards equilibrium.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About Navia.mp3',
                },
                {
                    title: 'About the Pyro Archon',
                    text: "The Pyro Archon triumphed over the Abyss by leveraging rules and legacy — a truly commendable feat. Yet, holding an Authority seized from the dragons remains an unpardonable sin. I recognize, however, that Natlan has experienced great suffering, so I am in no hurry to act. Hm? You claim that historical records describe the battle against Xbalanque as a formal duel, and the victim's family was treated fairly? Complicated indeed, but a worthwhile consideration nonetheless...",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/About the Pyro Archon.mp3',
                },
                {
                    title: 'More About Neuvillette: I',
                    text: "I usually do my best to avoid forming personal relationships, or even collaborating with others outside of established procedures. But you have shown yourself to be trustworthy, and you have no problematic entanglements with Fontaine's local factions. Therefore, I would be pleased to journey with you.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/More About Neuvillette - I.mp3',
                },
                {
                    title: 'More About Neuvillette: II',
                    text: 'This is something that I can only say in private — I could never publicly share my views on this matter: It positively baffles me that Fonta has managed to become such a popular drink. Though, I suppose its appeal to humans is not beyond comprehension. One can both rehydrate and replenish blood sugar in one gulp, and at an exceptionally cheap price.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/More About Neuvillette - II.mp3',
                },
                {
                    title: 'More About Neuvillette: III',
                    text: 'I went to see an opera recently. It was about a lady whose personal charm and manipulative schemes allowed her to continue to dominate the affairs of the grand mansion where she lived even after her death, like a ghost that refused to be exorcised. The acting was impeccable, and the story exceptional. It also reminded me of the current state of affairs in the real world.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/More About Neuvillette - III.mp3',
                },
                {
                    title: 'More About Neuvillette: IV',
                    text: 'For a number of reasons, I rarely leave Fontaine. As a result, though I enjoy tasting spring water from all over the world, I always have it delivered to me here, rather than collecting it myself. And yes, subtle as the flavor differences between samples of different regions may be, I am perfectly capable of distinguishing between them. Do you still doubt me? I am the Iudex. I do not lie.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/More About Neuvillette - IV.mp3',
                },
                {
                    title: 'More About Neuvillette: V',
                    text: 'I have to say, my daily life is not without its inconveniences. For instance, I often find myself stepping on my robes as I sit down, or squashing my coiffure against the chair. And if I lean my head too far back, sometimes my hair even gets caught in the ornamentation. Nevertheless, I must wear these garments to maintain the dignity of a Chief Justice, and endure whatever inconveniences this entails. Incidentally, the world at large appears to operate on this general principle, too. Everyone is faced with an identity that they must accept, endure, understand, and eventually learn to co-exist with. This has been my experience all along.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/More About Neuvillette - V.mp3',
                },
                {
                    title: "Neuvillette's Hobbies",
                    text: 'Water tasting is a rather sophisticated discipline. Pyro-heated water has the standard "au naturel" flavor found ubiquitously in the natural world, while water boiled using charcoal has distinctly rustic notes. Similarly, while Cryo-chilled water is cold but otherwise unremarkable, the frozen rivers of Snezhnaya, when melted, produce a water with an entirely different flavor profile altogether.',
                    reading: null,
                    audio: "assets/character/voice_overs/Neuvillette/story/en/Neuvillette's Hobbies.mp3",
                },
                {
                    title: "Neuvillette's Troubles",
                    text: 'People seem to respond to the sight of a man in the rain without an umbrella as if it were some sort of strange spectacle.',
                    reading: null,
                    audio: "assets/character/voice_overs/Neuvillette/story/en/Neuvillette's Troubles.mp3",
                },
                {
                    title: 'Favorite Food',
                    text: 'Animals can survive for weeks without food, but merely a few days without water. There is no dish that could ever compare to pure, unadulterated water. With that in mind, food items that contain plenty of liquid are the next best thing.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Favorite Food.mp3',
                },
                {
                    title: 'Least Favorite Food',
                    text: 'How can people bring themselves to consume deep-fried foods? Or grilled food with no sauce? The worst culprits in my view are those Charcoal-Baked Ajilenakh Cakes. Surely, even eating a dehumidifying agent would be kinder on the stomach?',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Least Favorite Food.mp3',
                },
                {
                    title: 'Receiving a Gift: I',
                    text: 'Delicious. An abundance of juices, and the ingredients have been cooked to perfection.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Receiving a Gift - I.mp3',
                },
                {
                    title: 'Receiving a Gift: II',
                    text: 'A fine effort indeed. My only advice would be to increase the liquid content and reduce the amount of fat.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Receiving a Gift - II.mp3',
                },
                {
                    title: 'Receiving a Gift: III',
                    text: 'Too dry. A dish devoid of moisture has no way to convey the intentions of the chef.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Receiving a Gift - III.mp3',
                },
                {
                    title: 'Birthday',
                    text: "Ah, so it's your birthday. Happy birthday. I do not know if rain is in the forecast today, but let me see what I can do.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Birthday.mp3',
                },
                {
                    title: 'Feelings About Ascension: Intro',
                    text: "I'm a little more familiar with you now. I can match your movements.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Feelings About Ascension - Intro.mp3',
                },
                {
                    title: 'Feelings About Ascension: Building Up',
                    text: "Apparently, I'll have to show a little more of my true capabilities. I did not realize that you had such a penchant for getting into dangerous situations.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Feelings About Ascension - Building Up.mp3',
                },
                {
                    title: 'Feelings About Ascension: Climax',
                    text: "So this is what you're truly capable of? Then I shall have to get serious if I wish to catch up with you.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Feelings About Ascension - Climax.mp3',
                },
                {
                    title: 'Feelings About Ascension: Conclusion',
                    text: 'Now that I have reclaimed one of the Seven Authorities from the hands of the usurpers, I have regained my true form. I am now a fully fledged dragon, powerful enough to judge the rest of the gods. My final destiny is to judge the Usurper-King in the heavens above. But until that time comes, I will lend my power to you.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/en/Feelings About Ascension - Conclusion.mp3',
                },
            ],
            zh: [
                {
                    title: '初次见面…',
                    text: '您好，我是枫丹的最高审判官，称呼我的姓氏那维莱特就可以。并不是想要疏远您的意思，但太过亲近会被人怀疑司法体系的不公。有什么诉求的话——当然，合法范围内——我们可以坐下来谈一谈，一起品尝一下翘英庄运来的水。',
                    reading:
                        'Nín hǎo, wǒ shì fēng dān de zuìgāo shěnpàn guān, chēnghu wǒ de xìngshì nà wéi láitè jiù kěyǐ. Bìng bùshì xiǎng yào shūyuǎn nín de yìsi, dàn tàiguò qīnjìn huì bèi rén huáiyí sīfǎ tǐxì de bùgōng.yǒu shé me sùqiú dehuà— dāngrán, héfǎ fànwéi nèi— wǒmen kěyǐ zuò xiàlái tán yī tán, yīqǐ pǐncháng yīxià qiào yīng zhuāng yùn lái de shuǐ.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/初次见面….mp3',
                },
                {
                    title: '闲聊·审判',
                    text: '我既认可我自身工作的价值，也认同枫丹大众所作所为的意义。我想，我还是会以我的责任为荣的。',
                    reading: 'Wǒ jì rènkě wǒ zìshēn gōngzuò de jiàzhí, yě rèntóng fēng dān dàzhòng suǒzuò suǒwéi de yìyì. Wǒ xiǎng, wǒ háishì huì yǐ wǒ de zérèn wéi róng de.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/闲聊·审判.mp3',
                },
                {
                    title: '闲聊·品水',
                    text: '水的味道是很有讲究的。蒙德的水清冽，璃月的水回味悠长，稻妻的水口味幽邃深远，须弥的水味道虽然丰富但需要细品。',
                    reading:
                        'Shuǐ de wèidào shì hěn jiǎngjiù de. Méngdé de shuǐ qīngliè; Líyuè de shuǐ huíwèi yōucháng; Dàoqī de shuǐ kǒuwèi yōusuì shēnyuǎn; Xūmí de shuǐ wèidào suīrán fēngfù, dàn xūyào xì pǐn.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/闲聊·品水.mp3',
                },
                {
                    title: '闲聊·美露莘',
                    text: '美露莘是枫丹引以为傲的美丽生灵。你一定要和她们做好朋友，也不要伤害她们。',
                    reading: 'Měilùshēn shì Fēngdān yǐn yǐ wéi ào dì měilì shēnglíng. Nǐ yīdìng yào hé tāmen zuò hǎo péngyǒu, yě bùyào shānghài tāmen.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/闲聊·美露莘.mp3',
                },
                {
                    title: '下雨的时候…',
                    text: '啊，抱歉。雨这么大，对你来说想必是个麻烦吧…',
                    reading: 'A, bàoqiàn. Yǔ zhème dà, duì nǐ lái shuō xiǎngbì shìgè máfan ba…',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/下雨的时候….mp3',
                },
                {
                    title: '雨过天晴…',
                    text: '结束了…',
                    reading: 'Jiéshùle…',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/雨过天晴….mp3',
                },
                {
                    title: '打雷的时候…',
                    text: '对你们来说，是不是有句话叫晴天霹雳？对我来说就是这个感觉。',
                    reading: 'Duì nǐmen lái shuō, shì bùshì yǒu jù huà jiào qíngtiān pīlì? Duì wǒ lái shuō jiùshì zhège gǎnjué.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/打雷的时候….mp3',
                },
                {
                    title: '下雪的时候…',
                    text: '雪本身也是一种水的自洁手段。但是人类活动让雪不那么干净了，不要吃。',
                    reading: 'Xuě běnshēn yěshì yīzhǒng shuǐ de zì jié shǒuduàn, dànshì rénlèi huódòng ràng xuě bù nàme qiánjìngle, bùyào chī.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/下雪的时候….mp3',
                },
                {
                    title: '阳光很好…',
                    text: '这种天气最适合在室内窗边，嗯，欣赏阳光。',
                    reading: 'Zhè zhǒng tiānqì zuì shìhé zài shìnèi chuāng biān, ń, xīnshǎng yángguāng.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/阳光很好….mp3',
                },
                {
                    title: '在沙漠的时候…',
                    text: '这是…您对我谋杀计划的一环吗？',
                    reading: 'Zhè shì… nín duì wǒ de móushā jìhuà de yīhuán ma?',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/在沙漠的时候….mp3',
                },
                {
                    title: '早上好…',
                    text: '早上好。希望你今天过得愉快。',
                    reading: 'Zǎoshang hǎo. Xīwàng nǐ jīntiānguò dé yúkuài.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/早上好….mp3',
                },
                {
                    title: '中午好…',
                    text: '午安。你一定很期待红茶或者咖啡的时间吧，我也是。',
                    reading: 'Wǔ ān. Nǐ yīdìng hěn qídài hóngchá huòzhě kāfēi de shíjiān ba, wǒ yěshì.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/中午好….mp3',
                },
                {
                    title: '晚上好…',
                    text: '晚上好。希望今天你没有遇到什么难以释怀的坏事。',
                    reading: 'Wǎnshàng hǎo. Xīwàng jīntiān nǐ méiyǒu yù dào shénme nányǐ shìhuái de huàishì.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/晚上好….mp3',
                },
                {
                    title: '晚安…',
                    text: '晚安。对我来说平静的水面是美好的意象，所以我祝你今夜收获无梦的安眠。不要有任何梦的涟漪撩拨你的心绪。',
                    reading: "Wǎn'ān. Duì wǒ lái shuō píngjìng de shuǐmiàn shì měihǎo de yìxiàng, suǒyǐ wǒ zhù nǐ jīnyè shōuhuò wú mèng de ānmián. Bùyào yǒu rènhé mèng de liányī liáobō nǐ de xīnxù.",
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/晚安….mp3',
                },
                {
                    title: '关于那维莱特自己·审判',
                    text: '我又不是什么狂热的审判爱好者。「审判」只是我职责所在，是我被委任的目的。',
                    reading: 'Wǒ yòu bùshì shénme kuángrè de shěnpàn àihào zhě."Shěnpàn" zhǐshì wǒ zhízé suǒzài, shì wǒ bèi wěirèn de mùdì.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于那维莱特自己·审判.mp3',
                },
                {
                    title: '关于那维莱特自己·哭泣的水龙',
                    text: '你也听说过枫丹的这句民谣是吗？唉，这是谁教你的，又是谁让它流传开的…嗯，没什么。我觉得水龙不会哭，他只是品尝到了在大地之心里汇聚的泪水与所有的情绪，所以有所触动而已。',
                    reading:
                        'Nǐ yě tīng shuōguò fēng dān de zhè jù mínyáo shì ma? Āi, zhè shì shéi jiào nǐ de, yòu shì shéi ràng tā liúchuán kāi de…ń, méishénme. Wǒ juédé shuǐlóng bù huì kū, tā zhǐshì pǐncháng dàole zài dàdì zhī xīnlǐ huìjù de lèishuǐ yǔ suǒyǒu de qíngxù, suǒyǐ yǒu suǒ chùdòng éryǐ.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于那维莱特自己·哭泣的水龙.mp3',
                },
                {
                    title: '关于那维莱特自己·审判的意义',
                    text: '这是一个说烂的话题了。并非我要把自己置身人类之外，但是你看，「正义」、「公平」、「平等」、「法律」，这几个概念互相之间其实无法等同。水天然有「如水之平」的本性。前代水神厄歌莉娅希望以爱来联系众生，实现平等。如今这位选择了平等的「法律」，最后却因为种种外因扭曲成了一切只为「审判」的遗憾结果。不过这也另有原因，不该谴责。',
                    reading:
                        "Zhè shì yīgè shuōlàn de huàtíle. Bìngfēi wǒ yào bǎ zìjǐ zhìshēn rénlèi zhī wài, dànshì nǐ kàn,`zhèngyì',`gōngpíng',`píngděng',`fǎlǜ', zhè jǐ gè gàiniàn hù xiàng zhī jiān qíshí wúfǎ děngtóng. Shuǐ tiānrán yǒu `rúshuǐ zhī píng'de běnxìng. Qián dài shuǐshén è gēlìyà xīwàng yǐ ài lái liánxì zhòngshēng, shíxiàn píngděng. Rújīn zhè wèi xuǎnzéle píngděng de `fǎlǜ', zuìhòu què yīnwèi zhǒngzhǒng wàiyīn niǔqū chéngle yīqiè zhǐ wèi `shěnpàn'de yíhàn jiéguǒ. Bùguò zhè yě lìng yǒu yuányīn, bù gāi qiǎnzé.",
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于那维莱特自己·审判的意义.mp3',
                },
                {
                    title: '关于我们·见证者',
                    text: '既然你是天地外之人，那就由你见证吧，我对于这个倒错世界的审判。「本应由天父统治的雄邦，如今王位上坐的却是雉鸡。时代已然错乱脱节，而我就是为了扭整乾坤而生」。',
                    reading:
                        'Jìrán nǐ shì tiāndì wài zhī rén, nà jiù yóu nǐ jiànzhèng ba, wǒ duìyú zhège dào cuò shìjiè de shěnpàn."Běn yìng yóu tiān fù tǒngzhì de xióng bāng, rújīn wángwèi shàng zuò de què shì zhì jī. Shídài yǐrán cuòluàn tuōjié, ér wǒ jiùshì wèile niǔ zhěng qiánkūn ér shēng".',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于我们·见证者.mp3',
                },
                {
                    title: '关于我们·人间',
                    text: '与枫丹人民长久的相处以及与你的同行早已让我改观。再加上我早已赦免了人的罪，我可以与你约定，接下来的审判不会危害到普通人。但是我与僭主尚有未结清的恩怨，还有未得偿还的血仇。',
                    reading:
                        'Yǔ Fēngdān rénmín chángjiǔ de xiāngchǔ yǐjí yǔ nǐ de tóngxíng zǎoyǐ ràng wǒ gǎiguān. Zài jiā shàng wǒ zǎoyǐ shèmiǎnle rén de zuì, wǒ kěyǐ yǔ nǐ yuēdìng, jiē xiàlái de shěnpàn bù huì wéihài dào pǔtōng rén. Dànshì wǒ yǔ jiànzhǔ shàng yǒu wèi jié qīng de ēnyuàn, hái yǒu wèi dé chánghuán de xuèchóu.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于我们·人间.mp3',
                },
                {
                    title: '关于「神之眼」·其一',
                    text: '曾经有人建议我佩戴一个假的玻璃珠，这样方便危急时刻出手。说实话这个提议让我很不愉快，行使自己的力量却要带着假的面具去伪装。不过和持有神之眼的人相处久了，也明白他们的渴望与意志也是如此难能可贵。',
                    reading:
                        'Céngjīng yǒurén jiànyì wǒ pèidài yīgè jiǎ de bōlí zhū, zhèyàng fāngbiàn wéijí shíkè chūshǒu. Shuō shíhuà zhège tíyì ràng wǒ hěn bùyúkuài, xíngshǐ zìjǐ de lìliàng què yào dàizhe jiǎ de miànjù qù wèizhuāng. Bùguò hé chí yǒu shén zhī yǎn de rén xiāngchǔ jiǔle, yě míngbái tāmen de kěwàng yǔ yìzhì shì rúcǐ nánnéngkěguì.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于「神之眼」·其一.mp3',
                },
                {
                    title: '关于「神之眼」·其二',
                    text: '什么？你说最古老的七神有几个也得带着假玻璃珠行走在人间吗？噗。对不起失态了，这件事有些好笑。',
                    reading: 'Shénme, nǐ shuō zuì gǔlǎo de qīshén yǒu jǐ gè yě dé dàizhe jiǎ bōlí zhū xíngzǒu zài rénjiān ma? Pū. Duìbùqǐ shītàile, zhè jiàn shì yǒuxiē hǎoxiào.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于「神之眼」·其二.mp3',
                },
                {
                    title: '有什么想要分享·法律',
                    text: '枫丹确实有很多奇妙的法律，比如「每个月前三天不能放飞飞行物」、「枯水期搁浅的双壳贝类都属于水神，螺贝则属于人民」、「禁止给家养动物取名『芙宁娜』」、「禁止在食堂与餐厅单吃番茄酱」、「对美露莘称呼必须使用人格意味的『她』，不能用『它』」…最后一条是我推动立法的。',
                    reading:
                        'Fēngdān díquè yǒu hěnduō qímiào de fǎlǜ, bǐrú "měi gè yuè qián sān tiān bùnéng fàngfēi fēixíng wù","kū shuǐ qí gēqiǎn de shuāng qiào bèilèi dōu shǔyú shuǐshén, luó bèi zé shǔyú rénmín","jìnzhǐ bǎ jiālǐ yǎng de dòngwù qǔ míng \'Fúníngnà\'","jìnzhǐ zài cāntīng dān chī fānqiéjiàng","duì měilùshēn de chēnghu bìxū shǐyòng réngé yìwèi de \'tā\', bùnéng yòng \'tā\'"…zuìhòu yītiáo shì wǒ tuīdòng lìfǎ de.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/有什么想要分享·法律.mp3',
                },
                {
                    title: '有什么想要分享·雨天',
                    text: '时常在想，什么时候可以走入一场雨中。啊，你误会了，并不是压力太大。',
                    reading: 'Shícháng zài xiǎng, shénme shíhòu kěyǐ zǒu rù yī chǎng yǔzhōng. A, nǐ wùhuìle, bìng bùshì yālì tài dà.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/有什么想要分享·雨天.mp3',
                },
                {
                    title: '感兴趣的见闻·龙蜥',
                    text: '正是因它们同为原海所出之嫡系，所以对于进化之事十分擅长。我想起曾经龙中的风俗：我们啜饮一口早夭族类的血。当月与星的运行搅扰潮汐，我们水族体内的水也向上行去，我们便知道逝去的族人正在复活。',
                    reading:
                        'Zhèng shì yīn tāmen tóng wèi yuán hǎi suǒ chū zhī díxì, suǒyǐ duìyú jìnhuà zhī shì shífēn shàncháng. Wǒ xiǎngqǐ céngjīng lóng zhōng de fēngsú: Wǒmen chuài yǐn yīkǒu zǎo yāo zú lèi de xuè. Dàngyuè yǔ xīng de yùnxíng jiǎorǎo cháoxī, wǒmen shuǐzú tǐnèi de shuǐ yě xiàngshàng xíng qù, wǒmen biàn zhīdào shìqù de zúrén zhèngzài fùhuó.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/感兴趣的见闻·龙蜥.mp3',
                },
                {
                    title: '感兴趣的见闻·人类',
                    text: '就我的观察而言，人习惯将自己与自然对立。此时总会有人出来呼吁人也是自然的一部分。但在知道些许真相的我看来，人类的文明世界和这个星球的自然，应该算是需要寻求共处之道吧。',
                    reading:
                        'Jiù wǒ de guānchá ér yán, rénmen xíguàn jiāng zìjǐ yǔ zìrán duìlì, ér cǐ shí zǒng huì yǒurén chūlái hūyù rén yěshì zìrán de yībùfèn. Dàn zài zhīdào xiēxǔ zhēnxiàng de wǒ kàn lái, rénlèi de wénmíng shìjiè hé zhège xīngqiú de zìrán, yīnggāi suànshì xūyào xúnqiú gòngchǔ zhī dào ba.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/感兴趣的见闻·人类.mp3',
                },
                {
                    title: '关于岩之神…',
                    text: '我将对诸神行使裁决，没有任何事情可以改变这点。贵金之神赢取了岩之大权，他自然也在受审者之列。如果有谁不希望看到我们发生争执，也不必担心，我还需要在枫丹停留很久，说不定就要四百多年呢。而且最后的判决也不一定会导致兵戎相见。',
                    reading:
                        'Wǒ jiāng duì zhū shén xíngshǐ cáijué, méiyǒu rènhé shìqíng kěyǐ gǎibiàn zhè diǎn. Guìjīn zhī shén yíng qǔle yán zhī dàquán, tā zìrán yě zài shòushěn zhě zhī liè. Rúguǒ yǒu shuí bù xīwàng kàn dào wǒmen fāshēng zhēngzhí, yě bùbì dānxīn, wǒ hái xūyào zài fēng dān tíngliú hěnjiǔ, shuō bu dìng jiù yào sìbǎi duō nián…érqiě zuìhòu de pànjué yě bù yīdìng huì dǎozhì bīngróng xiāng jiàn.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于岩之神….mp3',
                },
                {
                    title: '关于风之神…',
                    text: '纵使天地翻覆，也无法停止我对于僭位七神的巡游审判。微风与希望之神获赠了风之大权，他也需要列席候审。你说他大部分时间都只是个醉汉，没有什么危险的了？那也得先见见吧。',
                    reading:
                        'Zòngshǐ tiāndì fānfù, yě wúfǎ tíngzhǐ wǒ duìyú jiàn wèi qī shén de xúnyóu shěnpàn. Wéifēng yǔ xīwàng zhī shén huò zèngle fēng zhī dàquán, tā yě xūyào lièxí hòushěn. Nǐ shuō tā dà bùfèn shíjiān dōu zhǐshì gè zuì hàn, méiyǒu shé me wéixiǎn dele? Nà yě yào xiānjiàn jiàn ba?',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于风之神….mp3',
                },
                {
                    title: '关于雷之神…',
                    text: '我作为重获全龙之格的孑遗，就算是让大海所有的水逆行回天，也需要履行我的誓言与责任。鸣神赢取了雷之大权，注定留名于僭权者之列。嗯，你说她现在蛰居于心成净土之中，极少现身？那我过几百年再去吧。',
                    reading:
                        'Wǒ zuòwéi chóng huò quán lóng zhī gé de jiéyí, jiùsuàn shì ràng dàhǎi suǒyǒu de shuǐ nìxíng huí tiān, yě xūyào lǚxíng wǒ de shìyán yǔ zérèn. Míngshén yíng qǔle léi zhī dàquán, zhùdìng liú míng yú jiàn quán zhě zhī liè. Ń…nǐ shuō tā xiànzài zhéjū yú xīn chéng jìngtǔ zhī zhōng, jíshǎo xiànshēn? Nà wǒguò jǐbǎinián zài qù ba…',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于雷之神….mp3',
                },
                {
                    title: '关于草之神…',
                    text: '即便将来会有审判她的一天，我也认可草木之神的责任感。世间难有完美的人与事，可专注和溺爱也证明了一个责任者不断前行。听说她曾遭到约五百年的冷遇，我很为她的经历遗憾。',
                    reading:
                        "Jíbiàn jiānglái huì yǒu shěnpàn tā de yītiān, wǒ yě rènkě cǎomù zhī shén de zérèngǎn. Shìjiān nàn yǒu wánměi de rén yǔ shì, dàn zhuānzhù hé nì'ài yě zhèngmíngliǎo yīgè zérèn zhě bùduàn qián xíng. Tīng shuō tā céng zāo dào yuē wǔbǎi nián de lěngyù, wǒ hěn wèi tā de jīnglì yíhàn.",
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于草之神….mp3',
                },
                {
                    title: '关于莱欧斯利…',
                    text: '莱欧斯利确实是一个值得信赖的人。他的头衔和名誉都是我给他争取的。是不是觉得我被他的话术和向上经营欺骗了？稻妻有句话叫「不说即是花」。',
                    reading:
                        'Lái ōu sī lì díquè shì yīgè zhídé xìnlài de rén. Tā de tóuxián hé míngyù dōu shì wǒ wèi tā zhēngqǔ de. Shì bùshì juédé wǒ bèi tā de huàshù hé xiàngshàng guǎnlǐ qīpiànle? Dào qī yǒu jù huà jiào "bù shuō jí shì huā".',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于莱欧斯利….mp3',
                },
                {
                    title: '关于克洛琳德…',
                    text: '克洛琳德凭借其超群实力成为了现任决斗代理人中的实力巅峰。她是逐影猎人这一行业的后继者，有她在，审判庭的公正更有保障。另外她会比外观看上去更有人情味一些。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于克洛琳德….mp3',
                },
                {
                    title: '关于林尼和琳妮特…',
                    text: '很有意思的演出，不是吗？这就是林尼和琳妮特的魔术世界，一切都假得出奇，但是只要你愿意相信，一切都可以成真。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于林尼和琳妮特….mp3',
                },
                {
                    title: '关于希格雯…',
                    text: '希格雯不知道过得好不好。要是她受欺负了我一定要把莱欧斯利喊进城里质问。她是那么脆弱，又那么的善良。上次她回来还给我带了留影机底片，还说想要听我继续点评纳塔的水…距离她下一个假期还要多久？',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于希格雯….mp3',
                },
                {
                    title: '关于芙宁娜…',
                    text: '时至今日，她的「演出」终于落幕。「表演」是想象的产物，但芙宁娜却凭此完成了自己的职责…怯懦之人用疯癫让自己勇敢，一直以来辛苦她了。有机会的话，应当为她的舞台献上掌声…嗯，一旦有机会的话。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于芙宁娜….mp3',
                },
                {
                    title: '关于娜维娅…',
                    text: '虽然这么说很对不起她，但无论是当时无意的触怒她、接受她的道歉还是我此时感受到的内疚，全部有种疏离的感觉，仿佛沉卧湖底看星星。我并不是有意的，我也知道很难有机会弥补。情绪并不像是水，能迅速地修复自己，恢复平静。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于娜维娅….mp3',
                },
                {
                    title: '关于火之神…',
                    text: '以规则与传承击退深渊，此为值得称颂之义举，然权柄乃是从龙类手中夺得，亦是罪无可逭。只不过纳塔元气大伤，确实也不必急于前往。嗯，你说根据史料那一战应该判定为正式决斗，并且希巴拉克也善待了被害者家属？虽然乱七八糟的，但是也有些道理…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/关于火之神….mp3',
                },
                {
                    title: '想要了解那维莱特·其一',
                    text: '我会尽量避免与他人有私交以及有流程外的协作。不过阁下的品行值得信任，与枫丹的势力也没有什么纠缠。很乐意与你同行。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/想要了解那维莱特·其一.mp3',
                },
                {
                    title: '想要了解那维莱特·其二',
                    text: '这话只能私下说，公共场合我绝对无法做此表态。枫达这个东西，能流行起来对我来说有点莫名其妙。不过人们很喜欢它也不是不能理解：你看，一边喝水一边补充糖分，而且它还价格低廉。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/想要了解那维莱特·其二.mp3',
                },
                {
                    title: '想要了解那维莱特·其三',
                    text: '最近看过一出戏剧。一个已经逝去的夫人凭借个人魅力与恶意的安排，如同无法驱散的鬼魅一般笼罩着她已不在其中的豪宅。演员无可挑剔，故事也很精巧，而且让我想到了世界的现状。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/想要了解那维莱特·其三.mp3',
                },
                {
                    title: '想要了解那维莱特·其四',
                    text: '出于某些原因，我离开枫丹的次数屈指可数，因此，我所品尝的名泉虽是来自世界各地，但都是从外地送来，而非我亲临当地。至于不同饮用水里面的细微味道，我自然能够区分出来。言已至此，还不相信我吗？我是最高审判官，不骗人。',
                    reading:
                        'Chū yú mǒu xiē yuányīn, wǒ líkāi fēng dān de cìshù qūzhǐ kě shǔ, yīncǐ wǒ suǒ pǐncháng de míng quán suī shì láizì shìjiè gèdì, dàn dōu shì cóng wàidì sòng lái, ér fēi wǒ qīnlín dāngdì pǐncháng de. Zhìyú bùtóng de yǐnyòng shuǐ lǐmiàn de xìwéi wèidào, wǒ dāngrán nénggòu qūfēn chūlái. Yán yǐ zhìcǐ, hái bù xiāngxìn wǒ ma? Wǒ shì zuìgāo shěnpàn guān, bù piàn rén.',
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/想要了解那维莱特·其四.mp3',
                },
                {
                    title: '想要了解那维莱特·其五',
                    text: '不得不说，我时常遇到一些令人无奈的事，例如坐下的时候踩到衣摆，偶尔压到头发，往后靠头部也可能被座椅装饰品卡住。为了维持最高审判官的威严，我保持这类装束，自然要忍受它带来的麻烦。世间几乎也遵循着如此的道理——接受一种身份，忍耐它，理解它，与它共存。这正是我一直在做的。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/想要了解那维莱特·其五.mp3',
                },
                {
                    title: '那维莱特的爱好…',
                    text: '品水是一门学问。用火元素加热的水味道就是自然界最标准的味道，而木炭烧开的水则有田园的味道。同理，冰元素处理的水是一种平淡无奇的清冽，但是至冬积冰所化之水就完全不一样。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/那维莱特的爱好….mp3',
                },
                {
                    title: '那维莱特的烦恼…',
                    text: '下雨天不打伞是不是看起来有些奇怪…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/那维莱特的烦恼….mp3',
                },
                {
                    title: '喜欢的食物…',
                    text: '动物不进食尚能活些时日，不喝水可活不了几天。什么美食都比不过纯净的水。所以汤水多的食物就是第二好的。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/喜欢的食物….mp3',
                },
                {
                    title: '讨厌的食物…',
                    text: '油炸或者无酱烤制的食物真的能吃吗？我想点名批评须弥椰炭饼，往人胃里塞干燥剂也不过如此。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/讨厌的食物….mp3',
                },
                {
                    title: '收到赠礼·其一',
                    text: '美味。菜肴最重要的汁水不仅很多，而且处理得很好。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/收到赠礼·其一.mp3',
                },
                {
                    title: '收到赠礼·其二',
                    text: '不错的尝试。只不过这道菜是不是可以多加点汤汁，再滤一点油脂出来。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/收到赠礼·其二.mp3',
                },
                {
                    title: '收到赠礼·其三',
                    text: '太干了。没有汁水的菜品尝不出厨师的心情。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/收到赠礼·其三.mp3',
                },
                {
                    title: '生日…',
                    text: '今天是你的生日啊，祝你生日快乐。不知道今天下不下雨，我会想想办法的。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/生日….mp3',
                },
                {
                    title: '突破的感受·起',
                    text: '稍微熟悉些了。我可以配合你的动作。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/突破的感受·起.mp3',
                },
                {
                    title: '突破的感受·承',
                    text: '看来需要拿出些真的本事了。没想到你这么容易身处险境。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/突破的感受·承.mp3',
                },
                {
                    title: '突破的感受·转',
                    text: '你的真正实力居然有如此地步吗？看来我不认真的话还无法跟上你了。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/突破的感受·转.mp3',
                },
                {
                    title: '突破的感受·合',
                    text: '从僭位者那里回收了七之大权一角，这才是我本来的身姿。我已是「完全之龙」，足以审判其余众神。我的命运将是审判高天的僭位之王。但在那之前，我就将力量借与你吧。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/zh/突破的感受·合.mp3',
                },
            ],
            ja: [
                {
                    title: '初めまして…',
                    text: 'ごきげんよう。私はフォンテーヌの最高審判官——私を呼ぶ際は、姓であるヌヴィレットを使ってくれ…これはわざと君を遠ざけているわけではない。あまり関係が近すぎてしまうと、司法制度の不正を疑われかねないのでね。何か要求があれば、翹英荘から運ばれた水を味わいながら、共に話し合おう——もちろん、法の範囲内に限るが。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/初めまして….mp3',
                },
                {
                    title: '世間話·審判',
                    text: '私は、自身の仕事の価値とフォンテーヌの人々が為すことの意義を認めている。自分の責任を、誇りに思っているのだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/世間話·審判.mp3',
                },
                {
                    title: '世間話·水の味',
                    text: '水の味は、実に幽遠な趣を持つ——モンドの水は清く澄んでいて、璃月の水は後味が長く続く。稲妻の水は深みがあり、スメールの水は複雑で、じっくりと舌で味わう必要があるのだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/世間話·水の味.mp3',
                },
                {
                    title: '世間話·メリュジーヌ',
                    text: 'メリュジーヌはフォンテーヌが誇る美しき生命体だ。彼女らとは良い関係を築くといい。決して、傷つけたりしないように。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/世間話·メリュジーヌ.mp3',
                },
                {
                    title: '雨の日…',
                    text: 'おっと、すまない。これほどの大雨は、君からすると厄介なものだったな…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/雨の日….mp3',
                },
                {
                    title: '雨上がり…',
                    text: '止んでしまったか…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/雨上がり….mp3',
                },
                {
                    title: '雷の日…',
                    text: 'たしか君たちの間には、青天の霹靂という言葉があったか？私からすれば、今がそのような感覚だ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/雷の日….mp3',
                },
                {
                    title: '雪の日…',
                    text: '雪とは、元より水の自浄手段だ。しかし人間の行いにより、雪はそう清潔なものではなくなった。口にするのはやめたほうがいい。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/雪の日….mp3',
                },
                {
                    title: '晴れの日…',
                    text: 'このような天気の日は、室内の窓辺で過ごすのが最適だ。うむ、日差しを堪能しよう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/晴れの日….mp3',
                },
                {
                    title: '砂漠にいる時…',
                    text: 'これは…私の抹殺計画の一環か？',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/砂漠にいる時….mp3',
                },
                {
                    title: 'おはよう…',
                    text: 'おはよう。善き一日になることを祈る。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/おはよう….mp3',
                },
                {
                    title: 'こんにちは…',
                    text: 'ごきげんよう。紅茶やコーヒーの時間を楽しみにしていることだろう。かくいう私もだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/こんにちは….mp3',
                },
                {
                    title: 'こんばんは…',
                    text: 'こんばんは。今日の君が、胸を痛める出来事に遭遇していないことを祈ろう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/こんばんは….mp3',
                },
                {
                    title: 'おやすみ…',
                    text: 'おやすみ。私にとって、静かな水面は美しさの表れだ。今宵、夢なき眠りに君が落ちることを祈ろう。如何なる夢のさざ波にも、気持ちを乱されず済むように。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/おやすみ….mp3',
                },
                {
                    title: 'ヌヴィレット自身について·審判',
                    text: '私は何も、熱狂的な審判愛好者ではない。「審判」は私の責務であり、委任された目的なのだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレット自身について·審判.mp3',
                },
                {
                    title: 'ヌヴィレット自身について·涙を流す水龍',
                    text: '君もフォンテーヌのあの民謡を聞いたことがあるのか？はぁ、一体誰から聞き、誰が広めている…いや、何でもない。水龍が泣くことはないと思うがな。彼はただ、大地の心に集う涙とすべての感情に触れ、心を動かされただけだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレット自身について·涙を流す水龍.mp3',
                },
                {
                    title: 'ヌヴィレット自身について·審判の意味',
                    text: 'これはすでに議論され尽くしている話題だ。私は自分を人間と無関係な立場に置くつもりはないが…「正義」、「公平」、「平等」、「法律」、これらの概念は互いに等しくあることはできない。水は元より「清きこと水の如し」という本質を持つ。先代水神のエゲリアは、衆生を愛で繋ぎ、平等を実現しようとした。今の神は、平等な「法律」を選んだが、結局は様々な外的要因によって歪められ、すべては「審判」のために——という残念な結果を生んでしまっている。だが、これには他にも理由があるゆえ、非難すべきではないのだが…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレット自身について·審判の意味.mp3',
                },
                {
                    title: '見届ける者について…',
                    text: '君は天地の外の者だ。この倒錯した世界に対する私の審判は、君が見届けるといい。「天父が統べるべきだった国は、今や雉が王座に就いている。すでに錯乱と逸脱に蝕まれし時代——我は天地を正すために生まれた」。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/見届ける者について….mp3',
                },
                {
                    title: '人間界について…',
                    text: 'フォンテーヌの民との長き付き合い、そして君との同行…これらにより、私の考えはとうに改まっている。それに、私はもう人の罪を赦した。今ここに君と約束しよう——今後の審判において、決して一般人には危害を加えない。ただ…私と僭主には、未だに清算されていない怨念と、償われていない血の仇がある。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/人間界について….mp3',
                },
                {
                    title: '「神の目」について·1',
                    text: 'かつて、危急の事態に備えるためにも、偽のガラス玉を身に付けるようアドバイスされたことがある。正直、その提案は少々不愉快に感じた。自身の力を行使するのに、偽りの仮面で取り繕うなど…だが、神の目を持つ者との長い付き合いで、彼らの「渇望」と「意志」が貴重なものであると、私も理解した。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/「神の目」について·1.mp3',
                },
                {
                    title: '「神の目」について·2',
                    text: '何？最古の七神でさえ、偽のガラス玉を付けて俗世を歩んでいる者たちがいると…？くくっ…いや失礼、少々取り乱した。あまりにも滑稽だったものでな。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/「神の目」について·2.mp3',
                },
                {
                    title: 'シェアしたいこと·法律',
                    text: '確かにフォンテーヌには、珍しい法律が数多くある。例えば「月始めの三日間は飛行物体を放ってはいけない」、「乾季に座礁した二枚貝はすべて水神のものであり、巻貝は民のものとする」、「ペットの名に『フリーナ』とつけてはいけない」、「食堂やレストランでケチャップのみを食べるのはいけない」、「メリュジーヌに対しては物を指す代名詞ではなく、人を指す『彼女』を使う」…最後の一条は私が推し進めたものだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/シェアしたいこと·法律.mp3',
                },
                {
                    title: 'シェアしたいこと·雨の日',
                    text: 'いつになれば雨を浴びられるのだろうかと——常々そう考えている。おっと、誤解しないでくれ、別にストレスを溜めてはいない。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/シェアしたいこと·雨の日.mp3',
                },
                {
                    title: '興味のあること·ヴィシャップ',
                    text: 'あれらは原海と同じ直系であるゆえ、進化に長けている。かつて、龍の間にはこのような風習があった——我らは夭逝した族の血をすすった。月と星の運行が潮汐を乱す時、我ら水族の体内にある水は上へと昇り、逝去した族人の復活を知る。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/興味のあること·ヴィシャップ.mp3',
                },
                {
                    title: '興味のあること·人間',
                    text: '私の観察からして、人は己と自然を対立させたがる。人も自然の一部だと言う者もいるが、少しばかり真相を知る私からすれば、人間の文明世界とこの星の自然は、共存の道を探す必要があるように思う。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/興味のあること·人間.mp3',
                },
                {
                    title: '岩の神について…',
                    text: '私は神々を裁く、これは何者にも変えられない。岩の大権を勝ち取った貴金の神も、当然ながら裁かれる側だ。もし、我らの争いを見たくない者がいたとしても、心配する必要はない。私はまだ、フォンテーヌに居続ける必要がある。その訪れが四百年以上先になることだってあり得るだろう。それに最終的な裁決が、必ずしも武力戦争に繋がるとは限らない。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/岩の神について….mp3',
                },
                {
                    title: '風の神について…',
                    text: 'たとえ天地がひっくり返ろうとも、七神に対する私の裁きを止めることはできない。そよ風と希望の神は風の大権を得たが、彼もまた審判を受ける必要がある…ほとんどただの酔っぱらいで、もう危険性はない、と？ふむ、まずは会ってみなければな。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/風の神について….mp3',
                },
                {
                    title: '雷の神について…',
                    text: '龍の力をすべて取り戻した生き残りとして、たとえ一切の海水が天に逆行させられようとも、私は「誓い」と「責任」を果たさなければならない。鳴神は雷の大権を勝ち取ったゆえ、僭主の列に名を刻むことになる。ふむ…彼女は今、一心浄土に閉じこもっていて、滅多に姿を現さないと？では、数百年後に会いに行ってみるとしよう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/雷の神について….mp3',
                },
                {
                    title: '草の神について…',
                    text: 'たとえ将来、彼女を審判する日が訪れようとも、草木の神が持つ責任感は認めよう。この世に完璧な人間や事柄はほぼ存在し得ない。だが、あの神の「傾倒」と「寵愛」は、責任を担う者が前へと進み続けてきたことを証明している。彼女は約五百年もの間、冷遇され続けたと聞いた。彼女が置かれてきた環境は実に遺憾に思う。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/草の神について….mp3',
                },
                {
                    title: 'リオセスリについて…',
                    text: 'リオセスリ殿は確かに信頼に足る男だ。そして彼の肩書きと名誉は、いずれも私が与えたものになる。彼の話術と出世への策に、私がまんまと嵌ったと思っているのではないか？だが稲妻には…「言わぬが花」ということわざがある。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/リオセスリについて….mp3',
                },
                {
                    title: 'クロリンデについて…',
                    text: 'その卓越した実力によって、クロリンデは現在いる決闘代理人の中で頂点に立つ存在となった。彼女はファントムハンターの後継者であり、彼女がいることで法廷の正義はより確固たるものになる。そして、彼女は見た目よりも些か人情を重んじるタイプだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/クロリンデについて….mp3',
                },
                {
                    title: 'リネとリネットについて…',
                    text: 'あの公演はとても愉しませてもらった、君もそうだろう？あれがリネ君とリネット君が魅せるマジックの世界だ——驚くほどすべてがまやかしではあるが、信じる心を持てば如何なることも叶ってしまう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/リネとリネットについて….mp3',
                },
                {
                    title: 'シグウィンについて…',
                    text: 'シグウィンは息災だろうか。もし仮にあの子が虐げられるようなことがあれば、リオセスリ殿を必ず街まで呼び、事の真相を問い詰めよう。あの子はとてもナイーブで、とても優しい。この前帰ってきた時には、写真を手にしながら「ナタの水だけど、またレビューを聞かせて」と言ってくれた…あの子の次の休みまで、あと何日待てばいいのだろうか。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/シグウィンについて….mp3',
                },
                {
                    title: 'フリーナについて…',
                    text: '今こうして、彼女の「公演」はついに幕を閉じた。「パフォーマンス」とは想像から生み出されるものだが、フリーナはそれをもってして自らの責務を果たしたのだ…臆病な者が狂気を用いて自らを勇敢にする——今まで実にご苦労であった。機会があれば、彼女の舞台に拍手を送りたい…うむ、機会が出来次第、そうするとしよう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/フリーナについて….mp3',
                },
                {
                    title: 'ナヴィアについて…',
                    text: 'このようなことを言うのは忍びないが…あの時、意図せず彼女の怒りを買ってしまったことや、彼女の謝罪を受け入れたこと、それから私がいま抱いている罪悪感、それらすべてが遠くのものであるように感じるのだ——まるで湖の底に沈み、そこから星空を眺めているかのようにな…私はそのようなつもりは毛頭なかったし、埋め合わせの機会がそう滅多に巡ってこないことも重々承知している。感情は水とは異なり、すぐに修復し、落ち着きを取り戻せるものではないからな。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ナヴィアについて….mp3',
                },
                {
                    title: '炎の神について…',
                    text: 'ルールと意志の伝承によりアビスを撃退したことは、称賛に値する快挙だ。しかし、その力が龍族から奪ったものであるという罪から逃れることはできない。だが、大戦を終えたばかりのナタに今すぐ赴く必要もなかろう。ん？文献によると、あの戦いは正式な決闘とみなされるべきだと？それに、シュバランケも被害者の血筋に優しく接したと？訳の分からない理屈だが、一理ありそうだな…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/炎の神について….mp3',
                },
                {
                    title: 'ヌヴィレットを知る·1',
                    text: '他人との個人的な付き合いや、必要なプロセスから外れた協力は極力避けるようにしている。だが、君の人柄は信頼に足るものであり、フォンテーヌの勢力と何の由縁もない。喜んで同行させてもらおう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレットを知る·1.mp3',
                },
                {
                    title: 'ヌヴィレットを知る·2',
                    text: 'これは内々にしか話せず、公にはできない類の考えなのだが…フォンタがこれほどまでに人気を博しているのは、私からすると些か不可解なことなのだ。だが、好きな人がいるのを理解できないわけでもない——水分を補給しながら糖分を摂取できる上に、値段も手頃だからな。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレットを知る·2.mp3',
                },
                {
                    title: 'ヌヴィレットを知る·3',
                    text: '最近、ある劇を観た——亡くなった婦人がそのカリスマ性と悪意ある采配を持ってして、まるで振り払うことができない亡霊のように、自分が去った後の豪邸を今なお覆っている——というものだ。役者は申し分なく、ストーリーも非の打ち所がない。そして、この世界の現状について、考えさせられるものであった。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレットを知る·3.mp3',
                },
                {
                    title: 'ヌヴィレットを知る·4',
                    text: '諸事情により、フォンテーヌを離れた回数は指で数えられるほどしかない。それゆえ、私が味わった名水は世界各地のものでありながら、いずれも自ら現地に足を運んで飲んだものではないのだ。だが、それぞれの飲み水が持つ微妙な味の違いは、無論区別できる…ん？ここまで言っても、まだ私を信じないと？私は最高審判官だ、嘘はつかん。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレットを知る·4.mp3',
                },
                {
                    title: 'ヌヴィレットを知る·5',
                    text: '座った時に裾を踏んだり、たまに髪が乱れたり、背もたれに寄りかかると椅子の装飾に頭が引っかかったりなど…しばし、困ったことに遭遇する。だが、最高審判官の威厳を保つために、このような身なりをしているのだ。ゆえに、それがもたらす煩わしさにも耐えなければならない。そして、この世の大半がその道理に通じている——身分を受け入れ、それに耐え、理解し、共存していく…私はまさにそうしてきた。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレットを知る·5.mp3',
                },
                {
                    title: 'ヌヴィレットの趣味…',
                    text: '水を味わうことは、一種の学問と言える。炎元素で熱した水の味は自然界において最も標準となる味であり、木炭で煮沸した水は田畑の味がする。同様に、氷元素で処理した水は平淡な清冽さを持つ。これはスネージナヤの積氷が溶けた水とは、全く異なるものだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレットの趣味….mp3',
                },
                {
                    title: 'ヌヴィレットの悩み…',
                    text: '雨の日に傘を差さないのは、些かおかしく映るだろうか…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/ヌヴィレットの悩み….mp3',
                },
                {
                    title: '好きな食べ物…',
                    text: '動物は何も食わずに数日生きられるが、水となると話は違う。どんな美食であろうとも、清く澄んだ水に敵うことはない。ゆえに、二番目に好んでいるものは汁気の多い食べ物だ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/好きな食べ物….mp3',
                },
                {
                    title: '嫌いな食べ物…',
                    text: '揚げ物や、タレを付けずに焼いたものをなぜ口にできる？取り分けその中でも、スメールのデーツナンは名指しで批判したいくらいだ。胃に乾燥剤を詰め込むのと同じようなものではないか。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/嫌いな食べ物….mp3',
                },
                {
                    title: '贈り物を受け取る·1',
                    text: '美味だ。料理において最も重要なのは溢れ出る汁気。それも、良く調理されているようだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/贈り物を受け取る·1.mp3',
                },
                {
                    title: '贈り物を受け取る·2',
                    text: '悪くない試みだ。ただ、もう少し出汁を加え、脂を抜けばより良くなるだろう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/贈り物を受け取る·2.mp3',
                },
                {
                    title: '贈り物を受け取る·3',
                    text: '少しパサパサしすぎている。汁気に欠ける料理は、料理人の気持ちも味わうことができない。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/贈り物を受け取る·3.mp3',
                },
                {
                    title: '誕生日…',
                    text: 'ふむ、今日は君の誕生日か、おめでとう。雨が降るかどうか分からないが…何とかしよう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/誕生日….mp3',
                },
                {
                    title: '突破した感想·起',
                    text: '少し慣れてきた。君の動きに合わせよう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/突破した感想·起.mp3',
                },
                {
                    title: '突破した感想·承',
                    text: '君がこうも簡単に危機に陥るとは…どうやら、真の力を発揮せねばならないようだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/突破した感想·承.mp3',
                },
                {
                    title: '突破した感想·転',
                    text: '君の実力がこれほどのものだったとはな。私も本気を出さなければついて行けないようだ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/突破した感想·転.mp3',
                },
                {
                    title: '突破した感想·結',
                    text: '七つの大権の一角を、僭主から取り戻した姿が本来の私だ。この身は既に「完全なる龍」であり、他の神々に審判を下すのに十分な存在となった。私の運命は、高天に座す僭位の王を裁くことになる。だがそれまでは、この力を君に貸しておくとしよう。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/story/ja/突破した感想·結.mp3',
                },
            ],
            ko: [
                {
                    title: '첫 만남…',
                    text: '안녕하십니까, 전 폰타인의 최고 심판관입니다. 호칭은 성씨인 느비예트로 불러주십시오. 일부러 당신과 거리를 두는 건 아닙니다. 다만 너무 가까워 보이면 사법 체제의 불공정함을 의심받을 수 있으니까요.저에게 하실 부탁이 있다면——아 물론, 합법적인 부탁이라면, 교영 마을에서 운송된 물을 음미하며 앉아서 얘기를 나눠보죠',
                    reading:
                        "Annyeonghasimnikka, jeon pontainui choego simpan'gwanimnida. Hoching'eun seongssiin neubiyeteuro bulleojusipsio. Ilbureo dangsin'gwa georireul duneun geon animnida. Daman neomu gakkawo boimyeon sabeop cheje'ui bulgongjeonghameul uisimbadeul su isseunikkayo.Jeo'ege hasil butagi itdamyeon⸺A mullon, hapbeopjeogin butagiramyeon, gyoyeong ma'eureseo unsongdoen mureul eummihamyeo anjaseo yaegireul nanwobojyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/첫 만남….mp3',
                },
                {
                    title: '잡담·심판',
                    text: '전 제 일의 가치와 폰타인 대중들이 한 일의 의미를 잘 압니다. 앞으로도 전 제 일에 자부심을 갖고 살아갈 겁니다',
                    reading: 'Jeon je irui gachiwa pontain daejungdeuri han irui uimireul jal amnida. Apeurodo jeon je ire jabusimeul gatgo saragal geomnida',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/잡담·심판.mp3',
                },
                {
                    title: '잡담·물맛 음미',
                    text: '물은 아주 다양한 맛이 있습니다. 몬드의 물은 청량하고 리월의 물은 뒷맛이 오래 가며, 이나즈마의 물은 깊고 그윽한 맛이 있습니다. 수메르의 물은 풍부한 맛이 있지만 자세히 음미해야 알 수 있죠',
                    reading:
                        'Mureun aju dayanghan masi itseumnida. Mondeuui mureun cheongnyanghago riworui mureun dwinmasi orae gamyeo, inajeumaui mureun gipgo geueukhan masi itseumnida. Sumereuui mureun pungbuhan masi itjiman jasehi eummihaeya al su itjyo',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/잡담·물맛 음미.mp3',
                },
                {
                    title: '잡담·멜뤼진',
                    text: '멜뤼진은 폰타인의 자랑이자 매우 아름다운 생물입니다. 부디 그들을 해치지 말고 친하게 지내주세요',
                    reading: "Mellwijineun pontainui jarang'ija mae'u areumdaun saengmurimnida. Budi geudeureul haechiji malgo chinhage jinaejuseyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/잡담·멜뤼진.mp3',
                },
                {
                    title: '비가 올 때…',
                    text: '아, 미안합니다. 비가 많이 내리면 곤란하시겠군요…',
                    reading: 'A, mianhamnida. Biga mani naerimyeon gollanhasigetgunyo...',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/비가 올 때….mp3',
                },
                {
                    title: '비가 그친 후…',
                    text: '끝났군요…',
                    reading: 'Kkeunnatgunyo...',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/비가 그친 후….mp3',
                },
                {
                    title: '번개가 칠 때…',
                    text: '「마른하늘에 날벼락」이라는 말이 있지 않습니까? 저에게 딱 그런 느낌입니다',
                    reading: '"Mareunhaneure nalbyeorak"-iraneun mari itji anseumnikka? Jeo\'ege ttak geureon neukkimimnida',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/번개가 칠 때….mp3',
                },
                {
                    title: '눈이 올 때…',
                    text: '눈은 물의 자체 정화 수단이기도 하죠. 하지만 인간의 활동으로 더 이상 전처럼 깨끗하지 않으니 드시진 마십시오',
                    reading: "Nuneun murui jache jeonghwa sudanigido hajyo. Hajiman in'ganui hwaldong'euro deo isang jeoncheoreom kkaekkeuthaji aneuni deusijin masipsio",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/눈이 올 때….mp3',
                },
                {
                    title: '햇살이 좋을 때…',
                    text: '이런 날씨에는… 실내 창가에서 햇빛을 감상하는 게 최고죠',
                    reading: "Ireon nalssieneun... Sillae changga'eseo haetbicheul gamsanghaneun ge choegojyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/햇살이 좋을 때….mp3',
                },
                {
                    title: '사막에 있을 때…',
                    text: '이건… 저를 암살하려는 계획의 일환입니까?',
                    reading: 'Igeon... Jeoreul amsalharyeoneun gyehoegui ilhwanimnikka?',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/사막에 있을 때….mp3',
                },
                {
                    title: '아침 인사…',
                    text: '좋은 아침입니다. 즐거운 하루 보내시길 바랍니다',
                    reading: 'Joeun achimimnida. Jeulgeoun haru bonaesigil baramnida',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/아침 인사….mp3',
                },
                {
                    title: '점심 인사…',
                    text: '좋은 점심입니다. 분명 홍차나 커피를 마실 시간이 기대되시겠죠. 저도 그렇습니다',
                    reading: 'Joeun jeomsimimnida. Bunmyeong hongchana keopireul masil sigani gidaedoesigetjyo. Jeodo geureoseumnida',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/점심 인사….mp3',
                },
                {
                    title: '저녁 인사…',
                    text: '좋은 저녁입니다. 오늘은 신경 쓰이는 일이 없으셨길 바랍니다',
                    reading: "Joeun jeonyeogimnida. Oneureun sin'gyeong sseu'ineun iri eopseusyeotgil baramnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/저녁 인사….mp3',
                },
                {
                    title: '굿나잇…',
                    text: '좋은 밤 되십시오. 전 개인적으로 잔잔한 수면이 아주 아름답다고 생각하는데, 꿈을 꾸지 않고 편안하게 주무시길 바랍니다. 그 어떤 꿈의 물결에도 방해받지 않으셨으면 좋겠군요',
                    reading:
                        'Joeun bam doesipsio. Jeon gaeinjeogeuro janjanhan sumyeoni aju areumdapdago saenggakhaneunde, kkumeul kkuji anko pyeonanhage jumusigil baramnida. Geu eotteon kkumui mulgyeoredo banghaebatji aneusyeosseumyeon joketgunyo',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/굿나잇….mp3',
                },
                {
                    title: '느비예트 자신에 대해·심판',
                    text: '전 심판에 열광하는 심판 애호가가 아닙니다. 「심판」은 그저 저의 책임이자, 제가 위임받은 목적에 불과하죠',
                    reading: 'Jeon simpane yeolgwanghaneun simpan aehogaga animnida. "Simpan"-eun geujeo jeoui chaegimija, jega wiimbadeun mokjeoge bulgwahajyo',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트 자신에 대해·심판.mp3',
                },
                {
                    title: '느비예트 자신에 대해·눈물을 흘리는 물의 용',
                    text: '당신도 그 폰타인 민요에 대해 들으신 겁니까? 하아… 누구한테 들으셨습니까? 대체 누가 그걸 퍼트린 건지…. 아무것도 아닙니다. 전 물의 용이 울 거라고 생각하지 않습니다. 그저 대지에 모인 눈물과 모든 감정을 맛보고 느낀 바가 있는 것뿐이겠죠',
                    reading:
                        "Dangsindo geu pontain minyoe daehae deureusin geomnikka? Haa... Nuguhante deureusyeotseumnikka? Daeche nuga geugeol peoteurin geonji.... Amugeotdo animnida. Jeon murui yong'i ul georago saenggakhaji anseumnida. Geujeo daejie moin nunmulgwa modeun gamjeong'eul matbogo neukkin baga inneun geotppunigetjyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트 자신에 대해·눈물을 흘리는 물의 용.mp3',
                },
                {
                    title: '느비예트 자신에 대해·심판의 의미',
                    text: '입이 닳도록 얘기한 화제군요. 저를 인간의 범주에서 제외하려는 건 아닙니다만, 생각해 보십시오. 「정의」, 「공정」, 「평등」, 「법률」, 이 개념들은 서로 동등할 수 없습니다. 물은 「공평」하다는 본성을 지녔고, 전대 물의 신 에게리아는 모든 생명을 사랑으로 연결 지어 평등을 이루려고 했죠. 그리고 지금의 신은 평등한 「법률」을 추구하기로 했고, 각종 외부 요인으로 인해 「심판」만을 좇는 안타까운 결과를 낳았지만, 이유가 있어서 그런 거니 비난해선 안 되겠지요',
                    reading:
                        'Ibi daltorok yaegihan hwajegunyo. Jeoreul in\'ganui beomjueseo je\'oeharyeoneun geon animnidaman, saenggakhae bosipsio. "Jeong\'ui", "Gongjeong", "Pyeongdeung", "Beomnyul", i gaenyeomdeureun seoro dongdeunghal su eopseumnida. Mureun "Gongpyeong"-hadaneun bonseong\'eul jinyeotgo, jeondae murui sin egerianeun modeun saengmyeong\'eul sarang\'euro yeon\'gyeol jieo pyeongdeung\'eul iruryeogo haetjyo. Geurigo jigeumui sineun pyeongdeunghan "Beomnyul"-eul chuguhagiro haetgo, gakjong oebu yoineuro inhae "Simpan"-maneul jonneun antakkaun gyeolgwareul naatjiman, iyuga isseoseo geureon geoni binanhaeseon an doegetjiyo',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트 자신에 대해·심판의 의미.mp3',
                },
                {
                    title: '우리에 대해·증인',
                    text: '당신이 세상 밖에서 왔다면, 제가 이 뒤집힌 세상에 내리는 심판을 지켜봐 주십시오. 「본디 위대하신 아버지께서 다스려야 할 나라였거늘, 지금은 추악한 깃털이 다스리고 있습니다. 뒤집히고 어긋난 이 세상을 바로잡기 위해 제가 이 땅에 왔습니다」',
                    reading:
                        "Dangsini sesang bakkeseo watdamyeon, jega i dwijiphin sesang'e naerineun simpaneul jikyeobwa jusipsio. \"Bondi widaehasin abeojikkeseo daseuryeoya hal narayeotgeoneul, jigeumeun chuakhan git'teori daseurigo itseumnida. Dwijiphigo eogeunnan i sesang'eul barojapgi wihae jega i ttang'e watseumnida\"",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/우리에 대해·증인.mp3',
                },
                {
                    title: '우리에 대해·인간 세상',
                    text: '폰타인 사람들과 오랫동안 지내고 당신과 동행하다 보니 생각이 바뀌었습니다. 인간의 죄는 이미 사면했으니, 앞으로의 심판은 평범한 인간에게 해를 가하지 않을 것을 약속하지요. 다만 저와 참주 사이에는 아직 청산하지 못한 원한과 해야 할 복수가 남아 있습니다',
                    reading:
                        "Pontain saramdeulgwa oraetdong'an jinaego dangsin'gwa donghaenghada boni saenggagi bakkwieotseumnida. In'ganui joeneun imi samyeonhaesseuni, apeuroui simpaneun pyeongbeomhan in'ganege haereul gahaji aneul geoseul yaksokhajiyo. Daman jeowa chamju saieneun ajik cheongsanhaji mothan wonhan'gwa haeya hal boksuga nama itseumnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/우리에 대해·인간 세상.mp3',
                },
                {
                    title: '「신의 눈」에 대해·첫 번째',
                    text: '위기의 순간에 더 쉽게 나설 수 있게 가짜 유리구슬을 차고 다니라고 저에게 조언한 사람이 있었습니다. 자신의 힘을 사용하는데 가면을 쓰고 위장해야 한다니, 솔직히 불쾌했습니다. 하지만 신의 눈을 가진 사람들과 지내다 보니, 그들의 갈망과 의지 역시 아주 귀하다는 걸 깨달았죠',
                    reading:
                        "Wigiui sun'gane deo swipge naseol su itge gajja yuriguseureul chago danirago jeo'ege jo'eonhan sarami isseotseumnida. Jasinui himeul sayonghaneunde gamyeoneul sseugo wijanghaeya handani, soljikhi bulkwaehaetseumnida. Hajiman sinui nuneul gajin saramdeulgwa jinaeda boni, geudeurui galmanggwa uiji yeoksi aju gwihadaneun geol kkaedaratjyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/「신의 눈」에 대해·첫 번째.mp3',
                },
                {
                    title: '「신의 눈」에 대해·두 번째',
                    text: '네? 가장 오래된 일곱 신 중에서도 가짜 유리구슬을 차고 인간 세상을 돌아다니는 자들이 있단 말입니까? 푸흡, 하하하… 실례합니다. 좀 웃겨서 그만',
                    reading:
                        "Ne? Gajang oraedoen ilgop sin jung'eseodo gajja yuriguseureul chago in'gan sesang'eul doradanineun jadeuri itdan marimnikka? Puheup, hahaha... Sillyehamnida. Jom utgyeoseo geuman",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/「신의 눈」에 대해·두 번째.mp3',
                },
                {
                    title: '하고 싶은 이야기·법률',
                    text: '폰타인에는 신기한 법률이 많습니다. 예를 들어 「매월 초삼일은 비행 물체를 날릴 수 없고」, 「갈수기에 떠밀려 온 이매패류는 모두 물의 신의 것이며, 소라 껍데기는 백성들의 것」이라든가, 「집에서 키우는 동물에게 『푸리나』라는 이름을 붙이는 것을 금지」한다든가요. 또 「구내식당과 레스토랑에서 케첩만 먹을 수 없고」, 「멜뤼진은 인격을 나타내는 인칭 대명사로 불러야 한다」라든가 말이죠…. 마지막 조항의 입법은 제가 추진했습니다',
                    reading:
                        'Pontaineneun sin\'gihan beomnyuri manseumnida. Yereul deureo "Maewol chosamireun bihaeng mulchereul nallil su eopgo", "Galsugie tteomillyeo on imaepaeryuneun modu murui sinui geosimyeo, sora kkeopdegineun baekseongdeurui geot"-iradeun\'ga, "Jibeseo kiuneun dongmurege "Purina"-raneun ireumeul buchineun geoseul geumji"-handadeun\'gayo. Tto "Gunaesikdanggwa reseutorang\'eseo kecheomman meogeul su eopgo", "Mellwijineun in\'gyeogeul natanaeneun inching daemyeongsaro bulleoya handa"-radeun\'ga marijyo.... Majimak johang\'ui ipbeobeun jega chujinhaetseumnida',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/하고 싶은 이야기·법률.mp3',
                },
                {
                    title: '하고 싶은 이야기·비가 내리는 날',
                    text: '전 종종 비를 맞는 상상을 합니다. 아, 오해 마십시오. 스트레스가 심해서 그런 건 아닙니다',
                    reading: "Jeon jongjong bireul manneun sangsang'eul hamnida. A, ohae masipsio. Seuteureseuga simhaeseo geureon geon animnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/하고 싶은 이야기·비가 내리는 날.mp3',
                },
                {
                    title: '흥미있는 일·용 도마뱀',
                    text: '그들 역시 같은 원류바다 출신 혈통이라 진화에 매우 능숙합니다. 그러고 보니 과거에 있던 용의 풍습 하나가 떠오르는군요. 「우리가 요절한 동족의 피를 마시고 달과 별의 운동이 조석 현상에 영향을 줄 때, 우리 수생족 체내의 물 역시 위로 떠오를 것이며, 죽은 동족의 부활을 알 수 있을 것이다」',
                    reading:
                        "Geudeul yeoksi gateun wollyubada chulsin hyeoltong'ira jinhwa'e mae'u neungsukhamnida. Geureogo boni gwageo'e itdeon yong'ui pungseup hanaga tteooreuneun'gunyo. \"Uriga yojeolhan dongjogui pireul masigo dalgwa byeorui undong'i joseok hyeonsang'e yeonghyang'eul jul ttae, uri susaengjok chenae'ui mul yeoksi wiro tteooreul geosimyeo, jugeun dongjogui buhwareul al su isseul geosida\"",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/흥미있는 일·용 도마뱀.mp3',
                },
                {
                    title: '흥미있는 일·인간',
                    text: '제가 관찰한 결과, 인간은 늘 자연과 대립하더군요. 이렇게 말하면 인간도 자연의 일부라고 주장하는 사람이 있을 겁니다. 하지만 일부 진실을 아는 제가 보기에 인류 문명 세계와 이 별의 자연은 서로 공존하는 법을 찾아야 할 겁니다',
                    reading:
                        "Jega gwanchalhan gyeolgwa, in'ganeun neul jayeon'gwa daeriphadeogunyo. Ireoke malhamyeon in'gando jayeonui ilburago jujanghaneun sarami isseul geomnida. Hajiman ilbu jinsireul aneun jega bogie illyu munmyeong segyewa i byeorui jayeoneun seoro gongjonhaneun beobeul chajaya hal geomnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/흥미있는 일·인간.mp3',
                },
                {
                    title: '바위의 신에 대해…',
                    text: '제가 신들을 판결할 거라는 사실은 절대 바뀌지 않을 겁니다. 황금의 신은 바위의 권능을 쟁취했으니 당연히 심판을 받아야 하지요. 저와 그 신이 싸울까 봐 걱정할 필요는 없습니다. 전 폰타인에 아주 오래 머물러야 하니까요. 400년이 넘도록 있어야 할지도 모르죠. 게다가 판결이 꼭 싸움으로 이어질 거라는 보장도 없습니다',
                    reading:
                        "Jega sindeureul pan'gyeolhal georaneun sasireun jeoldae bakkwiji aneul geomnida. Hwanggeumui sineun bawiui gwonneung'eul jaengchwihaesseuni dang'yeonhi simpaneul badaya hajiyo. Jeowa geu sini ssaulkka bwa geokjeonghal piryoneun eopseumnida. Jeon pontaine aju orae meomulleoya hanikkayo. 400-Nyeoni neomdorok isseoya haljido moreujyo. Gedaga pan'gyeori kkok ssaumeuro ieojil georaneun bojangdo eopseumnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/바위의 신에 대해….mp3',
                },
                {
                    title: '바람의 신에 대해…',
                    text: '천지가 뒤집혀도 찬탈자인 일곱 신을 향한 저의 심판은 계속될 겁니다. 미풍과 희망의 신은 바람의 권능을 받았으니, 똑같이 심판을 기다려야 하지요. 평소엔 그저 취객일 뿐이라 위험하지 않다고요? 그래도 일단 만나봐야겠습니다',
                    reading:
                        "Cheonjiga dwijiphyeodo chantaljain ilgop sineul hyanghan jeoui simpaneun gyesokdoel geomnida. Mipunggwa huimang'ui sineun baramui gwonneung'eul badasseuni, ttokgachi simpaneul gidaryeoya hajiyo. Pyeongso'en geujeo chwigaegil ppunira wiheomhaji antagoyo? Geuraedo ildan mannabwayagetseumnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/바람의 신에 대해….mp3',
                },
                {
                    title: '번개의 신에 대해…',
                    text: '완전한 용의 자격을 다시 얻은 잔존자로서, 바다의 모든 물을 하늘로 돌려보내는 한이 있어도 전 저의 맹세와 책임을 이행할 겁니다. 나루카미는 번개의 권능을 쟁취했으니 찬탈자 명단에 오르는 건 당연한 일입니다. 음, 지금은 마음의 정토에 틀어박혀서 거의 나오지 않는다고요? 그럼 몇백 년 뒤에 찾아가도록 하죠',
                    reading:
                        "Wanjeonhan yong'ui jagyeogeul dasi eodeun janjonjaroseo, badaui modeun mureul haneullo dollyeobonaeneun hani isseodo jeon jeoui maengsewa chaegimeul ihaenghal geomnida. Narukamineun beon'gae'ui gwonneung'eul jaengchwihaesseuni chantalja myeongdane oreuneun geon dang'yeonhan irimnida. Eum, jigeumeun ma'eumui jeongto'e teureobakhyeoseo geoui naoji anneundagoyo? Geureom myeotbaek nyeon dwie chajagadorok hajyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/번개의 신에 대해….mp3',
                },
                {
                    title: '풀의 신에 대해…',
                    text: '언젠가 초목의 신을 심판하게 되더라도 그 책임감만큼은 인정합니다. 세상에 완벽한 건 없다지만, 그녀가 보인 헌신과 애정은 책임자로서의 끊임없는 발전을 증명했으니까요. 약 500년 동안 냉대를 받았다고 들었는데, 그 신이 겪은 일에 대해선 매우 유감입니다',
                    reading:
                        "Eonjen'ga chomogui sineul simpanhage doedeorado geu chaegimgammankeumeun injeonghamnida. Sesang'e wanbyeokhan geon eopdajiman, geunyeoga boin heonsin'gwa aejeong'eun chaegimjaroseoui kkeunimeomneun baljeoneul jeungmyeonghaesseunikkayo. Yak 500-Nyeon dong'an naengdaereul badatdago deureonneunde, geu sini gyeokkeun ire daehaeseon mae'u yugamimnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/풀의 신에 대해….mp3',
                },
                {
                    title: '라이오슬리에 대해…',
                    text: '라이오슬리 씨는 확실히 믿을 만한 사람입니다. 그의 칭호와 명예 모두 제가 얻게 해줬죠. 제가 그의 언변과 아첨에 속아 넘어갔다고 생각하십니까? 이나즈마에는 「말을 아끼는 게 꽃」이라는 말이 있죠',
                    reading:
                        "Raioseulli ssineun hwaksilhi mideul manhan saramimnida. Geuui chinghowa myeong'ye modu jega eotge haejwotjyo. Jega geuui eonbyeon'gwa acheome soga neomeogatdago saenggakhasimnikka? Inajeuma'eneun \"Mareul akkineun ge kkot\"-iraneun mari itjyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/라이오슬리에 대해….mp3',
                },
                {
                    title: '클로린드에 대해…',
                    text: '클로린드 씨는 뛰어난 실력으로 현임 결투 대리인 중에서도 최강자가 되었습니다. 그림자 사냥꾼 업계의 후계자인 클로린드 씨가 있다면 심판청의 공정함이 더욱 잘 보장되겠죠. 그리고 보기보다 인간적이랍니다',
                    reading:
                        "Keullorindeu ssineun ttwieonan sillyeogeuro hyeonim gyeoltu daeriin jung'eseodo choegangjaga doeeotseumnida. Geurimja sanyangkkun eopgyeui hugyejain keullorindeu ssiga itdamyeon simpancheong'ui gongjeonghami deouk jal bojangdoegetjyo. Geurigo bogiboda in'ganjeogiramnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/클로린드에 대해….mp3',
                },
                {
                    title: '리니와 리넷에 대해…',
                    text: '공연이 아주 흥미롭더군요. 그게 바로 리니 씨와 리넷 씨의 마술 세계 아닐까요? 모든 게 가짜인 것 같지만, 믿기만 한다면 전부 진짜가 되는 거죠',
                    reading:
                        "Gong'yeoni aju heungmiropdeogunyo. Geuge baro rini ssiwa rinet ssiui masul segye anilkkayo? Modeun ge gajjain geot gatjiman, mitgiman handamyeon jeonbu jinjjaga doeneun geojyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/리니와 리넷에 대해….mp3',
                },
                {
                    title: '시그윈에 대해…',
                    text: '시그윈은 잘 지내고 있는지 모르겠군요. 만약 괴롭힘을 당했다면, 라이오슬리 씨를 폰타인성으로 불러와서 심문할 겁니다. 그야 시그윈은 아주 연약하고 상냥하니까요. 저번엔 사진기 필름을 갖고 돌아와서 나타의 물에 대한 저의 평가를 듣고 싶다고 했는데… 시그윈의 다음 휴가는 대체 언제죠?',
                    reading:
                        "Sigeuwineun jal jinaego inneunji moreugetgunyo. Manyak goerophimeul danghaetdamyeon, raioseulli ssireul pontainseong'euro bulleowaseo simmunhal geomnida. Geuya sigeuwineun aju yeonyakhago sangnyanghanikkayo. Jeobeonen sajin'gi pilleumeul gatgo dorawaseo nataui mure daehan jeoui pyeonggareul deutgo sipdago haenneunde... Sigeuwinui da'eum hyuganeun daeche eonjejyo?",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/시그윈에 대해….mp3',
                },
                {
                    title: '푸리나에 대해…',
                    text: '그녀의 「공연」이 마침내 막을 내렸군요. 「연기」는 상상의 산물이지만, 푸리나는 이를 통해 자신의 직책을 완수했죠…. 겁 많고 나약한 인간이 광기에 의존해 용감해지다니, 지금까지 정말 고생했다고 말하고 싶군요.기회가 되면 그녀의 무대를 위해 박수를 치고 싶습니다…. 예, 기회가 닿는다면요',
                    reading:
                        'Geunyeoui "Gong\'yeon"-i machimnae mageul naeryeotgunyo. "Yeon\'gi"-neun sangsang\'ui sanmurijiman, purinaneun ireul tonghae jasinui jikchaegeul wansuhaetjyo.... Geop manko nayakhan in\'gani gwanggie uijonhae yonggamhaejidani, jigeumkkaji jeongmal gosaenghaetdago malhago sipgunyo.Gihoega doemyeon geunyeoui mudaereul wihae baksureul chigo sipseumnida.... Ye, gihoega danneundamyeonyo',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/푸리나에 대해….mp3',
                },
                {
                    title: '나비아에 대해…',
                    text: '이런 말 하면 죄송하지만, 그때 본의 아니게 나비아 씨를 화나게 한 일도, 그분의 사과를 받은 일도, 그리고 지금 제가 느끼는 죄책감도 전부 멀게만 느껴집니다. 마치 호수에 가라앉아서 별을 보는 것처럼요. 고의로 그런 건 아니었습니다. 더 이상 만회할 기회도 없겠죠. 감정은 물처럼 스스로 빠르게 회복하고 잠잠해지지 않는 법이니까요',
                    reading:
                        "Ireon mal hamyeon joesonghajiman, geuttae bonui anige nabia ssireul hwanage han ildo, geubunui sagwareul badeun ildo, geurigo jigeum jega neukkineun joechaekgamdo jeonbu meolgeman neukkyeojimnida. Machi hosue garaanjaseo byeoreul boneun geotcheoreomyo. Gouiro geureon geon anieotseumnida. Deo isang manhoehal gihoedo eopgetjyo. Gamjeong'eun mulcheoreom seuseuro ppareuge hoebokhago jamjamhaejiji anneun beobinikkayo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/나비아에 대해….mp3',
                },
                {
                    title: '불의 신에 대해…',
                    text: '규칙과 전승으로 심연을 물리친 것은 칭송할 만한 행위입니다. 그러나 그 힘은 용에게서 빼앗은 것이므로 씻을 수 없는 죄가 있는 것도 사실이죠. 다만 나타는 큰 피해를 입었으니 조급히 행동할 필요는 없을 듯합니다. 음, 사료에 따르면 그 전투는 정식적인 결투였으며, 스발란케 역시 피해자의 가족을 선대했다는 겁니까? 허무맹랑한 말입니다만, 일리가 없는 건 아니군요…',
                    reading:
                        "Gyuchikgwa jeonseung'euro simyeoneul mullichin geoseun chingsonghal manhan haeng'wiimnida. Geureona geu himeun yong'egeseo ppaeaseun geosimeuro ssiseul su eomneun joega inneun geotdo sasirijyo. Daman nataneun keun pihaereul ibeosseuni jogeuphi haengdonghal piryoneun eopseul deuthamnida. Eum, saryoe ttareumyeon geu jeontuneun jeongsikjeogin gyeoltuyeosseumyeo, seuballanke yeoksi pihaejaui gajogeul seondaehaetdaneun geomnikka? Heomumaengnanghan marimnidaman, illiga eomneun geon anigunyo...",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/불의 신에 대해….mp3',
                },
                {
                    title: '느비예트에 대해 알기·첫 번째',
                    text: '다른 사람과의 사적인 관계나 절차 밖의 협력은 최대한 피하고 있습니다. 하지만 당신은 품행이 믿을 만하고, 폰타인의 세력과 얽힌 것도 없으니 기꺼이 동행하도록 하죠',
                    reading:
                        "Dareun saramgwaui sajeogin gwan'gyena jeolcha bakkui hyeomnyeogeun choedaehan pihago itseumnida. Hajiman dangsineun pumhaeng'i mideul manhago, pontainui seryeokgwa eolkin geotdo eopseuni gikkeoi donghaenghadorok hajyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트에 대해 알기·첫 번째.mp3',
                },
                {
                    title: '느비예트에 대해 알기·두 번째',
                    text: '이런 말은 사석에서만 가능하지, 공개된 장소에서는 절대 할 수 없습니다. 개인적으로 폰타의 유행이 뜬금없다고 생각하지만, 사람들이 왜 좋아하는지 이해는 합니다. 수분을 섭취하며 당분도 보충할 수 있고 가격도 저렴하니까요',
                    reading:
                        "Ireon mareun saseogeseoman ganeunghaji, gonggaedoen jangso'eseoneun jeoldae hal su eopseumnida. Gaeinjeogeuro pontaui yuhaeng'i tteun'geumeopdago saenggakhajiman, saramdeuri wae joahaneunji ihaeneun hamnida. Subuneul seopchwihamyeo dangbundo bochunghal su itgo gagyeokdo jeoryeomhanikkayo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트에 대해 알기·두 번째.mp3',
                },
                {
                    title: '느비예트에 대해 알기·세 번째',
                    text: '최근에 한 연극을 봤습니다. 죽은 부인이 자신의 매력과 악의적인 계략을 통해 마치 사라지지 않는 유령처럼 그녀가 살던 저택에 남아 맴도는 이야기였죠. 연기는 흠 잡을 데가 없었고 스토리도 훌륭했습니다. 보고 나니 현실 세계의 상황이 떠오르더군요',
                    reading:
                        "Choegeune han yeon'geugeul bwatseumnida. Jugeun bu'ini jasinui maeryeokgwa aguijeogin gyeryageul tonghae machi sarajiji anneun yuryeongcheoreom geunyeoga saldeon jeotaege nama maemdoneun iyagiyeotjyo. Yeon'gineun heum jabeul dega eopseotgo seutorido hullyunghaetseumnida. Bogo nani hyeonsil segyeui sanghwang'i tteooreudeogunyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트에 대해 알기·세 번째.mp3',
                },
                {
                    title: '느비예트에 대해 알기·네 번째',
                    text: '이런저런 이유로 전 폰타인을 떠난 적이 많지 않습니다. 그래서 제가 맛본 세계 각지의 물은 현지에서 마신 게 아니라 전부 외지에서 공수해 온 거죠. 그래도 다양한 식수의 미세한 맛 차이쯤은 구분할 수 있습니다. 이렇게까지 말했는데도 못 믿으시겠습니까? 전 최고 심판관이니 거짓말은 안 합니다',
                    reading:
                        "Ireonjeoreon iyuro jeon pontaineul tteonan jeogi manchi anseumnida. Geuraeseo jega matbon segye gakjiui mureun hyeonjieseo masin ge anira jeonbu oejieseo gongsuhae on geojyo. Geuraedo dayanghan siksuui misehan mat chaijjeumeun gubunhal su itseumnida. Ireokekkaji malhaenneundedo mot mideusigetseumnikka? Jeon choego simpan'gwanini geojinmareun an hamnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트에 대해 알기·네 번째.mp3',
                },
                {
                    title: '느비예트에 대해 알기·다섯 번째',
                    text: '솔직히 골치 아픈 일이 종종 있긴 합니다. 앉을 때 옷자락을 밟거나, 가끔 머리카락이 눌리거나, 머리를 뒤로 기대면 의자 장식에 걸리기도 합니다. 최고 심판관의 위엄을 유지하기 위한 옷차림이니 불편은 당연히 감수해야겠죠. 세상일이 거의 다 그렇습니다. 신분을 받아들이고, 인내하고 이해하며 공존해야 하지요. 제가 늘 하는 일입니다',
                    reading:
                        "Soljikhi golchi apeun iri jongjong itgin hamnida. Anjeul ttae otjarageul bapgeona, gakkeum meorikaragi nulligeona, meorireul dwiro gidaemyeon uija jangsige geolligido hamnida. Choego simpan'gwanui wieomeul yujihagi wihan otcharimini bulpyeoneun dang'yeonhi gamsuhaeyagetjyo. Sesang'iri geoui da geureoseumnida. Sinbuneul badadeurigo, innaehago ihaehamyeo gongjonhaeya hajiyo. Jega neul haneun irimnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트에 대해 알기·다섯 번째.mp3',
                },
                {
                    title: '느비예트의 취미…',
                    text: '물을 음미하는 것도 일종의 학문입니다. 불 원소로 가열한 물은 가장 기본적인 자연의 맛이고, 숯불로 끓인 물은 전원의 맛이 납니다. 마찬가지로 얼음 원소로 처리한 물은 특별할 것 없이 시원하기만 하지만, 스네즈나야의 얼음이 녹은 물은 완전히 다르지요',
                    reading:
                        "Mureul eummihaneun geotdo iljong'ui hangmunimnida. Bul wonsoro gayeolhan mureun gajang gibonjeogin jayeonui masigo, sutbullo kkeurin mureun jeonwonui masi namnida. Machan'gajiro eoreum wonsoro cheorihan mureun teukbyeolhal geot eopsi siwonhagiman hajiman, seunejeunayaui eoreumi nogeun mureun wanjeonhi dareujiyo",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트의 취미….mp3',
                },
                {
                    title: '느비예트의 고민…',
                    text: '비 오는 날에 우산을 안 쓰면 이상해 보일까요…?',
                    reading: 'Bi oneun nare usaneul an sseumyeon isanghae boilkkayo...?',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/느비예트의 고민….mp3',
                },
                {
                    title: '좋아하는 음식…',
                    text: '동물이 음식을 먹지 않으면 며칠은 살 수 있지만, 물이 없으면 얼마 못 버팁니다. 아무리 맛있는 음식도 깨끗한 물보다 못하지요. 그래서 국물이 많은 음식이 두 번째로 좋습니다',
                    reading:
                        'Dongmuri eumsigeul meokji aneumyeon myeochireun sal su itjiman, muri eopseumyeon eolma mot beotimnida. Amuri masinneun eumsikdo kkaekkeuthan mulboda mothajiyo. Geuraeseo gungmuri maneun eumsigi du beonjjaero joseumnida',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/좋아하는 음식….mp3',
                },
                {
                    title: '싫어하는 음식…',
                    text: '튀김이나 소스 없이 구운 음식을 정말 먹을 수 있는 겁니까? 특히 수메르의 대추야자 숯탄 전병에 대해선 꼭 한마디 해야겠군요. 그건 위장에 방습제를 집어넣는 것과 다름없습니다',
                    reading:
                        "Twigimina soseu eopsi guun eumsigeul jeongmal meogeul su inneun geomnikka? Teukhi sumereuui daechuyaja sut'tan jeonbyeong'e daehaeseon kkok hanmadi haeyagetgunyo. Geugeon wijang'e bangseupjereul jibeoneonneun geotgwa dareumeopseumnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/싫어하는 음식….mp3',
                },
                {
                    title: '선물 획득·첫 번째',
                    text: '맛이 좋군요. 음식에서 가장 중요한 수분도 가득하고, 재료 손질도 잘하셨습니다',
                    reading: "Masi jokunyo. Eumsigeseo gajang jung'yohan subundo gadeukhago, jaeryo sonjildo jalhasyeotseumnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/선물 획득·첫 번째.mp3',
                },
                {
                    title: '선물 획득·두 번째',
                    text: '나쁘지 않은 시도입니다. 다만 국물을 좀 더 추가하고 기름을 걷으면 더 좋을 것 같군요',
                    reading: 'Nappeuji aneun sidoimnida. Daman gungmureul jom deo chugahago gireumeul geodeumyeon deo joeul geot gatgunyo',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/선물 획득·두 번째.mp3',
                },
                {
                    title: '선물 획득·세 번째',
                    text: '너무 뻑뻑하군요. 촉촉하지 않은 요리에서는 요리사의 마음이 느껴지지 않는 법입니다',
                    reading: "Neomu ppeokppeokhagunyo. Chokchokhaji aneun yorieseoneun yorisaui ma'eumi neukkyeojiji anneun beobimnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/선물 획득·세 번째.mp3',
                },
                {
                    title: '생일…',
                    text: '오늘이 생일이군요. 축하합니다. 비가 올지 안 올지 모르겠지만, 제가 어떻게든 해결하겠습니다',
                    reading: "Oneuri saeng'irigunyo. Chukhahamnida. Biga olji an olji moreugetjiman, jega eotteokedeun haegyeolhagetseumnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/생일….mp3',
                },
                {
                    title: '돌파의 느낌·기',
                    text: '이제 조금 익숙해졌군요. 당신의 움직임에 맞추겠습니다',
                    reading: 'Ije jogeum iksukhaejyeotgunyo. Dangsinui umjigime matchugetseumnida',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/돌파의 느낌·기.mp3',
                },
                {
                    title: '돌파의 느낌·승',
                    text: '저의 진짜 실력을 좀 발휘해야겠군요. 당신이 이렇게 쉽게 위험에 빠질 줄은 몰랐습니다',
                    reading: 'Jeoui jinjja sillyeogeul jom balhwihaeyagetgunyo. Dangsini ireoke swipge wiheome ppajil jureun mollatseumnida',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/돌파의 느낌·승.mp3',
                },
                {
                    title: '돌파의 느낌·전',
                    text: '이 정도 실력을 갖추고 계셨던 겁니까? 진지하게 임하지 않으면 당신을 따라잡을 수 없겠군요',
                    reading: 'I jeongdo sillyeogeul gatchugo gyesyeotdeon geomnikka? Jinjihage imhaji aneumyeon dangsineul ttarajabeul su eopgetgunyo',
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/돌파의 느낌·전.mp3',
                },
                {
                    title: '돌파의 느낌·결',
                    text: '찬탈자로부터 일곱 권능의 일부를 회수했습니다. 이게 제 본래 모습이죠. 「완전한 용」이 됐으니 이제 남은 신들도 심판할 수 있겠군요. 높은 하늘 위에 있는 찬탈자들의 왕을 심판하는 게 저의 운명이지만, 그전까지 힘을 빌려드리겠습니다',
                    reading:
                        "Chantaljarobuteo ilgop gwonneung'ui ilbureul hoesuhaetseumnida. Ige je bollae moseubijyo. \"Wanjeonhan yong\"-i dwaesseuni ije nameun sindeuldo simpanhal su itgetgunyo. Nopeun haneul wie inneun chantaljadeurui wang'eul simpanhaneun ge jeoui unmyeong'ijiman, geujeonkkaji himeul billyeodeurigetseumnida",
                    audio: 'assets/character/voice_overs/Neuvillette/story/ko/돌파의 느낌·결.mp3',
                },
            ],
        },
        combat: {
            en: [
                {
                    title: 'Elemental Skill',
                    text: 'Silence!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Elemental Skill 01.mp3',
                },
                {
                    title: 'Elemental Skill',
                    text: 'Bow your head.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Elemental Skill 02.mp3',
                },
                {
                    title: 'Elemental Skill',
                    text: 'Settle down.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Elemental Skill 03.mp3',
                },
                {
                    title: 'Elemental Burst',
                    text: 'The tides beckon.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Elemental Burst 01.mp3',
                },
                {
                    title: 'Elemental Burst',
                    text: 'Be sanctified.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Elemental Burst 02.mp3',
                },
                {
                    title: 'Elemental Burst',
                    text: 'Let the mighty be humbled.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Elemental Burst 03.mp3',
                },
                {
                    title: 'Opening Treasure Chest',
                    text: "Abandoned property belongs to whoever finds it first. So it's legally yours now.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Opening Treasure Chest 01.mp3',
                },
                {
                    title: 'Opening Treasure Chest',
                    text: 'Is it what you wished to find? Hopefully, the excitement of opening a treasure chest has at least made it a worthwhile experience.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Opening Treasure Chest 02.mp3',
                },
                {
                    title: 'Opening Treasure Chest',
                    text: 'Let the record show that I verbally consent to relinquishing these items into your possession.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Opening Treasure Chest 03.mp3',
                },
                {
                    title: 'Low HP',
                    text: 'Be not perturbed. I am unscathed.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Low HP 01.mp3',
                },
                {
                    title: 'Low HP',
                    text: 'The risk is growing, but it poses no threat to me.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Low HP 02.mp3',
                },
                {
                    title: 'Low HP',
                    text: "Hmph... There's a tear in my robe.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Low HP 03.mp3',
                },
                {
                    title: 'Ally at Low HP',
                    text: 'Allow me to intervene.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Ally at Low HP 01.mp3',
                },
                {
                    title: 'Ally at Low HP',
                    text: 'Take a moment to rest.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Ally at Low HP 02.mp3',
                },
                {
                    title: 'Fallen',
                    text: 'When the tide comes in, I shall return...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Fallen 01.mp3',
                },
                {
                    title: 'Fallen',
                    text: 'I see the temperate waters of eons past...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Fallen 02.mp3',
                },
                {
                    title: 'Fallen',
                    text: 'A silence fills the air...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Fallen 03.mp3',
                },
                {
                    title: 'Heavy Hit Taken',
                    text: 'Justice is blindsided...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Heavy Hit Taken 01.mp3',
                },
                {
                    title: 'Heavy Hit Taken',
                    text: 'An oversight on my part.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Heavy Hit Taken 02.mp3',
                },
                {
                    title: 'Joining Party',
                    text: 'Thank you for permitting— No, inviting me to join you.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Joining Party 01.mp3',
                },
                {
                    title: 'Joining Party',
                    text: 'The pleasure is all mine.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Joining Party 02.mp3',
                },
                {
                    title: 'Joining Party',
                    text: 'Perhaps we could take a walk by a riverbank or somewhere similarly fluvial.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Neuvillette/combat/en/Joining Party 03.mp3',
                },
            ],
            zh: [
                {
                    title: '元素战技',
                    text: '肃静！',
                    reading: 'Sùjìng!',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/元素战技 01.mp3',
                },
                {
                    title: '元素战技',
                    text: '低头。',
                    reading: 'Dītóu.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/元素战技 02.mp3',
                },
                {
                    title: '元素战技',
                    text: '不得喧哗。',
                    reading: 'Bùdé xuānhuá.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/元素战技 03.mp3',
                },
                {
                    title: '元素爆发',
                    text: '潮水啊，我已归来。',
                    reading: 'Cháoshuǐ a! Wǒ yǐ guīlái.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/元素爆发 01.mp3',
                },
                {
                    title: '元素爆发',
                    text: '化作，浮沫吧。',
                    reading: 'Huà zuò, fúmò ba!',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/元素爆发 02.mp3',
                },
                {
                    title: '元素爆发',
                    text: '凡高大者，我无不蔑视。',
                    reading: 'Fán gāodà zhě, wǒ wúbù mièshì.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/元素爆发 03.mp3',
                },
                {
                    title: '打开宝箱',
                    text: '当你第一个找到无主的它时，它就属于你了。嗯，合法的。',
                    reading: 'Dāng nǐ dìyīgè zhǎodào wúzhǔ de tā shí, tā jiù shǔyú nǐle. Ń, héfǎ de.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/打开宝箱 01.mp3',
                },
                {
                    title: '打开宝箱',
                    text: '是不错的东西吗？至少打开它那一瞬的期待是不错的心绪吧。',
                    reading: 'Shì bùcuò de dōngxī ma? Zhìshǎo dǎkāi tā dì nà yīshùn qídài shì bùcuò de xīnxù ba?',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/打开宝箱 02.mp3',
                },
                {
                    title: '打开宝箱',
                    text: '我以口头约定的方式将这些让渡与你。',
                    reading: 'Wǒ yǐ kǒutóu yuēdìng de fāngshì jiāng zhèxiē ràng dù yǔ nǐ.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/打开宝箱 03.mp3',
                },
                {
                    title: '生命值低',
                    text: '并无妨害，不必担心。',
                    reading: 'Bìng wú fánghài, bùbì dānxīn.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/生命值低 01.mp3',
                },
                {
                    title: '生命值低',
                    text: '风险渐涨，不过我没什么问题。',
                    reading: 'Fēngxiǎn jiàn zēng, bùguò wǒ méishénme wèntí.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/生命值低 02.mp3',
                },
                {
                    title: '生命值低',
                    text: '哼，衣服似乎刮坏了。',
                    reading: 'Hēng, yīfú sìhū guā huàile.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/生命值低 03.mp3',
                },
                {
                    title: '同伴生命值低',
                    text: '让我来吧。',
                    reading: 'Ràng wǒ lái ba.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/同伴生命值低 01.mp3',
                },
                {
                    title: '同伴生命值低',
                    text: '你先休息一下。',
                    reading: 'Nǐ xiān xiūxí yīxià.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/同伴生命值低 02.mp3',
                },
                {
                    title: '倒下',
                    text: '潮汐再起时，我必将归来…',
                    reading: 'Cháoxī zàiqǐ shí, wǒ bì jiāng guīlái…',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/倒下 01.mp3',
                },
                {
                    title: '倒下',
                    text: '看到了…我诞生前的温暖之海…',
                    reading: 'Kàn dàole… wǒ dànshēng qián de wēnnuǎn zhī hǎi…',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/倒下 02.mp3',
                },
                {
                    title: '倒下',
                    text: '万籁…俱静…',
                    reading: 'Wànlài…jùjìng…',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/倒下 03.mp3',
                },
                {
                    title: '重受击',
                    text: '角度意外啊…',
                    reading: 'Jiǎodù yìwài a...',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/重受击 01.mp3',
                },
                {
                    title: '重受击',
                    text: '是我疏忽了。',
                    reading: 'Shì wǒ shūhūle.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/重受击 02.mp3',
                },
                {
                    title: '加入队伍',
                    text: '感谢你许可…嗯，邀请我同行。',
                    reading: 'Gǎnxiè nǐ xǔkě… ń, yāoqǐng wǒ tóngxíng.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/加入队伍 01.mp3',
                },
                {
                    title: '加入队伍',
                    text: '十分乐意。',
                    reading: 'Shífēn lèyì.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/加入队伍 02.mp3',
                },
                {
                    title: '加入队伍',
                    text: '一起走走吧，去水畔之类的地方。',
                    reading: 'Yīqǐ zǒu zǒu ba! Qù shuǐ pàn zhī lèi dì dìfāng.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/zh/加入队伍 03.mp3',
                },
            ],
            ja: [
                {
                    title: '元素スキル',
                    text: '静粛に！',
                    reading: 'Seishuku ni!',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/元素スキル 01.mp3',
                },
                {
                    title: '元素スキル',
                    text: '頭を垂れろ。',
                    reading: 'Koube wo tarero.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/元素スキル 02.mp3',
                },
                {
                    title: '元素スキル',
                    text: '騒ぐな。',
                    reading: 'Sawaguna.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/元素スキル 03.mp3',
                },
                {
                    title: '元素爆発',
                    text: '海よ、私は帰ってきた。',
                    reading: 'Umi yo, watashi wa kaette-kita.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/元素爆発 01.mp3',
                },
                {
                    title: '元素爆発',
                    text: '泡沫となるがいい。',
                    reading: 'Houmatsu to naru ga ii.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/元素爆発 02.mp3',
                },
                {
                    title: '元素爆発',
                    text: '高き者を、私は蔑む。',
                    reading: 'Takaki mono wo, watashi wa sagesumu.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/元素爆発 03.mp3',
                },
                {
                    title: '宝箱を開ける',
                    text: '主なきそれを初めて見つけたのが君であれば、それは君のものだ。うむ…法律上、問題はない。',
                    reading: 'Aruji naki sore wo hajimete mitsuketa no ga kimi de areba, sore wa kimi no mono da. Umu... Houritsu-jou, mondai wa nai.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/宝箱を開ける 01.mp3',
                },
                {
                    title: '宝箱を開ける',
                    text: '悪くない代物か？少なくとも、開けた瞬間の期待感は、心地良いものだったのだろう。',
                    reading: 'Warukunai shiromono ka? Sukunakutomo, aketa shunkan no kitaikan wa, kokochiyoi mono datta no darou.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/宝箱を開ける 02.mp3',
                },
                {
                    title: '宝箱を開ける',
                    text: '口約束ですまないが、これを君に譲渡しよう。',
                    reading: 'Kuchi-yakusoku de sumanai ga, kore wo kimi ni jouto shiyou.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/宝箱を開ける 03.mp3',
                },
                {
                    title: 'HP低下',
                    text: '差し支えない、心配無用だ。',
                    reading: 'Sashitsukaenai, shinpai-muyou da.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/HP低下 01.mp3',
                },
                {
                    title: 'HP低下',
                    text: 'リスクは上がっているが、支障ない。',
                    reading: 'Risuku wa agatteiru ga, shishou nai.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/HP低下 02.mp3',
                },
                {
                    title: 'HP低下',
                    text: 'ふんっ、服が傷んだか。',
                    reading: "Fun', fuku ga itanda ka.",
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/HP低下 03.mp3',
                },
                {
                    title: '仲間HP低下',
                    text: 'ここは私に。',
                    reading: 'Koko wa watashi ni.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/仲間HP低下 01.mp3',
                },
                {
                    title: '仲間HP低下',
                    text: '君は先に休むといい。',
                    reading: 'Kimi wa saki ni yasumu to ii.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/仲間HP低下 02.mp3',
                },
                {
                    title: '戦闘不能',
                    text: '潮が再び満ちる時、私は帰ってくる…',
                    reading: 'Shio ga futatabi michiru toki, watashi wa kaette-kuru...',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/戦闘不能 01.mp3',
                },
                {
                    title: '戦闘不能',
                    text: '見えた…私が誕生する前の、温かな海が…',
                    reading: 'Mieta... Watashi ga tanjou suru mae no, atataka-na umi ga...',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/戦闘不能 02.mp3',
                },
                {
                    title: '戦闘不能',
                    text: '全てが…静寂に…',
                    reading: 'Subete ga... seijaku ni...',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/戦闘不能 03.mp3',
                },
                {
                    title: '重ダメージを受ける',
                    text: 'そう来るか…',
                    reading: 'Sou kuru ka...',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/重ダメージを受ける 01.mp3',
                },
                {
                    title: '重ダメージを受ける',
                    text: '油断した。',
                    reading: 'Yudan shita.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/重ダメージを受ける 02.mp3',
                },
                {
                    title: 'チーム加入',
                    text: '同行の招待に…うむ、感謝しよう。',
                    reading: 'Doukou no shoutai ni... Umu, kansha shiyou.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/チーム加入 01.mp3',
                },
                {
                    title: 'チーム加入',
                    text: '喜んで。',
                    reading: 'Yorokonde.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/チーム加入 02.mp3',
                },
                {
                    title: 'チーム加入',
                    text: '共に少し、水辺を歩こう。',
                    reading: 'Tomo ni sukoshi, mizube wo arukou.',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ja/チーム加入 03.mp3',
                },
            ],
            ko: [
                {
                    title: '원소전투 스킬',
                    text: '정숙!',
                    reading: 'Jeongsuk!',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/원소전투 스킬 01.mp3',
                },
                {
                    title: '원소전투 스킬',
                    text: '고개를 숙여라',
                    reading: 'Gogaereul sugyeora',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/원소전투 스킬 02.mp3',
                },
                {
                    title: '원소전투 스킬',
                    text: '소란 금지',
                    reading: 'Soran geumji',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/원소전투 스킬 03.mp3',
                },
                {
                    title: '원소폭발',
                    text: '밀물이여, 내가 돌아왔다',
                    reading: 'Milmuriyeo, naega dorawatda',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/원소폭발 01.mp3',
                },
                {
                    title: '원소폭발',
                    text: '거품이 되어라',
                    reading: 'Geopumi doeeora',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/원소폭발 02.mp3',
                },
                {
                    title: '원소폭발',
                    text: '모든 높은 자를 내려볼지어다',
                    reading: 'Modeun nopeun jareul naeryeoboljieoda',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/원소폭발 03.mp3',
                },
                {
                    title: '보물 상자 열기',
                    text: '주인이 없는 물건은 먼저 찾은 사람이 임자죠. 예, 합법입니다',
                    reading: "Ju'ini eomneun mulgeoneun meonjeo chajeun sarami imjajyo. Ye, hapbeobimnida",
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/보물 상자 열기 01.mp3',
                },
                {
                    title: '보물 상자 열기',
                    text: '좋은 물건이 나왔습니까? 적어도 그것을 여는 순간엔 설렘이 가득하겠죠',
                    reading: "Joeun mulgeoni nawatseumnikka? Jeogeodo geugeoseul yeoneun sun'ganen seollemi gadeukhagetjyo",
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/보물 상자 열기 02.mp3',
                },
                {
                    title: '보물 상자 열기',
                    text: '구두 약속으로 이 물건들을 당신에게 양도하겠습니다',
                    reading: 'Gudu yaksogeuro i mulgeondeureul dangsinege yangdohagetseumnida',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/보물 상자 열기 03.mp3',
                },
                {
                    title: 'HP 부족',
                    text: '전 멀쩡하니 걱정 마십시오',
                    reading: 'Jeon meoljjeonghani geokjeong masipsio',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/HP 부족 01.mp3',
                },
                {
                    title: 'HP 부족',
                    text: '위험이 커지고 있지만 제겐 위협이 되지 않습니다',
                    reading: 'Wiheomi keojigo itjiman jegen wihyeobi doeji anseumnida',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/HP 부족 02.mp3',
                },
                {
                    title: 'HP 부족',
                    text: '흠, 옷에 흠집이 난 것 같군요',
                    reading: 'Heum, ose heumjibi nan geot gatgunyo',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/HP 부족 03.mp3',
                },
                {
                    title: '동료 HP 감소',
                    text: '저에게 맡기십시오',
                    reading: "Jeo'ege matgisipsio",
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/동료 HP 감소 01.mp3',
                },
                {
                    title: '동료 HP 감소',
                    text: '좀 쉬고 계십시오',
                    reading: 'Jom swigo gyesipsio',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/동료 HP 감소 02.mp3',
                },
                {
                    title: '전투 불능',
                    text: '파도가 다시 밀려올 때 반드시 돌아올 겁니다…',
                    reading: 'Padoga dasi millyeool ttae bandeusi doraol geomnida...',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/전투 불능 01.mp3',
                },
                {
                    title: '전투 불능',
                    text: '제가 태어나기 전의 따뜻한 바다를… 보았습니다…',
                    reading: 'Jega taeeonagi jeonui ttatteuthan badareul... Boatseumnida...',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/전투 불능 02.mp3',
                },
                {
                    title: '전투 불능',
                    text: '만물이… 고요하군요…',
                    reading: 'Manmuri... Goyohagunyo...',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/전투 불능 03.mp3',
                },
                {
                    title: '강공격 피격',
                    text: '뜻밖의 결과군요…',
                    reading: 'Tteutbakkui gyeolgwagunyo...',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/강공격 피격 01.mp3',
                },
                {
                    title: '강공격 피격',
                    text: '경솔했군요',
                    reading: 'Gyeongsolhaetgunyo',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/강공격 피격 02.mp3',
                },
                {
                    title: '파티 가입',
                    text: '동행을 허가… 음, 초대해 주셔서 감사합니다',
                    reading: "Donghaeng'eul heoga... Eum, chodaehae jusyeoseo gamsahamnida",
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/파티 가입 01.mp3',
                },
                {
                    title: '파티 가입',
                    text: '얼마든지요',
                    reading: 'Eolmadeunjiyo',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/파티 가입 02.mp3',
                },
                {
                    title: '파티 가입',
                    text: '같이 물가 같은 곳으로 가서 좀 걷죠',
                    reading: 'Gachi mulga gateun goseuro gaseo jom geotjyo',
                    audio: 'assets/character/voice_overs/Neuvillette/combat/ko/파티 가입 03.mp3',
                },
            ],
        },
    },
    demo_music: {
        name: 'Parousia Diluvi',
        url: 'assets/character/demo_music/Neuvillette.mp3',
    },
    build: {
        version: '5.2',
        type: 'On-field DPS',
        weapons: [
            {
                name: 'Tome of the Eternal Flow',
                icon: 'assets/weapons/Tome of the Eternal Flow.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'Sacrificial Jade',
                icon: 'assets/weapons/Sacrificial Jade.avif',
                quality: '4',
                how_to_obtain: 'Battle Pass (Gnostic Hymn)',
            },
            {
                name: 'Ash-Graven Drinking Horn',
                icon: 'assets/weapons/Ash-Graven Drinking Horn.avif',
                quality: '4',
                how_to_obtain: 'Traces of Artistry Event',
            },
            {
                name: 'Prototype Amber',
                icon: 'assets/weapons/Prototype Amber.avif',
                quality: '4',
                how_to_obtain: 'Forging',
            },
        ],
        artifacts: ['4pc Marechaussee Hunter', '4pc Heart of Depth'],
        talents: ['Normal Attack', 'Skill', 'Burst'],
        main_stats: ['HP%', 'Hydro DMG Bonus / HP%', 'CRIT Rate / CRIT DMG / HP%'],
        sub_stats: ['ER (until requirement)', 'CRIT Rate / CRIT DMG / HP%', 'Flat HP'],
        teams: [
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Xiangling',
                    icon: 'assets/character/icon/Xiangling.avif',
                    quality: '4',
                    element: {
                        name: 'Pyro',
                        icon: 'assets/elements/Pyro.avif',
                    },
                },
                {
                    name: 'Nahida',
                    icon: 'assets/character/icon/Nahida.avif',
                    quality: '5',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
                {
                    name: 'Furina',
                    icon: 'assets/character/icon/Furina.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Fischl',
                    icon: 'assets/character/icon/Fischl.avif',
                    quality: '4',
                    element: {
                        name: 'Electro',
                        icon: 'assets/elements/Electro.avif',
                    },
                },
                {
                    name: 'Beidou',
                    icon: 'assets/character/icon/Beidou.avif',
                    quality: '4',
                    element: {
                        name: 'Electro',
                        icon: 'assets/elements/Electro.avif',
                    },
                },
                {
                    name: 'Kaedehara Kazuha',
                    icon: 'assets/character/icon/Kaedehara Kazuha.avif',
                    quality: '5',
                    element: {
                        name: 'Anemo',
                        icon: 'assets/elements/Anemo.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Fischl',
                    icon: 'assets/character/icon/Fischl.avif',
                    quality: '4',
                    element: {
                        name: 'Electro',
                        icon: 'assets/elements/Electro.avif',
                    },
                },
                {
                    name: 'Yae Miko',
                    icon: 'assets/character/icon/Yae Miko.avif',
                    quality: '5',
                    element: {
                        name: 'Electro',
                        icon: 'assets/elements/Electro.avif',
                    },
                },
                {
                    name: 'Zhongli',
                    icon: 'assets/character/icon/Zhongli.avif',
                    quality: '5',
                    element: {
                        name: 'Geo',
                        icon: 'assets/elements/Geo.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Kaedehara Kazuha',
                    icon: 'assets/character/icon/Kaedehara Kazuha.avif',
                    quality: '5',
                    element: {
                        name: 'Anemo',
                        icon: 'assets/elements/Anemo.avif',
                    },
                },
                {
                    name: 'Yae Miko',
                    icon: 'assets/character/icon/Yae Miko.avif',
                    quality: '5',
                    element: {
                        name: 'Electro',
                        icon: 'assets/elements/Electro.avif',
                    },
                },
                {
                    name: 'Yelan',
                    icon: 'assets/character/icon/Yelan.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Raiden Shogun',
                    icon: 'assets/character/icon/Raiden Shogun.avif',
                    quality: '5',
                    element: {
                        name: 'Electro',
                        icon: 'assets/elements/Electro.avif',
                    },
                },
                {
                    name: 'Nahida',
                    icon: 'assets/character/icon/Nahida.avif',
                    quality: '5',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
                {
                    name: 'Fischl',
                    icon: 'assets/character/icon/Fischl.avif',
                    quality: '4',
                    element: {
                        name: 'Electro',
                        icon: 'assets/elements/Electro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Raiden Shogun',
                    icon: 'assets/character/icon/Raiden Shogun.avif',
                    quality: '5',
                    element: {
                        name: 'Electro',
                        icon: 'assets/elements/Electro.avif',
                    },
                },
                {
                    name: 'Nahida',
                    icon: 'assets/character/icon/Nahida.avif',
                    quality: '5',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
                {
                    name: 'Kirara',
                    icon: 'assets/character/icon/Kirara.avif',
                    quality: '4',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Kuki Shinobu',
                    icon: 'assets/character/icon/Kuki Shinobu.avif',
                    quality: '4',
                    element: {
                        name: 'Electro',
                        icon: 'assets/elements/Electro.avif',
                    },
                },
                {
                    name: 'Dendro Traveler',
                    icon: 'assets/character/icon/Traveler.avif',
                    quality: '5',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
                {
                    name: 'Collei',
                    icon: 'assets/character/icon/Collei.avif',
                    quality: '4',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Nilou',
                    icon: 'assets/character/icon/Nilou.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Nahida',
                    icon: 'assets/character/icon/Nahida.avif',
                    quality: '5',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
                {
                    name: 'Baizhu',
                    icon: 'assets/character/icon/Baizhu.avif',
                    quality: '5',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Nilou',
                    icon: 'assets/character/icon/Nilou.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Nahida',
                    icon: 'assets/character/icon/Nahida.avif',
                    quality: '5',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
                {
                    name: 'Kirara',
                    icon: 'assets/character/icon/Kirara.avif',
                    quality: '4',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Nilou',
                    icon: 'assets/character/icon/Nilou.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Dendro Traveler',
                    icon: 'assets/character/icon/Traveler.avif',
                    quality: '5',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
                {
                    name: 'Yaoyao',
                    icon: 'assets/character/icon/Yaoyao.avif',
                    quality: '4',
                    element: {
                        name: 'Dendro',
                        icon: 'assets/elements/Dendro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Neuvillette',
                    icon: 'assets/character/icon/Neuvillette.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Ganyu',
                    icon: 'assets/character/icon/Ganyu.avif',
                    quality: '5',
                    element: {
                        name: 'Cryo',
                        icon: 'assets/elements/Cryo.avif',
                    },
                },
                {
                    name: 'Shenhe',
                    icon: 'assets/character/icon/Shenhe.avif',
                    quality: '5',
                    element: {
                        name: 'Cryo',
                        icon: 'assets/elements/Cryo.avif',
                    },
                },
                {
                    name: 'Kaedehara Kazuha',
                    icon: 'assets/character/icon/Kaedehara Kazuha.avif',
                    quality: '5',
                    element: {
                        name: 'Anemo',
                        icon: 'assets/elements/Anemo.avif',
                    },
                },
            ],
        ],
    },
};
