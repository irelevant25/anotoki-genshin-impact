var NAVIA = {
    name: 'Navia',
    secondary_title: 'Helm of the Radiant Rose',
    card_icon: 'assets/character/card/Navia.avif',
    wish_icon: 'assets/character/wish/Navia.avif',
    ingame_icon: 'assets/character/ingame/Navia.avif',
    icon: 'assets/character/icon/Navia.avif',
    quality: '5',
    weapon: {
        name: 'Claymore',
        icon: 'assets/weapon_types/Claymore.avif',
    },
    element: {
        name: 'Geo',
        icon: 'assets/elements/Geo.avif',
    },
    model: 'Tall Female',
    arkhe: 'Ousia',
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
    birthday: 'August 16th',
    constellations: [
        {
            name: "A Lady's Rules for Keeping a Courteous Distance",
            level: 1,
            icon: "assets/character/constellations/A Lady's Rules for Keeping a Courteous Distance.avif",
            description:
                'Each stack of Crystal Shrapnel consumed when Navia uses Ceremonial Crystalshot will restore 3 Energy to her and decrease the CD of As the Sunlit Sky\'s Singing Salute by 1s. Up to 9 Energy can be gained this way, and the CD of "As the Sunlit Sky\'s Singing Salute" can be decreased by up to 3s.',
        },
        {
            name: "The President's Pursuit of Victory",
            level: 2,
            icon: "assets/character/constellations/The President's Pursuit of Victory.avif",
            description:
                "Each stack of Crystal Shrapnel consumed will increase the CRIT Rate of this Ceremonial Crystalshot instance by 12%. CRIT Rate can be increased by up to 36% in this way.In addition, when Ceremonial Crystalshot hits an opponent, one Cannon Fire Support shot from As the Sunlit Sky's Singing Salute will strike near the location of the hit. Up to one instance of Cannon Fire Support can be triggered each time Ceremonial Crystalshot is used, and DMG dealt by said Cannon Fire Support this way is considered Elemental Burst DMG.",
        },
        {
            name: "Businesswoman's Broad Vision",
            level: 3,
            icon: "assets/character/constellations/Businesswoman's Broad Vision.avif",
            description: 'Increases the Level of Ceremonial Crystalshot by 3.Maximum upgrade level is 15.',
        },
        {
            name: 'The Oathsworn Never Capitulate',
            level: 4,
            icon: 'assets/character/constellations/The Oathsworn Never Capitulate.avif',
            description: "When As the Sunlit Sky's Singing Salute hits an opponent, that opponent's Geo RES will be decreased by 20% for 8s.",
        },
        {
            name: "Negotiator's Resolute Negotiations",
            level: 5,
            icon: "assets/character/constellations/Negotiator's Resolute Negotiations.avif",
            description: "Increases the Level of As the Sunlit Sky's Singing Salute by 3.Maximum upgrade level is 15.",
        },
        {
            name: "The Flexible Finesse of the Spina's President",
            level: 6,
            icon: "assets/character/constellations/The Flexible Finesse of the Spina's President.avif",
            description:
                'If more than 3 stacks of Crystal Shrapnel are consumed when using Ceremonial Crystalshot, each stack consumed beyond the first 3 increases the CRIT DMG of that Ceremonial Crystalshot by 45%, and any stacks consumed beyond the first 3 are returned to Navia.',
        },
    ],
    region: {
        name: 'Fontaine',
        icon: 'assets/regions/Fontaine.avif',
    },
    affiliations: ['Spina di Rosula', 'House of Caspar'],
    special_dish: {
        name: '"Pick What You Like!"',
        icon: 'assets/foods/Pick What You Like!.avif',
    },
    namecard: {
        icon: 'assets/character/namecard_icon/Navia.avif',
        background: 'assets/character/namecard_background/Navia.avif',
        banner: 'assets/character/namecard_banner/Navia.avif',
        description: "Roses shall bloom, and thus does Ms. Navia's umbrella flower. Yet beware, for roses have thorns, and Navia's booming brolly packs a powerful punch.",
        quality: '4',
        sources: ['Reward for reaching Friendship Level 10 with Navia'],
    },
    how_to_obtain: 'Event Wish — In the Name of the Rosula',
    release_date: 'December 20, 2023',
    titles: ['President, Leader, Boss, Commander-in-Chief of the Spina di Rosula'],
    family: {
        father: 'Callas (deceased)',
        mother: 'Clementine (deceased)',
    },
    voice_actors: [
        {
            language: 'English',
            actor: 'Brenna Larsen',
        },
        {
            language: 'Chinese',
            actor: 'Xiaogan (小敢)',
        },
        {
            language: 'Japanese',
            actor: 'Toyosaki Aki (豊崎愛生)',
        },
        {
            language: 'Korean',
            actor: 'Jeong Hae-eun (정해은)',
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
                    hp: 984.78,
                    atk: 27.37,
                    def: 61.74,
                },
                {
                    level: '20/20',
                    hp: 2554.52,
                    atk: 71,
                    def: 160.17,
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
                    hp: 3398.88,
                    atk: 94.47,
                    def: 213.11,
                },
                {
                    level: '40/40',
                    hp: 5085.8,
                    atk: 141.36,
                    def: 318.88,
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
                    name: 'Prithiva Topaz Sliver',
                    value: 1,
                    icon: 'assets/materials/Prithiva Topaz Sliver.avif',
                    quality: '2',
                },
                {
                    name: 'Spring of the First Dewdrop',
                    value: 3,
                    icon: 'assets/materials/Spring of the First Dewdrop.avif',
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
                    hp: 5685.74,
                    atk: 158.03,
                    def: 356.49,
                },
                {
                    level: '50/50',
                    hp: 6541.52,
                    atk: 181.81,
                    def: 410.15,
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
                    name: 'Artificed Spare Clockwork Component — Coppelius',
                    value: 2,
                    icon: 'assets/materials/Artificed Spare Clockwork Component — Coppelius.avif',
                    quality: '4',
                },
                {
                    name: 'Prithiva Topaz Fragment',
                    value: 3,
                    icon: 'assets/materials/Prithiva Topaz Fragment.avif',
                    quality: '3',
                },
                {
                    name: 'Spring of the First Dewdrop',
                    value: 10,
                    icon: 'assets/materials/Spring of the First Dewdrop.avif',
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
                    hp: 7341.44,
                    atk: 204.05,
                    def: 460.3,
                },
                {
                    level: '60/60',
                    hp: 8206.07,
                    atk: 228.08,
                    def: 514.51,
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
                    name: 'Artificed Spare Clockwork Component — Coppelius',
                    value: 4,
                    icon: 'assets/materials/Artificed Spare Clockwork Component — Coppelius.avif',
                    quality: '4',
                },
                {
                    name: 'Prithiva Topaz Fragment',
                    value: 6,
                    icon: 'assets/materials/Prithiva Topaz Fragment.avif',
                    quality: '3',
                },
                {
                    name: 'Spring of the First Dewdrop',
                    value: 20,
                    icon: 'assets/materials/Spring of the First Dewdrop.avif',
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
                    hp: 8806.01,
                    atk: 244.75,
                    def: 552.13,
                },
                {
                    level: '70/70',
                    hp: 9678.53,
                    atk: 269,
                    def: 606.84,
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
                    name: 'Artificed Spare Clockwork Component — Coppelius',
                    value: 8,
                    icon: 'assets/materials/Artificed Spare Clockwork Component — Coppelius.avif',
                    quality: '4',
                },
                {
                    name: 'Prithiva Topaz Chunk',
                    value: 3,
                    icon: 'assets/materials/Prithiva Topaz Chunk.avif',
                    quality: '4',
                },
                {
                    name: 'Spring of the First Dewdrop',
                    value: 30,
                    icon: 'assets/materials/Spring of the First Dewdrop.avif',
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
                    hp: 10278.47,
                    atk: 285.68,
                    def: 644.45,
                },
                {
                    level: '80/80',
                    hp: 11160.83,
                    atk: 310.2,
                    def: 699.78,
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
                    name: 'Artificed Spare Clockwork Component — Coppelius',
                    value: 12,
                    icon: 'assets/materials/Artificed Spare Clockwork Component — Coppelius.avif',
                    quality: '4',
                },
                {
                    name: 'Prithiva Topaz Chunk',
                    value: 6,
                    icon: 'assets/materials/Prithiva Topaz Chunk.avif',
                    quality: '4',
                },
                {
                    name: 'Spring of the First Dewdrop',
                    value: 45,
                    icon: 'assets/materials/Spring of the First Dewdrop.avif',
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
                    hp: 11760.77,
                    atk: 326.88,
                    def: 737.39,
                },
                {
                    level: '90/90',
                    hp: 12650.03,
                    atk: 351.59,
                    def: 793.15,
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
                    name: 'Artificed Spare Clockwork Component — Coppelius',
                    value: 20,
                    icon: 'assets/materials/Artificed Spare Clockwork Component — Coppelius.avif',
                    quality: '4',
                },
                {
                    name: 'Prithiva Topaz Gemstone',
                    value: 6,
                    icon: 'assets/materials/Prithiva Topaz Gemstone.avif',
                    quality: '5',
                },
                {
                    name: 'Spring of the First Dewdrop',
                    value: 60,
                    icon: 'assets/materials/Spring of the First Dewdrop.avif',
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
            name: 'Blunt Refusal',
            type: 'Normal Attack',
            icon: 'assets/character/talents/Blunt Refusal.avif',
            description:
                'Normal AttackPerforms up to 4 consecutive strikes.Charged AttackDrains Stamina over time to perform continuous spinning attacks against all nearby opponents.At the end of the sequence, performs a more powerful slash.Plunging AttackPlunges from mid-air to strike the ground below, damaging opponents along the path and dealing AoE DMG upon impact.',
        },
        {
            name: 'Ceremonial Crystalshot',
            type: 'Elemental Skill',
            icon: 'assets/character/talents/Ceremonial Crystalshot.avif',
            description:
                'When a character in the party obtains an Elemental Shard created from the Crystallize reaction, Navia will gain 1 Crystal Shrapnel stack. Navia can have up to 6 stacks of Crystal Shrapnel at once. Each time Crystal Shrapnel gain is triggered, the duration of the Crystal Shrapnel stacks you already have will be reset.When she fires, Navia will consume all Crystal Shrapnel stacks and open her elegant yet lethal Gunbrella, firing multiple Rosula Shardshots that can penetrate opponents, dealing Geo DMG to opponents hit.When 0/1/2/3 or more stacks of Crystal Shrapnel are consumed, 5/7/9/11 Rosula Shardshots will be fired respectively. The more Rosula Shardshots that strike a single opponent, the greater the DMG dealt to them. When all 11 Rosula Shardshots strike, 200% of the original amount of DMG is dealt.In addition, when more than 3 stacks of Crystal Shrapnel are consumed, every stack consumed beyond those 3 will increase the DMG dealt by this Gunbrella attack by an additional 15%.HoldEnter Aiming Mode, continually collecting nearby Elemental Shards created by Crystallize reactions. When released, fire Rosula Shardshots with the same effect as when the skill is Tapped.Two initial charges.Arkhe: OusiaPeriodically, when Navia fires her Gunbrella, a Surging Blade will be summoned, dealing Ousia-aligned Geo DMG.',
        },
        {
            name: "As the Sunlit Sky's Singing Salute",
            type: 'Elemental Burst',
            icon: "assets/character/talents/As the Sunlit Sky's Singing Salute.avif",
            description:
                'On the orders of the President of the Spina di Rosula, call for a magnificent Rosula Dorata Salute. Unleashes a massive cannon bombardment on opponents in front of her, dealing AoE Geo DMG and providing Cannon Fire Support for a duration afterward, periodically dealing Geo DMG to nearby opponents.When cannon attacks hit opponents, Navia will gain 1 stack of Crystal Shrapnel. This effect can be triggered up to once every 2.4s.',
        },
        {
            name: 'Undisclosed Distribution Channels',
            type: '1st Ascension Passive',
            icon: 'assets/character/talents/Undisclosed Distribution Channels.avif',
            description:
                "For 4s after using Ceremonial Crystalshot, the DMG dealt by Navia's Normal Attacks, Charged Attacks, and Plunging Attacks will be converted into Geo DMG which cannot be overridden by other Elemental infusions, and the DMG dealt by Navia's Normal Attacks, Charged Attacks, and Plunging Attacks will be increased by 40%.",
        },
        {
            name: 'Mutual Assistance Network',
            type: '4th Ascension Passive',
            icon: 'assets/character/talents/Mutual Assistance Network.avif',
            description: 'For each Pyro/Electro/Cryo/Hydro party member, Navia gains 20% increased ATK. This effect can stack up to 2 times.',
        },
        {
            name: 'Painstaking Transaction',
            type: 'Utility Passive',
            icon: 'assets/character/talents/Painstaking Transaction.avif',
            description: 'Gains 25% more rewards when dispatched on a Fontaine Expedition for 20 hours.',
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
                    name: 'Lightless Silk String',
                    value: 1,
                    icon: 'assets/materials/Lightless Silk String.avif',
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
                    name: 'Lightless Silk String',
                    value: 1,
                    icon: 'assets/materials/Lightless Silk String.avif',
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
                    name: 'Lightless Silk String',
                    value: 2,
                    icon: 'assets/materials/Lightless Silk String.avif',
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
                    name: 'Lightless Silk String',
                    value: 2,
                    icon: 'assets/materials/Lightless Silk String.avif',
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
    version: '4.3',
    introduced: '4.0',
    voice_overs: {
        story: {
            en: [
                {
                    title: 'Hello',
                    text: 'Nice to meet you! I am Navia, the esteemed president, leader, commander-in-chief, executive director, and Boss of Spina di Rosula. You strike me as somebody special — a person of character. Something tells me that this is the beginning of a long partnership between us... perhaps even as long as all the titles in front of my name.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Hello.mp3',
                },
                {
                    title: 'Chat: Traveling',
                    text: "I really wanna go traveling! I don't mind where we go, as long as I have my friends with me, hehe.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Chat - Traveling.mp3',
                },
                {
                    title: 'Chat: Speaking From Experience',
                    text: 'My time with the Spina has taught me that carrying an unreliable weapon is worse than not carrying one at all.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Chat - Speaking From Experience.mp3',
                },
                {
                    title: 'Chat: Logo',
                    text: "I do love Spina di Rosula's logo. It was designed by my mother. Have you noticed how it's shaped like a heart?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Chat - Logo.mp3',
                },
                {
                    title: 'When It Rains',
                    text: "Ugh... It's raining again...",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/When It Rains.mp3',
                },
                {
                    title: 'When Thunder Strikes',
                    text: 'Aaah! Ugh, I should have covered my ears when I saw the flash!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/When Thunder Strikes.mp3',
                },
                {
                    title: 'When It Snows',
                    text: 'Maybe I should take off my hat, and let the snowflakes fall onto my face... I feel like that would be really refreshing.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/When It Snows.mp3',
                },
                {
                    title: 'When the Sun Is Out',
                    text: "Quick, look! Up in the sky! Look at that scorching sun, it's like a blast furnace! You know what this means? It means we have to drop everything, right now, and make a run for the ice cream store! We need to get two of the biggest cones they sell, and then it's an all-out race to see who can finish before it melts!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/When the Sun Is Out.mp3',
                },
                {
                    title: 'After the Rain',
                    text: 'Finally! The rain has stopped!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/After the Rain.mp3',
                },
                {
                    title: 'When the Wind Is Blowing',
                    text: "*gasp* My hat! No, my skirt! Aah, don't make me choose!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/When the Wind Is Blowing.mp3',
                },
                {
                    title: 'In the Desert',
                    text: "Sunglasses are great at keeping the sand out of your eyes so you can see your way! Except at night... then you can't see anything at all...",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/In the Desert.mp3',
                },
                {
                    title: 'Good Morning',
                    text: "Morning! Any plans for the day yet? If not, why don't you hang out with me?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Good Morning.mp3',
                },
                {
                    title: 'Good Afternoon',
                    text: "I've heard about this weird new kind of lasagna that's just come out. You wanna try it together? Sounds like it'll taste pretty strange... but I still gotta try it!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Good Afternoon.mp3',
                },
                {
                    title: 'Good Evening',
                    text: 'In the headlines tonight, President of Spina di Rosula in "awesome" mood after spending another fantastic day with her favorite partner!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Good Evening.mp3',
                },
                {
                    title: 'Good Night',
                    text: "Come on now, time to empty your mind and get a good night's sleep! I'll see you tomorrow~",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Good Night.mp3',
                },
                {
                    title: 'About Navia: Optimism',
                    text: "I always say that blind optimism isn't the answer — if you want a bright future, you have to go out and seize it with your own two hands! So, come over here... Now, take my hands in yours and give them a good shake. There! See, doesn't that feel good?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Navia - Optimism.mp3',
                },
                {
                    title: 'About Navia: Luck',
                    text: "People who know about my past might think I've suffered a lot of misfortune, but I don't see it like that at all.I count myself lucky to have received so much love in life.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Navia - Luck.mp3',
                },
                {
                    title: 'About Us: Partners',
                    text: 'Some people call me "Boss," others "Demoiselle," but none of that does anything for me. My favorite thing to be called is "partner" — but only by you, of course. So, just know that my vainer side would be over the moon if you could indulge me a little more often.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Us - Partners.mp3',
                },
                {
                    title: 'About Us: Keeping Secrets',
                    text: "People say that a secret shared is a secret no more, but I like to think that true friends keep each other's secrets. ...What? Veiled threat? No, of course not! Granted, as president of Spina di Rosula, I do have my ways of making people keep their mouths shut, but don't worry — I promise not to use those on you.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Us - Keeping Secrets.mp3',
                },
                {
                    title: 'About the Vision',
                    text: "Here, take a look at my Vision! I love how shiny it is. Doesn't it go great with my dress?Still, it's nothing compared to using the elements without a Vision... And with no training or anything either, right? So cool.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About the Vision.mp3',
                },
                {
                    title: 'Something to Share: Dogs',
                    text: "My favorite dog breed of all is the chestnut hunting hound. You know how they have the little spots above their eyes? They look just like eyebrows, don't they? That's why they look so innocent and earnest all the time. Please keep this a secret for me, though — I don't wanna hurt the other dogs' feelings!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Something to Share - Dogs.mp3',
                },
                {
                    title: 'Something to Share: The Dependable Spina di Rosula',
                    text: "If you've spent long enough in the Fleuve Cendre, you might have noticed that there are a lot of other groups in Fontaine besides the Spina di Rosula. Beware of them — they each have their own agenda, and they're not all friendly like us. If you ever find yourself in a tight spot, you can always ask Mr. Tetreaux at the bar for help. Unless you're dealing with someone who isn't in the mood to sit down and have a conversation, in which case... White Glove will sort things out. You can count on him.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Something to Share - The Dependable Spina di Rosula.mp3',
                },
                {
                    title: 'Interesting Things',
                    text: "I really love the Pluie Lotus — it's such a beautiful color. Plus, when you see them in full bloom, it's a sure sign that the rainy season is finally over.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Interesting Things.mp3',
                },
                {
                    title: 'About Clorinde',
                    text: "She might not say much, or show a lot of emotion, but I can tell that she feels deeply. After my father's death, I... well, it caused quite a rift between us for a long time. But even then, I never did like having her constantly walking on eggshells around me... I much prefer how things are now.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Clorinde.mp3',
                },
                {
                    title: 'About Charlotte',
                    text: "Charlotte's known for her fast-and-furious reporting, but it's her photography skills that really impress me. She once snapped a quick photo of me, a waist-up shot, and the result was absolutely stunning — it was like looking at an oil painting. She seems to have a knack for writing extraordinary news stories and taking the most eye-catching photos. Guess she was born to be a journalist.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Charlotte.mp3',
                },
                {
                    title: 'About Chiori',
                    text: "Ah, the fashion designer who brought the coolest Inazuman trends to Fontaine? She's actually been a great help to the Spina behind the scenes. She says my unorthodox ideas always give her a lot of inspiration for her work, and from what I can tell, I think she means it. Still, she drew the line at my request for a ten-meter-tall top hat. *sigh* Missed opportunity, if you ask me... Imagine seeing one of those in front of the shop! It would be a great way to draw in customers.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Chiori.mp3',
                },
                {
                    title: 'About Furina',
                    text: 'I was lucky enough to catch her in an opera when I was young. Even though it was a charity show, the tickets were nearly impossible to get! She was performing in character then, but I thought she seemed more in her element then than she ever did as an Archon, giving speeches up in the opera box... Looking back, I guess my intuition was right.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Furina.mp3',
                },
                {
                    title: 'About Neuvillette',
                    text: "Ah, how to describe Monsieur Neuvillette... He's... complex, in some ways — but very straightforward in others. I guess a good analogy would be rocky reefs in the sea: Trying to navigate through obstacles you can't see makes for a bumpy ride, but if you can figure out how they work, you start to spot the signs.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Neuvillette.mp3',
                },
                {
                    title: 'About Wriothesley',
                    text: "Trying to discuss anything with that guy is an exhausting process. Clorinde says I needn't have any reservations about collaborating with him in the scope of our preexisting agreement, but I still shouldn't trust everything that comes out of his mouth. No wonder my father never tried to get involved with the affairs of the Fortress... I think I'll play it safe and keep things that way.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Wriothesley.mp3',
                },
                {
                    title: 'About The Knave',
                    text: "She is a formidable but caring leader, and definitely comes across like a master of the house. But she's still a Fatui Harbinger, and that means she must have a more ruthless side. So don't worry — while I'll always appreciate what she did for Poisson, I'm not about to let my guard down around her completely.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About The Knave.mp3',
                },
                {
                    title: 'About Lyney and Lynette',
                    text: "I know magicians can often be all bravado and razzmatazz, but I can tell that Lyney is a sincere guy who cares deeply about his friends and family. He's so mature for his age, it catches me off guard sometimes... Oh, and how could I forget — it was so kind of him to try and cheer up the children in Poisson with an impromptu free magic show during the flood! I'll have to invite him and Lynette over for some macarons at my place when I get the chance. I know Lynette's always conjuring teacups out of thin air, so surely at least she's a fan of a proper tea break?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Lyney and Lynette.mp3',
                },
                {
                    title: 'About Escoffier',
                    text: "My good friend Escoffier is finally out and about again... It's about time. Shutting herself away like that, all to try and surpass her own magnum opus, Gateau Debord. It's a wonder she can even stand the sunlight after all that time inside. You know what? We should all go for a picnic sometime! I'll make sure to bring her a pair of sunglasses and a parasol. Believe me, you're in for a treat! With Escoffier, even the simplest of outings feel like fine dining!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/About Escoffier.mp3',
                },
                {
                    title: 'More About Navia: I',
                    text: "The Spina's work is basically... well, a little bit of everything, but the focus is always on solving other people's problems. ...That probably makes it sound worse than it is, though. Sure, I'm making other people's problems my own, but I always get a real boost out of being able to help people.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/More About Navia - I.mp3',
                },
                {
                    title: 'More About Navia: II',
                    text: "I've always thought that it's important to appreciate the beauty in the world. The blossoms in the spring, summers by the sea, the smiles on your friends' faces... You shouldn't take those things for granted.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/More About Navia - II.mp3',
                },
                {
                    title: 'More About Navia: III',
                    text: "Sometimes, I like to go out into the wild, find a quiet place with no one else around, and do some target practice.It's a great way to destress! Wanna try? I can walk you through it step by step. You'd be my first student, but I feel like I'd be a great teacher. I still remember everything that my father and Nanny Bracari ever taught me!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/More About Navia - III.mp3',
                },
                {
                    title: 'More About Navia: IV',
                    text: "I won't become the same kind of person as my father was. Some veterans of the Spina think that I'm becoming more and more like him, but I think the trend they're referring to is a superficial one, born out of the simple fact that some problems only have so many solutions. Spina di Rosula has changed a lot since my father's day, and I intend to be the president for the Spina of today.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/More About Navia - IV.mp3',
                },
                {
                    title: 'More About Navia: V',
                    text: "I also don't think I'm going to turn into my mother, either. People say we have similar personalities, and I can kind of understand her reasons for making the decisions she did back in the day, but even so...Huh, I have a sudden urge to take a trip on the Clementine Line. Could you come with me? I don't have a particular goal in mind, but... maybe we could take a walk around the city afterwards?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/More About Navia - V.mp3',
                },
                {
                    title: "Navia's Hobbies",
                    text: "I've loved baking ever since I was a child. Don't you think it's magical? You throw a bunch of random ingredients together in the right amounts, put the mixture in the oven, and then just watch as it slowly balloons up and transforms into a delicious treat...Hey, do you wanna make gingerbread together sometime? We can make it into a fun little competition — see who can build the biggest, most beautiful gingerbread house!",
                    reading: null,
                    audio: "assets/character/voice_overs/Navia/story/en/Navia's Hobbies.mp3",
                },
                {
                    title: "Navia's Troubles",
                    text: "Ugh, cleaning up after baking a cake is a nightmare. The flour just gets everywhere, and the leftover egg whites and cream go all sticky and gross... I'll, um... I'll just go find a helper!",
                    reading: null,
                    audio: "assets/character/voice_overs/Navia/story/en/Navia's Troubles.mp3",
                },
                {
                    title: 'Favorite Food',
                    text: "I like trying new things, for the surprise factor. But before you question my sense of taste, let me clarify that just because I can appreciate the novelty in a dish doesn't mean I'm claiming it tastes amazing.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Favorite Food.mp3',
                },
                {
                    title: 'Least Favorite Food',
                    text: "I never enjoy leftovers that have been left too long. It just feels like sacrilege to neglect the poor food when it's fresh, then eat after it's gone stale...",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Least Favorite Food.mp3',
                },
                {
                    title: 'Receiving a Gift: I',
                    text: 'This is some incredible cooking! Next time we head out together, looks like I should carry the ingredients and cookware, and let you be the chef.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Receiving a Gift - I.mp3',
                },
                {
                    title: 'Receiving a Gift: II',
                    text: "Not bad! Next time, you cook the food and I'll plate it. Then, it'll look as good as it tastes.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Receiving a Gift - II.mp3',
                },
                {
                    title: 'Receiving a Gift: III',
                    text: "Don't feel discouraged! The world needs people who aren't afraid to innovate.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Receiving a Gift - III.mp3',
                },
                {
                    title: 'Birthday',
                    text: "Do you believe that wishes can come true? You know, like when you toss a coin into a fountain for good luck? As long as you throw enough coins in, one of your wishes is sure to come true, right?Well anyway, today's your birthday, so I'm not leaving anything to chance — I've got a whole bag of Mora here dedicated to making your birthday wish come true. Whatever you want, I'll do everything in my power to make it happen!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Birthday.mp3',
                },
                {
                    title: 'Feelings About Ascension: Intro',
                    text: "This feeling, it's like... Like a lemon cheesecake!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Feelings About Ascension - Intro.mp3',
                },
                {
                    title: 'Feelings About Ascension: Building Up',
                    text: 'As the cream melts on the tip of my tongue, all my stress fades away.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Feelings About Ascension - Building Up.mp3',
                },
                {
                    title: 'Feelings About Ascension: Climax',
                    text: "Do you know that chocolate candy that's made in the shape of a bullet? It's so sweet, it's like an instant shot of energy to your whole body. Well, that's what this feels like!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Feelings About Ascension - Climax.mp3',
                },
                {
                    title: 'Feelings About Ascension: Conclusion',
                    text: "All I need now is a nice pot of soothing tea with a little milk, and our tea party can finally commence... But seriously, one tea party wouldn't begin to repay you after everything you've done for me. So if there's ever something you need in Fontaine, know that Spina di Rosula will always be happy to help you.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/en/Feelings About Ascension - Conclusion.mp3',
                },
            ],
            zh: [
                {
                    title: '初次见面…',
                    text: '大名鼎鼎的刺玫会现任会长、领导者、总指挥、话事人、老板娜维娅，很高兴认识你！看你才貌出众、气度不凡，我有种预感，我们的缘分会像我的名号一样长呢。',
                    reading:
                        'Dàmíngdǐngdǐng de Cìméihuì xiànrèn huìzhǎng, lǐngdǎozhě, zǒngzhǐhuī, huàshìrén, lǎobǎn Nàwéiyà, hěn gāoxìng rènshì nǐ! Kàn nǐ cáimào chūzhòng, qìdù bùfán, wǒ yǒu zhǒng yùgǎn, wǒmen de yuánfèn huì xiàng wǒ de mínghào yīyàng cháng ne.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/初次见面….mp3',
                },
                {
                    title: '闲聊·旅行',
                    text: '好想去旅游呀——！去哪无所谓啦，主要是想跟朋友们一起玩，嘿嘿。',
                    reading: 'Hǎo xiǎng qù lǚyóu ya——! Qù nǎ wúsuǒwèi la, zhǔyào shì xiǎng gēn péngyǒumen yīqǐ wán, hēihēi.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/闲聊·旅行.mp3',
                },
                {
                    title: '闲聊·经验之谈',
                    text: '多年的帮派经验告诉我，身边有一把不称手的武器会比没有更危险。',
                    reading: 'Duōnián de bāngpài jīngyàn gàosù wǒ, shēnbiān yǒu yī bǎ bù chènshǒu de wǔqì huì bǐ méiyǒu gèng wēixiǎn.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/闲聊·经验之谈.mp3',
                },
                {
                    title: '闲聊·会标',
                    text: '刺玫会的标志是母亲设计的，我非常喜欢。你看，轮廓像颗心脏一样呢。',
                    reading: 'Cìméihuì de biāozhì shì mǔqīn shèjì de, wǒ fēicháng xǐhuān. Nǐ kàn, lúnkuò xiàng kē xīnzàng yīyàng ne.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/闲聊·会标.mp3',
                },
                {
                    title: '下雨的时候…',
                    text: '啊…又是雨天…',
                    reading: 'A… yòu shì yǔtiān…',
                    audio: 'assets/character/voice_overs/Navia/story/zh/下雨的时候….mp3',
                },
                {
                    title: '打雷的时候…',
                    text: '哎呀！刚才看到闪电就该捂住耳朵的！',
                    reading: 'Āiyā! Gāngcái kàndào shǎndiàn jiù gāi wǔ zhù ěrduo de!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/打雷的时候….mp3',
                },
                {
                    title: '下雪的时候…',
                    text: '是不是应该摘掉帽子，让雪花落在脸上？感觉一定很清爽。',
                    reading: 'Shìbushì yīnggāi zhāi diào màozi, ràng xuěhuā luò zài liǎn shàng? Gǎnjué yīdìng hěn qīngshuǎng.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/下雪的时候….mp3',
                },
                {
                    title: '阳光很好…',
                    text: '就是现在，立刻，马上，抬头！你看天上，是不是烈日炎炎，骄阳似火！知道这说明什么吗？说明我们现在应当立刻，马上，去买最大号的超级冰冰凉甜筒，然后比赛谁能在它融化前全部吃完！',
                    reading:
                        'Jiùshì xiànzài, lìkè, mǎshàng, táitóu! Nǐ kàn tiān shàng, shìbushì lièrìyányán, jiāoyángsìhuǒ! Zhīdào zhè shuōmíng shénme ma? Shuōmíng wǒmen xiànzài yīngdāng lìkè, mǎshàng, qù mǎi zuìdà hào de chāojí bīngbīngliáng tiántǒng, ránhòu bǐsài shéi néng zài tā rónghuà qián quánbù chī wán!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/阳光很好….mp3',
                },
                {
                    title: '雨过天晴…',
                    text: '太好了，雨停了！',
                    reading: 'Tài hǎo le, yǔ tíng le!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/雨过天晴….mp3',
                },
                {
                    title: '刮大风了…',
                    text: '帽子和裙摆…好难取舍！',
                    reading: 'Màozi hé qún bǎi… hǎo nán qǔshě!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/刮大风了….mp3',
                },
                {
                    title: '在沙漠的时候…',
                    text: '戴上墨镜就不会被沙子迷住眼睛了！但天黑时会看不清路…',
                    reading: 'Dài shàng mòjìng jiù bù huì bèi shāzi mí zhù yǎnjīng le! Dàn tiānhēi shí huì kàn bù qīng lù…',
                    audio: 'assets/character/voice_overs/Navia/story/zh/在沙漠的时候….mp3',
                },
                {
                    title: '早上好…',
                    text: '早上好！想好今天要做什么了吗？没想好的话，要不要跟我来？',
                    reading: 'Zǎoshang hǎo! Xiǎng hǎo jīntiān yào zuò shénme le ma? Méi xiǎng hǎo de huà, yào bù yào gēn wǒ lái?',
                    audio: 'assets/character/voice_overs/Navia/story/zh/早上好….mp3',
                },
                {
                    title: '中午好…',
                    text: '听说最近出了一种新口味的千层面，你有没有兴趣？感觉一定不会好吃，但我还是想去试试！',
                    reading: 'Tīngshuō zuìjìn chū le yī zhǒng xīn kǒuwèi de qiāncéngmiàn, nǐ yǒu méiyǒu xìngqù? Gǎnjué yīdìng bù huì hǎochī, dàn wǒ háishì xiǎng qù shìshì!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/中午好….mp3',
                },
                {
                    title: '晚上好…',
                    text: '晚间新闻播报：「今天的刺玫会会长也和她的好搭档度过了完美的一天。」真棒！',
                    reading: 'Wǎnjiān xīnwén bōbào: "Jīntiān de Cìméihuì huìzhǎng yě hé tā de hǎo dādàng dùguò le wánměi de yītiān." Zhēn bàng!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/晚上好….mp3',
                },
                {
                    title: '晚安…',
                    text: '快，速速清空大脑，睡个好觉！明天见。',
                    reading: 'Kuài, sùsù qīngkōng dànǎo, shuì ge hǎo jiào! Míngtiān jiàn.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/晚安….mp3',
                },
                {
                    title: '关于娜维娅自己·乐观',
                    text: '盲目乐观可不行，幸福的生活要靠自己的双手去争取！所以，来，握住我的双手，左右摇晃几下——怎么样，是不是很开心？',
                    reading:
                        'Mángmù lèguān kě bù xíng, xìngfú de shēnghuó yào kào zìjǐ de shuāngshǒu qù zhēngqǔ! Suǒyǐ, lái, wò zhù wǒ de shuāngshǒu, zuǒyòu yáohuàng jǐ xià——zěnmeyàng, shì bùshì hěn kāixīn?',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于娜维娅自己·乐观.mp3',
                },
                {
                    title: '关于娜维娅自己·运气',
                    text: '了解我经历的人可能会觉得我运气不好吧，但我不这么认为哦。能得到这么多的爱，是我一生最幸运的事情了吧。',
                    reading: 'Liǎojiě wǒ jīnglì de rén kěnéng huì juéde wǒ yùnqì bù hǎo ba, dàn wǒ bù zhème rènwéi. Néng dédào zhème duō de ài, shì wǒ yīshēng zuì xìngyùn de shìqíng le ba.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于娜维娅自己·运气.mp3',
                },
                {
                    title: '关于我们·搭档',
                    text: '他们有人叫我老板，有人叫我大小姐，我都无所谓啦。最开心的还是你称呼我为「搭档」的时候，所以请多叫几次，满足我的虚荣心吧！',
                    reading:
                        'Tāmen yǒu rén jiào wǒ lǎobǎn, yǒu rén jiào wǒ dàxiǎojiě, wǒ dōu wúsuǒwèi la. Zuì kāixīn de háishì nǐ chēnghu wǒ wèi "dādàng" de shíhou, suǒyǐ qǐng duō jiào jǐ cì, mǎnzú wǒ de xūróngxīn ba!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于我们·搭档.mp3',
                },
                {
                    title: '关于我们·保密',
                    text: '有人说秘密一旦说出口就不是秘密了，但能和朋友分享的秘密不是更加珍贵吗？…什么啊，我不是在威胁你啦！虽然身为刺玫会的会长，我当然知道很多让人保守秘密的诀窍，但我是不会用在你身上的，安心啦。',
                    reading:
                        'Yǒurén shuō mìmì yīdàn shuō chūkǒu jiù bùshì mìmì le, dàn néng hé péngyǒu fēnxiǎng de mìmì bù shì gèng jiā zhēnguì ma? …Shénme a, wǒ bù shì zài wēixié nǐ la! Suīrán shēnwéi Cìméihuì de huìzhǎng, wǒ dāngrán zhīdào hěn duō ràng rén bǎoshǒu mìmì de juéqiào, dàn wǒ shì bù huì yòng zài nǐ shēnshang de, ānxīn la.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于我们·保密.mp3',
                },
                {
                    title: '关于「神之眼」…',
                    text: '给你看，这就是我的神之眼！亮晶晶，很称我衣服的颜色吧？不过还是你比较厉害，不需要神之眼就能使用很多种元素，应该不是靠练习就能做到的吧？',
                    reading:
                        'Gěi nǐ kàn, zhè jiù shì wǒ de Shénzhī Yǎn! Liàngjīngjīng, hěn chèn wǒ yīfú de yánsè ba? Bùguò háishì nǐ bǐjiào lìhài, bù xūyào Shénzhī Yǎn jiù néng shǐyòng hěn duō zhǒng yuánsù, yīnggāi bù shì kào liànxí jiù néng zuòdào de ba?',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于「神之眼」….mp3',
                },
                {
                    title: '有什么想要分享·狗狗',
                    text: '在所有的品种里，我最喜欢深栗猎犬。你看它们眼睛上方的花纹，是不是很像眉毛？所以它们总是一副憨厚又认真的样子呢。不过这件事还请帮我保密，千万不要告诉别的狗狗！',
                    reading:
                        'Zài suǒyǒu de pǐnzhǒng lǐ, wǒ zuì xǐhuān shēnlì lièquǎn. Nǐ kàn tāmen yǎnjīng shàngfāng de huāwén, shì bù shì hěn xiàng méimáo? Suǒyǐ tāmen zǒng shì yī fù hānhòu yòu rènzhēn de yàngzi ne.Bùguò zhè jiàn shì hái qǐng bāng wǒ bǎomì, qiānwàn bù yào gàosù bié de gǒugǒu!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/有什么想要分享·狗狗.mp3',
                },
                {
                    title: '有什么想要分享·可靠的刺玫会',
                    text: '假如你在灰河待过一段时间，应该会发现枫丹还是有不少其他帮派的。他们的目的不一，并不都像刺玫会那样友善，你可要多加留心。如有必要，可以向酒保泰托先生求助。若是对方不愿意坐下来谈的话…嗯，那就只好请我们可靠的白手套先生出马咯。',
                    reading:
                        'Jiǎrú nǐ zài Huī Hé dài guò yīduàn shíjiān, yīnggāi huì fāxiàn Fēngdān háishì yǒu bù shǎo qítā bāngpài de. Tāmen de mùdì bù yī, bìng bù dōu xiàng Cìméihuì nàyàng yǒushàn, nǐ kě yào duō jiā liúxīn. Rú yǒu bìyào, kěyǐ xiàng jiǔbǎo Tàituō xiānshēng qiúzhù. Ruò shì duìfāng bù yuànyì zuò xiàlái tán de huà… ń, nà jiù zhǐhǎo qǐng wǒmen kěkào de Bái Shǒutào xiānshēng chūmǎ luó.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/有什么想要分享·可靠的刺玫会.mp3',
                },
                {
                    title: '感兴趣的见闻…',
                    text: '久雨莲的颜色真好看啊。而且当你看到它们纷纷绽放的时候，就说明漫长的雨季终于过去了。',
                    reading: 'Jiǔyǔlián de yánsè zhēn hǎokàn a. Érqiě dāng nǐ kàndào tāmen fēnfēn zhànfàng de shíhou, jiù shuōmíng màncháng de yǔjì zhōngyú guòqù le.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/感兴趣的见闻….mp3',
                },
                {
                    title: '关于克洛琳德…',
                    text: '她平时话不多，表情也不多，但还是能看出来喜怒哀乐的。之前老爹的事卡在我们之间，唔…有些隔阂吧，就算是那段日子，我也不爱她小心翼翼的样子…还是现在这样比较好。',
                    reading:
                        'Tā píngshí huà bù duō, biǎoqíng yě bù duō, dàn háishì néng kàn chūlái xǐnùāilè de. Zhīqián lǎodiē de shì kǎ zài wǒmen zhījiān, wú… yǒuxiē géhé ba, jiùsuàn shì nà duàn rìzi, wǒ yě bù ài tā xiǎoxīnyìyì de yàngzi… háishì xiànzài zhèyàng bǐjiào hǎo.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于克洛琳德….mp3',
                },
                {
                    title: '关于夏洛蒂…',
                    text: '比起跑新闻时的热情和速度，夏洛蒂的拍照技术更让我惊讶。她之前随手给我拍过一张半身照，光影效果好像精心绘制的油画一样。既能写出意想不到的报道，又能拍出最能抓人眼球的画片，她大概天生就是要做记者的吧。',
                    reading:
                        'Bǐqǐ pǎo xīnwén shí de rèqíng hé sùdù, Xiàluòdì de pāizhào jìshù gèng ràng wǒ jīngyà. Tā zhīqián suíshǒu gěi wǒ pāi guò yī zhāng bànshēn zhào, guāngyǐng xiàoguǒ hǎoxiàng jīngxīn huìzhì de yóuhuà yīyàng. Jì néng xiě chū yìxiǎngbùdào de bàodào, yòu néng pāi chū zuì néng zhuā rén yǎnqiú de huàpiàn, tā dàgài tiānshēng jiù shì yào zuò jìzhě de ba.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于夏洛蒂….mp3',
                },
                {
                    title: '关于千织…',
                    text: '这位为枫丹时尚带来异国风情的服装设计师，私下里帮过刺玫会不少忙呢。她说我的奇思妙想给她提供了好多创作灵感，以我对她的了解来看，应该不是客气话。但当我请她做一个十米高的礼帽时，她却严词拒绝了。唉，要是能摆在店门前，应该是很惹眼的宣传手段呀！',
                    reading:
                        'Zhè wèi wèi Fēngdān shíshàng dài lái yìguó fēngqíng de fúzhuāng shèjìshī, sīxià lǐ bāng guò Cìméihuì bù shǎo máng ne. Tā shuō wǒ de qísīmiàoxiǎng gěi tā tígōng le hǎo duō chuàngzuò línggǎn, yǐ wǒ duì tā de liǎojiě lái kàn, yīnggāi bù shì kèqì huà. Dàn dāng wǒ qǐng tā zuò yī gè shí mǐ gāo de lǐmào shí, tā què yáncí jùjué le. Āi, yàoshì néng bǎi zài diànmén qián, yīnggāi shì hěn rěyǎn de xuānchuán shǒuduàn ya!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于千织….mp3',
                },
                {
                    title: '关于芙宁娜…',
                    text: '小时候有幸观看过一次芙宁娜大人参与义演的歌剧，票可难买了！虽然扮演的是别的角色，但她看起来反而比平常站在高处演讲时更自然些…现在回想起来，竟然不是错觉。',
                    reading:
                        "Xiǎoshíhou yǒuxìng guānkàn guò yīcì Fúníngnà dàrén cānyù yìyǎn de gējù, piào kě nán mǎi le! Suīrán bànyǎn de shì bié de juésè, dàn tā kàn qǐlái fǎn'ér bǐ píngcháng zhàn zài gāo chù yǎnjiǎng shí gèng zìrán xiē… Xiànzài huíxiǎng qǐlái, jìngrán bù shì cuòjué.",
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于芙宁娜….mp3',
                },
                {
                    title: '关于那维莱特…',
                    text: '那维莱特先生啊，既复杂又简单。怎么说呢…就像海里的礁石，磕磕绊绊的，但假如理解了其中的规律，也不是完全没法观测。',
                    reading:
                        'NàWéiláitè xiānshēng a, jì fùzá yòu jiǎndān. Zěnme shuō ne… Jiù xiàng hǎi lǐ de jiāoshí, kēkebànban de, dàn jiǎrú lǐjiě le qízhōng de guīlǜ, yě bù shì wánquán méifǎ guāncè.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于那维莱特….mp3',
                },
                {
                    title: '关于莱欧斯利…',
                    text: '想和他谈点东西可费劲了。克洛琳德说在既定的合约基础上可以放心与他合作，但千万不要相信他说的每一句话。怪不得老爹以前从不插手水下的事，保险起见，还是维持原样吧。',
                    reading:
                        'Xiǎng hé tā tán diǎn dōngxi kě fèijìn le. Kèluòlíndé shuō zài jìdìng de héyuē jīchǔ shàng kěyǐ fàngxīn yǔ tā hézuò, dàn qiānwàn bù yào xiāngxìn tā shuō de měi yījù huà. Guàibude lǎodiē yǐqián cóng bù chāshǒu shuǐ xià de shì, bǎoxiǎn qǐjiàn, háishì wéichí yuányàng ba.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于莱欧斯利….mp3',
                },
                {
                    title: '关于「仆人」…',
                    text: '她是一位威严却又慈爱的领导者，有「一家之主」的风范。不过能成为愚人众的执行官，她一定也有手段狠厉的一面。所以放心吧，我会永远记得她帮助过白淞镇的恩情，但在其他方面也会留心的。',
                    reading:
                        'Tā shì yī wèi wēiyán què yòu cí\'ài de lǐngdǎozhě, yǒu "yī jiā zhī zhǔ" de fēngfàn. Bùguò néng chéngwéi Yúrén Zhòng de zhíxíngguān, tā yīdìng yě yǒu shǒuduàn hěn lì de yīmiàn. Suǒyǐ fàngxīn ba, wǒ huì yǒngyuǎn jìdé tā bāngzhù guò Báisōngzhèn de ēnqíng, dàn zài qítā fāngmiàn yě huì liúxīn de.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于「仆人」….mp3',
                },
                {
                    title: '关于林尼和琳妮特…',
                    text: '我知道大魔术师说话总会有些浮夸啦，但能看出，林尼是真心对待身边亲友的。有时候他表现出的责任感，可比他的年纪大多了…哦对了，他之前免费给白淞镇的小朋友们变过魔术呢！有机会的话，下次也请他和琳妮特小姐一起来吃马卡龙吧。琳妮特小姐经常凭空变出茶杯来喝茶，那应该不会讨厌甜点吧？',
                    reading:
                        'Wǒ zhīdào Dà Móshùshī shuōhuà zǒng huì yǒuxiē fúkuā la, dàn néng kàn chū, Línní zhēnxīn duìdài shēnbiān qīnyǒu de. Yǒushíhou tā biǎoxiàn chū de zérèngǎn, kě bǐ tā de niánjì dà duō le… O duì le, tā zhīqián miǎnfèi gěi Báisōngzhèn de xiǎopéngyǒu men biàn guò móshù ne! Yǒu jīhuì de huà, xiàcì yě qǐng tā hé Línnī Tè xiǎojiě yīqǐ lái chī mǎkǎlóng ba. Línnī Tè xiǎojiě jīngcháng píngkōng biàn chū chábēi lái hē chá, nà yīnggāi bù huì tǎoyàn tiándiǎn ba?',
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于林尼和琳妮特….mp3',
                },
                {
                    title: '关于爱可菲',
                    text: '我的好朋友爱可菲呀，她总算是结束闭关了。听说，她在开发超越「德波大蛋糕」的新品，一直闷在自己的专属厨房里。再这样下去，眼睛都要畏光了吧？不如，我们约上她，找个时间出门野餐吧？阳伞和墨镜随她选。和爱可菲出行，普普通通的郊游都会变成一场美食之旅哦。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/zh/关于爱可菲.mp3',
                },
                {
                    title: '想要了解娜维娅·其一',
                    text: '刺玫会的工作嘛，杂七杂八的什么都有吧，不过核心目的都是帮助大家解决各种麻烦。这里的「麻烦」只用来指代问题本身，不代表我觉得这些事情烦心哦。相反，能帮到大家会让我觉得神清气爽呢。',
                    reading:
                        'Cìmèihuì de gōngzuò ma, záqīzábā de shénme dōu yǒu ba, bùguò héxīn mùdì dōu shì bāngzhù dàjiā jiějué gèzhǒng máfan. Zhèlǐ de "máfan" zhǐ yòng lái zhǐdài wèntí běnshēn, bù dàibiǎo wǒ juéde zhèxiē shìqing fánxīn o. Xiāngfǎn, néng bāng dào dàjiā huì ràng wǒ juéde shénqīngqìshuǎng ne.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/想要了解娜维娅·其一.mp3',
                },
                {
                    title: '想要了解娜维娅·其二',
                    text: '人还是要有些浪漫情怀才行。春天的花，夏天的海，还有朋友的笑容，都不该是被忽略的景色。',
                    reading: 'Rén háishì yào yǒuxiē làngmàn qínghuái cái xíng. Chūntiān de huā, xiàtiān de hǎi, hái yǒu péngyǒu de xiàoróng, dōu bù gāi shì bèi hūlüè de jǐngsè.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/想要了解娜维娅·其二.mp3',
                },
                {
                    title: '想要了解娜维娅·其三',
                    text: '有时我会找个人迹罕至的野外，摆一些物件作为目标，然后练习打靶。很解压的！你想试试吗？我来手把手教你。虽然你是我的第一个学生，但我觉得我会成为一名好老师的。老爹还有布莱卡利奶奶教我的东西我都还没忘呢！',
                    reading:
                        'Yǒushí wǒ huì zhǎo gè rénjì hǎnzhì de yěwài, bǎi yīxiē wùjiàn zuòwéi mùbiāo, ránhòu liànxí dǎbǎ. Hěn jiěyā de! Nǐ xiǎng shìshì ma? Wǒ lái shǒubàshǒu jiāo nǐ. Suīrán nǐ shì wǒ de dì yī gè xuéshēng, dàn wǒ juéde wǒ huì chéngwéi yī míng hǎo lǎoshī de. Lǎodiē hái yǒu Bùlái Kǎlì nǎinai jiāo wǒ de dōngxi wǒ dōu hái méi wàng ne!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/想要了解娜维娅·其三.mp3',
                },
                {
                    title: '想要了解娜维娅·其四',
                    text: '我不会变成和老爹一样的人。有刺玫会里的老干部觉得我和老爹越来越像了，但我认为那只是很小的倾斜，要归因为有些问题只能用固定的几种办法来解决。刺玫会已经不是当年的样子了，那么会长也不会相同。',
                    reading:
                        'Wǒ bù huì biànchéng hé lǎodiē yīyàng de rén. Yǒu Cìmèihuì lǐ de lǎogànbù juéde wǒ hé lǎodiē yuè lái yuè xiàng le, dàn wǒ rènwéi nà zhǐshì hěn xiǎo de qīngxié, yào guī yīn wéi yǒuxiē wèntí zhǐ néng yòng gùdìng de jǐ zhǒng bànfǎ lái jiějué. Cìmèihuì yǐjīng bù shì dāngnián de yàngzi le, nàme huìzhǎng yě bù huì xiāngtóng.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/想要了解娜维娅·其四.mp3',
                },
                {
                    title: '想要了解娜维娅·其五',
                    text: '我觉得我也不会变成和母亲一样的人。虽然很多人都说我性格和她很像，我也大约能想象到她当年做出很多选择的理由，但是…哎，突然很想去坐一次克莱门汀线。就现在，可以陪我吗？倒也没什么特别的目的，就当是我邀请你去城里闲逛吧？',
                    reading:
                        'Wǒ juéde wǒ yě bù huì biàn chéng hé mǔqīn yīyàng de rén. Suīrán hěnduō rén dōu shuō wǒ xìnggé hé tā hěn xiàng, wǒ yě dàyuē néng xiǎngxiàng dào tā dāngnián zuò chū hěnduō xuǎnzé de lǐyóu, dànshì…  Ai, tūrán hěn xiǎng qù zuò yīcì Kèláiméndìng xiàn. Jiù xiànzài, kěyǐ péi wǒ ma? Dào yě méi shénme tèbié de mùdì, jiù dàng shì wǒ yāoqǐng nǐ qù chéng lǐ xiánguàng ba?',
                    audio: 'assets/character/voice_overs/Navia/story/zh/想要了解娜维娅·其五.mp3',
                },
                {
                    title: '娜维娅的爱好…',
                    text: '我从小就喜欢烘焙。看着一堆零散的食材按照比例融合在一起，就能在烘烤的过程中一点点膨胀、定型，变成香喷喷的样子，是不是很神奇？对了，有机会一起来烤姜饼吧？比比看谁能用饼干搭出最高最漂亮的小屋！',
                    reading:
                        'Wǒ cóngxiǎo jiù xǐhuān hōngbèi. Kànzhe yī duī língsǎn de shícái ànzhào bǐlì rónghé zài yīqǐ, jiù néng zài hōngkǎo de guòchéng zhōng yīdiǎndiǎn péngzhàng, dìngxíng, biàn chéng xiāngpēnpēn de yàngzi, shì bù shì hěn shénqí? Duì le, yǒu jīhuì yīqǐ lái kǎo jiāngbǐng ba? Bǐ bǐ kàn shuí néng yòng bǐnggān dā chū zuì gāo zuì piàoliang de xiǎowū!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/娜维娅的爱好….mp3',
                },
                {
                    title: '娜维娅的烦恼…',
                    text: '呃，烤完蛋糕以后散落的面粉好难收拾啊，还有粘在容器里的蛋清和奶油…我、我去叫帮手来！',
                    reading: 'E, kǎo wán dàngāo yǐhòu sànluò de miànfěn hǎo nán shōushí a, hái yǒu zhān zài róngqì lǐ de dànqīng hé nǎiyóu… Wǒ, wǒ qù jiào bāngshǒu lái!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/娜维娅的烦恼….mp3',
                },
                {
                    title: '喜欢的食物…',
                    text: '我喜欢能带来惊喜的食物，但请不要怀疑我的味觉。我只是欣赏其中包含的创意，但这也不会改变很多菜品难吃的事实就是了。',
                    reading:
                        'Wǒ xǐhuān néng dài lái jīngxǐ de shíwù, dàn qǐng bù yào huáiyí wǒ de wèijué. Wǒ zhǐshì xīnshǎng qízhōng bāohán de chuàngyì, dàn zhè yě bù huì gǎibiàn hěnduō càipǐn nánchī de shìshí jiùshì le.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/喜欢的食物….mp3',
                },
                {
                    title: '讨厌的食物…',
                    text: '我不喜欢存放了很久的剩菜，感觉辜负了新鲜食材的一生…',
                    reading: 'Wǒ bù xǐhuān cúnfàng le hěnjiǔ de shèngcài, gǎnjué gūfù le xīnxiān shícái de yīshēng…',
                    audio: 'assets/character/voice_overs/Navia/story/zh/讨厌的食物….mp3',
                },
                {
                    title: '收到赠礼·其一',
                    text: '惊人的厨艺！跟你出门的话，我才是应该带着食材和厨具的那个。',
                    reading: 'Jīngrén de chúyì! Gēn nǐ chūmén de huà, wǒ cái shì yīnggāi dài zhe shícái hé chújù de nàgè.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/收到赠礼·其一.mp3',
                },
                {
                    title: '收到赠礼·其二',
                    text: '味道真不错，再让我加些摆盘艺术就更完美了。',
                    reading: 'Wèidào zhēn bùcuò, zài ràng wǒ jiā xiē bǎipán yìshù jiù gèng wánměi le.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/收到赠礼·其二.mp3',
                },
                {
                    title: '收到赠礼·其三',
                    text: '不要气馁，世界需要这种创新精神。',
                    reading: 'Bù yào qìněi, shìjiè xūyào zhè zhǒng chuàngxīn jīngshén.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/收到赠礼·其三.mp3',
                },
                {
                    title: '生日…',
                    text: '你相信许愿吗？向泉水中丢一枚摩拉，然后等待好运降临在头上。我想，只要摩拉丢得够多，其中总有一个愿望能够实现吧？所以与其寄希望于这样的随机事件，我决定直接用一袋摩拉为你实现今天的愿望。只要是我娜维娅力所能及的，一定都帮你办到！',
                    reading:
                        'Nǐ xiāngxìn xǔyuàn ma? Xiàng quánshuǐ zhōng diū yī méi Mólā, ránhòu děngdài hǎoyùn jiànglín zài tóushàng. Wǒ xiǎng, zhǐyào Mó Lā diū de gòu duō, qízhōng zǒng yǒu yī gè yuànwàng nénggòu shíxiàn ba? Suǒyǐ yǔqí jì xīwàng yú zhèyàng de suíjī shìjiàn, wǒ juédìng zhíjiē yòng yī dài Mólā wèi nǐ shíxiàn jīntiān de yuànwàng. Zhǐyào shì wǒ Nuòwéiyà lì suǒ néng jí de, yīdìng dōu bāng nǐ bàndào!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/生日….mp3',
                },
                {
                    title: '突破的感受·起',
                    text: '这种感觉…好像柠檬乳酪蛋糕！',
                    reading: 'Zhè zhǒng gǎnjué… hǎoxiàng níngméng rǔluò dàngāo!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/突破的感受·起.mp3',
                },
                {
                    title: '突破的感受·承',
                    text: '奶油融化在舌尖，压力也跟着消散了。',
                    reading: 'Nǎiyóu rónghuà zài shéjiān, yālì yě gēnzhe xiāosàn le.',
                    audio: 'assets/character/voice_overs/Navia/story/zh/突破的感受·承.mp3',
                },
                {
                    title: '突破的感受·转',
                    text: '你知道有一种子弹形状的巧克力糖吗？它的甜度能瞬间让你全身充满力量，就像我现在的感受一样！',
                    reading: 'Nǐ zhīdào yǒu yī zhǒng zǐdàn xíngzhuàng de qiǎokèlì táng ma? Tā de tiándù néng shùnjiān ràng nǐ quánshēn chōngmǎn lìliàng, jiù xiàng wǒ xiànzài de gǎnshòu yīyàng!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/突破的感受·转.mp3',
                },
                {
                    title: '突破的感受·合',
                    text: '最后再来一壶熨帖的奶茶，属于你我的茶歇时间就可以开始了。不过你为我做了这么多，用一顿茶点作为感谢还是不太够呀。以后你在枫丹要是有什么需要帮忙的，就来找刺玫会吧！',
                    reading:
                        'Zuìhòu zài lái yī hú yùntiē de nǎichá, shǔyú nǐ wǒ de cháxiē shíjiān jiù kěyǐ kāishǐ le. Bùguò nǐ wèi wǒ zuò le zhème duō, yòng yī dùn chádiǎn zuòwéi gǎnxiè hái shì bù tài gòu ya. Yǐhòu nǐ zài Fēngdān yàoshi yǒu shénme xūyào bāngmáng de, jiù lái zhǎo Cìmèihuì ba!',
                    audio: 'assets/character/voice_overs/Navia/story/zh/突破的感受·合.mp3',
                },
            ],
            ja: [
                {
                    title: '初めまして…',
                    text: 'かの有名な「棘薔薇の会」の現会長であり、リーダーで、司令塔で、取締役で、ボスのナヴィアよ。あんたに出会えたこと…本当に嬉しく思ってる！あんたって、才能も容姿も申し分ないうえに、オーラもあるでしょ。見てると、何だか予感がしてくるんだよね。あたしたちの縁は、さっきの肩書きくらい長くなりそうって予感がさ。',
                    reading:
                        'Kano yuumei-na "Supina Di Roosura" no genkaichou de ari, riidaa de, shireitou de, torishimariyaku de, bosu no Navia yo. Anta ni deaeta koto... Hontou ni ureshiku omotteru! Anta tte, sainou mo youshi mo moushibun-na iue ni, oora mo aru desho. Miteru to, nandaka yokan ga shite kuru nda yo ne. Atashi-tachi no en wa, sakki no katagaki kurai nagaku narisou tte yokan ga sa.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/初めまして….mp3',
                },
                {
                    title: '世間話·旅行',
                    text: 'あ～、旅行に行きたい——！どこに行くかなんてどうでもよくて、ただ友達と遊びたいだけなんだけどね、えへへ。',
                    reading: 'A~, ryokou ni ikitai⸺! Doko ni iku ka nante dou de mo yokute, tada tomodachi to asobitai dake nanda kedo ne, ehehe.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/世間話·旅行.mp3',
                },
                {
                    title: '世間話·経験談',
                    text: '長年ギャングをやって来た経験から言わせてもらうと——使い慣れない武器を手元に置いとくのって、丸腰でいるより遥かに危険なの。',
                    reading: 'Naganen gyangu wo yatte kita keiken kara iwasete morau to⸺ Tsukainarenai buki wo temoto ni oi to kunotte, marugoshi de iru yori haruka ni kiken na no.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/世間話·経験談.mp3',
                },
                {
                    title: '世間話·ロゴマーク',
                    text: '棘薔薇の会のロゴマークはママがデザインしたんだよ。あたし、すごく気に入ってるの。ほら、まるで心臓みたいな形でしょ。',
                    reading: 'Supina Di Roosura no rogo maaku wa mama ga dezain shita nda yo. Atashi, sugoku ki ni itteru no. Hora, maru de shinzou mitai-na katachi desho.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/世間話·ロゴマーク.mp3',
                },
                {
                    title: '雨の日…',
                    text: 'あ～あ…また雨か…',
                    reading: 'A~a... Mata ame ka...',
                    audio: 'assets/character/voice_overs/Navia/story/ja/雨の日….mp3',
                },
                {
                    title: '雷の日…',
                    text: 'ひゃっ…！さっき光るのが見えた瞬間、耳をふさげばよかった…！',
                    reading: "Hya'...! Sakki hikaru no ga mieta shunkan, mimi wo fusageba yokatta...!",
                    audio: 'assets/character/voice_overs/Navia/story/ja/雷の日….mp3',
                },
                {
                    title: '雪の日…',
                    text: '帽子を外して、雪が頬に落ちてくる感触を感じたほうがいいかも？きっとさっぱりするでしょ。',
                    reading: 'Boushi wo hazushite, yuki ga hoho ni ochite kuru kanshoku wo kanjita hou ga ii ka mo? Kitto sappari suru desho.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/雪の日….mp3',
                },
                {
                    title: '晴れの日…',
                    text: 'ねえねえほらほら！見て！上！空のお日様が、炎みたいに明るいでしょ！これが何を意味してるか分かる？そう…今すぐ一緒に一番大きいサイズのウルトラアイスクリームを買ってきて、どっちが溶ける前に食べ切れるか勝負するの！',
                    reading:
                        'Nee nee hora hora! Mite! Ue! Sora no ohi-sama, honoo mitai ni akarui desho! Kore ga nani wo imi shiteru ka wakaru?Sou... Ima sugu issho ni ichiban ookii saizu no urutora aisukuriimu wo katte kite, docchi ga tokeru mae ni tabekireru ga shoubu suru no!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/晴れの日….mp3',
                },
                {
                    title: '雨上がり…',
                    text: 'やった！雨が止んだ！',
                    reading: 'Yatta! Ame ga yanda!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/雨上がり….mp3',
                },
                {
                    title: '暴風の日…',
                    text: 'もう、帽子とスカート…どっちを抑えたらいいの！',
                    reading: 'Mou, boushi to sukaato... Docchi wo osaetara ii no!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/暴風の日….mp3',
                },
                {
                    title: '砂漠にいる時…',
                    text: 'サングラスがあれば、砂粒が目に入るのを心配しなくて済む！でも、日が暮れると前が見えなくなるんだよね…',
                    reading: 'Sangurasu ga areba, sunatsubu ga me ni hairu no wo shinpai shinakute sumu! Demo, hi ga kureru to mae ga mienaku naru nda yo ne...',
                    audio: 'assets/character/voice_overs/Navia/story/ja/砂漠にいる時….mp3',
                },
                {
                    title: 'おはよう…',
                    text: 'おっはよー！今日の予定は決まった？まだなら、あたしと一緒にいない？',
                    reading: 'Ohhayoo! Kyou no yotei wa kimatta? Mada nara, atashi to issho ni inai?',
                    audio: 'assets/character/voice_overs/Navia/story/ja/おはよう….mp3',
                },
                {
                    title: 'こんにちは…',
                    text: '最近、新しい味のラザニアが売れてるみたいだけど、あんたは興味ある？まずいんじゃないかなって気もするけど、やっぱり試してみたくって！',
                    reading: 'Saikin, atarashii aji no razania ga ureteru mitai dakedo, anta wa kyoumi aru? Mazui nja nai kanatte ki mo suru kedo, yappari tameshite mitaku tte!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/こんにちは….mp3',
                },
                {
                    title: 'こんばんは…',
                    text: '夜のニュースをお伝えいたします。本日も、「棘薔薇の会」会長は相棒と最高の一日を過ごしました。——やったね！',
                    reading: 'Yoru no nyuusu wo otsutae itashimasu. Honjitsu mo, "Supina Di Roosura" kaichou wa aibou to saikou no ichinichi wo sugoshimashita. ⸺Yatta ne!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/こんばんは….mp3',
                },
                {
                    title: 'おやすみ…',
                    text: 'よし、じゃあ頭を空っぽにして…よく眠れますように！また明日ね～',
                    reading: 'Yoshi, jaa atama wo karappo ni shite... Yoku nemuremasu you ni! Mata ashita ne~',
                    audio: 'assets/character/voice_overs/Navia/story/ja/おやすみ….mp3',
                },
                {
                    title: 'ナヴィア自身について·楽観的',
                    text: '盲目的な楽観はダメよ。幸せな人生は、自分の手で勝ち取るの！だからほら、あたしの両手を握って。そうそう、んで、左右に揺らしてみて——どう？楽しいでしょ？',
                    reading:
                        'Moumokuteki-na rakkan wa dame yo. Shiawase-na jinsei wa, jibun no te de kachitoru no! Dakara hora, atashi no ryoute wo nigitte. Sousou, nde, sayuu ni yurashite mite⸺ Dou? Tanoshii desho?',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ナヴィア自身について·楽観的.mp3',
                },
                {
                    title: 'ナヴィア自身について·運',
                    text: '過去を知ってる人からしたら、あたしって運が悪いって思われちゃうかもね。でも、あたしはそうは思ってないよ。だって、あれほど沢山の愛をもらえたんだもん。それって人生で一番幸せなことに違いないよ。',
                    reading:
                        'Kako wo shitteru hito kara shitara, atashi tte un ga warui tte omowarechau ka mo ne. Demo, atashi wa sou wa omottenai yo.Datte, are hodo takusan no ai wo moraeta nda mon. Sorette jinsei de ichiban shiawase-na koto ni chigai nai yo.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ナヴィア自身について·運.mp3',
                },
                {
                    title: '相棒について…',
                    text: 'ボスって呼ばれることもあれば、お嬢様って呼ばれることもある。あたしはどっちでも気にしないけどね。でも、一番嬉しいのはやっぱり、あんたが「相棒」って呼んでくれることよ。だからもっともっと呼んで、あたしの虚栄心を満たしてね？',
                    reading:
                        'Bosu tte yobareru koto mo areba, ojou-sama tte yobarery koto mo aru. Atashi wa docchi de mo ki ni shinai kedo ne. Demo, ichiban ureshii no wa yappari, anta ga "aibou" tte yonde kureru koto yo. Dakara motto motto yonde, atashi no kyoeishin wo mita shite ne?',
                    audio: 'assets/character/voice_overs/Navia/story/ja/相棒について….mp3',
                },
                {
                    title: '秘密保持について…',
                    text: '秘密は口に出してしまえば秘密じゃなくなるって言う人もいるけど、友達とシェアできる秘密のほうがもっと貴重だと思わない？…いやいや、別に脅かしてるわけじゃないってば！棘薔薇の会の会長として、人に秘密を守ってもらう方法ならいっぱい知ってるけど…あんたに使ったりしないから安心して。',
                    reading:
                        'Himitsu wa kuchi ni dashite shimaeba himitsu ja naku naru tte iu hito mo iru kedo, tomodachi to shea dekiru himitsu no hou ga motto kichou da to omowanai?...Iya iya, betsu ni odokashiteru wake ja nai tteba! Supina Di Roosura no kaichou to shite, hito ni himitsu wo mamotte morau houhou nara ippai shitteru kedo... Anta ni tsukattari shinai kara anshin shite.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/秘密保持について….mp3',
                },
                {
                    title: '「神の目」について…',
                    text: 'ほら、これがあたしの神の目！キラキラしてて、この服にもぴったりでしょ？でも、やっぱあんたのすごさには適わないわね。あんたって、神の目なしでも色んな元素力が使えるでしょ。あれって練習でどうにかなるもんじゃないよね？',
                    reading:
                        'Hora, kore ga atashi no Kami no Me! Kirakira shitete, kono fuku ni mo pittari desho?Demo, yappa anta no sugosa ni wa kanawanai wa ne. Anta tte, Kami no Me nashi de mo ironna gensoryoku ga tsukaeru desho. Are tte renshuu de dou ni kanaru mo nja nai yo ne?',
                    audio: 'assets/character/voice_overs/Navia/story/ja/「神の目」について….mp3',
                },
                {
                    title: 'シェアしたいこと·ワンちゃん',
                    text: '全部の犬種の中だったら…あたしは栃栗ハウンドが一番好きかな。ほら、目の上にある模様が、眉毛に見えるでしょ？いつも大人しくて真面目そうな顔だなあって思うんだよね。あ、でもこれについては内緒よ。他のワンちゃんには絶対に教えないでね！',
                    reading:
                        'Zenbu no kenshu no naka dattara... Atashi wa tochikuri haundo ga ichiban suki ka na. Hora, me no ue ni aru moyou ga, mayuge ni mieru desho? Itsumo otona shikute majime sou-na kao da na atte omou nda yo ne.A, demo kore ni tsuite wa naisho yo. Hoka no wan-chan ni wa zettai ni oshienaide ne!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/シェアしたいこと·ワンちゃん.mp3',
                },
                {
                    title: 'シェアしたいこと·頼もしい棘薔薇の会',
                    text: 'サーンドル河に行ったことがあるなら、フォンテーヌにはギャングが他にも色々いるって分かるはずよ。彼らの目的はそれぞれ違うし、みんながみんな棘薔薇の会みたいに親切なわけじゃないから、そこは気を付けてね。必要なら、バーテンダーのテトローさんに助けを求めて。もし友好的にお話ができないような相手に出会ったら…そうね、その時は頼もしい白手袋さんのお出ましよ。',
                    reading:
                        'Saandoru-gawa ni itta koto ga aru nara, Fonteenu ni wa gyangu ga hoka ni mo iroiro iru tte wakaru hazu yo. Karera no mokuteki wa sorezore chigaushi, minna ga minna Supina Di Roosura mitai ni shinsetsu-na wake ja nai kara, soko wa ki wo tsukete ne. Hitsuyou nara, baatendaa no Tetoroo-san ni tasuke wo mitomete. Moshi yuukouteki ni ohanashi ga dekinai you-na aite ni daeattara... Sou ne, sono toki wa tanomoshii Shirotebukuro-san no odemashiyo.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/シェアしたいこと·頼もしい棘薔薇の会.mp3',
                },
                {
                    title: '興味のあること…',
                    text: 'プリュイロータスって色が綺麗だよね。しかもあの花が咲くのは、長い雨季がやっと終わったってサインなの。',
                    reading: 'Puryui Rootasu tte iro ga kirei da yo ne. Shika mo ano hana ga saku no wa, nagai uki ga yatto owatta tte sain na no.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/興味のあること….mp3',
                },
                {
                    title: 'クロリンデについて…',
                    text: '普段は無口で、表情も少ないけど、喜怒哀楽くらいは分かるのよ。前は、パパのこともあったし、その…わだかまりがちょっとあって。でもあの頃は、あのやけに気を遣ってる接し方が気に入らなかったんだよね…やっぱり、今のほうがいいと思う。',
                    reading:
                        'Fudan wa mukuchi de, hyoujou mo sukunai kedo, kido airaku kurai wa wakaru no yo. Mae wa, papa no koto mo attashi, sono... wadakamari ga chotto atte. Demo ano koro wa, ano yake ni ki wo tsukatteru sesshikata ga ki ni iranakatta nda yo ne... Yappari, ima no hou ga ii to omou.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/クロリンデについて….mp3',
                },
                {
                    title: 'シャルロットについて…',
                    text: 'ニュースを追いかけてるときの熱意とスピード感よりも感心しちゃうのが、シャルロットの撮影スキルよ。この前、他の用事のついでにポートレートを撮ってもらったんだけど、光の写り具合がまるで丹念に描かれた油絵みたいでね。思いがけない記事を書けるだけじゃなくて、パッと目を惹く最高の写真まで撮れるなんて、まさに記者をやるために生まれてきたって感じ。',
                    reading:
                        "Nyuusu wo oikaketeru toki no netsui to supiido kan yori mo kanshin shichau no ga, Sharurotto no satsuei sukiru yo. Kono mae, hoka no youji no tsuide ni pootoreeto wo totte moratta nda kedo, hikari no utsuri guai ga maru de tannen ni egakareta aburae mitai de ne. Omoi ga kenai kiji wo kakeru dake ja nakute, pa' to me wo hiku saikou no shashin made toreru nante, masa ni kisha wo yaru tame ni umarete kita tte kanji.",
                    audio: 'assets/character/voice_overs/Navia/story/ja/シャルロットについて….mp3',
                },
                {
                    title: '千織について…',
                    text: '彼女はフォンテーヌのファッション界に異国の風をもたらしたファッションデザイナーなんだけど、裏で棘薔薇の会のこともかなり助けてくれたの。あたしの斬新な発想にかなりのインスピレーションをもらった、って言ってくれたこともあるんだから。あたしの彼女への理解からすると、あれはお世辞なんかじゃなかったはず。でも、十メートルもあるシルクハットを作ってって頼んだときは、きっぱり断られちゃったんだよね。はぁ…お店の前に飾ったらすごく目立つ宣伝になると思ったのに！',
                    reading:
                        'Kanojo wa Fonteenu no fasshon-kai ni ikoku no kaze wo motarashita fasshon dezainaa nandakedo, ura de Supina Di Roosura no koto mo kanari tasukete kureta no. Atashi no zanshin-na hassou ni kanari no insupireeshon wo moratta, tte itte kureta koto mo aru ndakara. Atashi no kanojo he no rikai kara suru to, are wa oseji nanka ja nakatta hazu. Demo, juu-meetoru mo aru shiruku hatto wo tsukutte tte tanonda toki wa, kippari kotowararechatta nda yo ne. Haa... Omise no mae ni kazattara sugoku medatsu senden ni naru to omotta no ni!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/千織について….mp3',
                },
                {
                    title: 'フリーナについて…',
                    text: '子供の頃、一度だけフリーナ様が出演したチャリティー公演の歌劇を観る機会に恵まれたの。ほんとに人気で、当時はチケットを手に入れるのがすごく大変だったのよ！あの時、他の人物を演じてるはずなのに、彼女の振る舞いはかえって、いつもの高いところからの演説よりも自然な感じがした…今思えば、あれは錯覚なんかじゃなかったのね。',
                    reading:
                        'Kodomo no koro, ichido dake Furiina-sama ga shutsuen shita charitii kouen no kageki wo miru kikai ni megumareta no. Honto ni ninki de, touji wa chiketto wo te ni ireru no ga sugoku taihen datta no yo! Ano toki, hoka no jinbutsu wo enjiteru hazu na no ni, kanojo no furu mai wa kaette, itsumo no takai tokoro kara no enzetsu yori mo shizen-na kanji ga shita... Ima omoeba, are wa sakkaku nanka ja nakatta no ne.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/フリーナについて….mp3',
                },
                {
                    title: 'ヌヴィレットについて…',
                    text: 'ヌヴィレットさんね。複雑だけど簡単。何ていうか…海にある岩礁みたいに、一見通りにくい道なんだけど、パターンさえ把握できたら、まったく観測できないわけでもないって感じかな。',
                    reading:
                        'Nuviretto-san ne. Fukuzatsu dakedo kantan. Nante iu ka... Umi ni aru ganshou mitai ni, ikken toori nikui michi nandakedo, pataan sae haaku dekitara, mattaku kansoku dekinai wake de mo nai tte kanji ka na.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ヌヴィレットについて….mp3',
                },
                {
                    title: 'リオセスリについて…',
                    text: 'あの人とまともに会話しようと思ったら、かなり大変よ。クロリンデが言うには、何らかの契約を結んでる前提なら安心して一緒に仕事してもいいけど、あの人の言葉は絶対に一言も信じちゃいけないんだって。確かに考えてみたら、パパも水の下のことには一度も関与しなかったもんね。念のため、やっぱ今まで通りで行きましょ。',
                    reading:
                        "Ano hito to mato mo ni kaiwa shiyou to omottara, kanari taihen yo. Kurorinde ga iu ni wa, nanraka no keiyaku wo musunderu zentei nara anshin shite issho ni shigoto shite mo ii kedo, ano hito no kotoba wa zettai ni hitokoto mo shinjicha ikenai ndatte. Tashika ni kangaete mitara, papa mo mizu no shita no koto ni wa ichido mo kan'yo shinakatta mon ne. Nen no tame, yappa ima made toori de ikimasho.",
                    audio: 'assets/character/voice_overs/Navia/story/ja/リオセスリについて….mp3',
                },
                {
                    title: '「召使」について…',
                    text: '彼女は威厳ある優しいリーダーよ。「一家の主」って風格を感じるよね。でも、ファデュイの執行官まで上り詰めた人なわけだから、きっとそれなりに非情な一面もあると思う…だから安心して。ポワソン町を助けてくれたご恩は永遠に胸に刻んでおくけど、他の場面ではちゃんと用心しておくつもり。',
                    reading:
                        'Kanojo wa igen aru yasashii riidaa yo. "Ikka no Aruji" tte fuukaku wo kanjiru yo ne. Demo, Fadyui no Shikkoukan made noboritsumeta hito nawake dakara, kitto sore nari hijou-na ichimen mo aru to omou...Dakara anshin shite. Powason-chou wo tasukete kureta goon wa eien ni mune ni kizande oku kedo, hoka no bamen de wa chanto youjiin shite oku tsumori.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/「召使」について….mp3',
                },
                {
                    title: 'リネとリネットについて…',
                    text: '大魔術師の言葉遣いがちょっと大げさだってのは知ってるよ。でも、周りの親友たちに対して、リネが真摯な気持ちで接してるってことも分かるんだ。たまに、あの年齢に似合わないくらい強い責任感が表情から垣間見えるしね…あっ、そうだ。この前、リネが無料でポワソン町の子供たちにマジックを見せてくれたの！今度機会があったら、マカロンを食べに来てってリネとリネットを誘ってみよっと。リネットってよくマジックでカップを出してお茶を飲んでるし、デザートだって嫌いなはずないよね？',
                    reading:
                        "Daimajutsushi no kotobadzukai ga chotto oogesa datte no wa shitteru yo. Demo, mawari no shin'yuu-tachi ni taishite, Rine ga shinshi-na kimochi de sesshiteru tte koto mo wakaru nda. Tama ni, ano nenrei ni niawanai kurei tsuyoi sekininkan ga hyoujou kara kaima mierushi ne...A', sou da. Kono mae, Rine ga muryou de Powason-chou no kodomo-tachi ni majikku wo misete kureta no! Kondo kikai ga attara, makaron wo tabe ni kite tte Rine to Rinetto wo sasotte miyo tto. Rinetto tte yoku majikku de kappu wo dashite ocha wo nonderushi, dezaato datte kirai-na hazu nai yo ne?",
                    audio: 'assets/character/voice_overs/Navia/story/ja/リネとリネットについて….mp3',
                },
                {
                    title: 'エスコフィエについて…',
                    text: '親友のエスコフィエがやっと籠ることをやめてくれたの。この間までドゥボールケーキを超える新作を開発するって言って、ずっと厨房に引きこもっていたのよ。このままだと、目が光を受け付けなくなるんじゃないかって気が気じゃなかったんだから。ねぇ、エスコフィエを誘ってみんなでピクニックに行かない？パラソルとサングラスも選んでもらってさ。エスコフィエと出かけると、ピクニックが美食の旅になるのよ。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/story/ja/エスコフィエについて….mp3',
                },
                {
                    title: 'ナヴィアを知る·1',
                    text: '棘薔薇の会の仕事？まあ、「何でもござれ」ってとこかな。でもどれも、みんなの面倒事を色々と解決するためにやってることなの。あっ、「面倒事」っていうのはトラブルそのものを指したんであって、解決が面倒だなんて思ってないからね。むしろ、みんなの力になれるのって気分爽快よ。',
                    reading:
                        'Supina di Roosura no shigoto? Maa, "nan de mo gozare" tte tokoka na. Demo dore mo, minna no mendougoto wo iroiro to kaiketsu suru tame ni yatteru koto na no. A\', "mendougoto" tte iu no wa toraburu sono mono wo sashita nde atte, kaiketsu ga mendou da nante omotte nai kara ne. Mushiro, minna no chikara nareru no tte kibun soukai yo.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ナヴィアを知る·1.mp3',
                },
                {
                    title: 'ナヴィアを知る·2',
                    text: '人間、やっぱロマンを解する心がないとね。春の花、夏の海、それに友達の笑顔。どれも見逃せない景色なんだから。',
                    reading: 'Ningen, yappa roman wo kaisuru kokoro ga nai to ne. Haru no hana, natsu no umi, sore ni tomodachi no egao. Dore mo minogasenai keshiki nan dakara.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ナヴィアを知る·2.mp3',
                },
                {
                    title: 'ナヴィアを知る·3',
                    text: '時々、誰もいない野外に行って、並べた物をターゲットに射撃練習したりするの。すっごくストレス発散になるから、試してみない？手取り足取り教えてあげる。生徒一号ってことになるけど、あたし、いい先生になれる自信があるよ。だってパパとブラッカリおばあちゃんが教えてくれたこと、全部覚えてるもん！',
                    reading:
                        'Tokidoki, dare mo inai yagai ni itte, narabeta mono wo taagetto ni shageki renshuu shitari suru no.Suggoku sutoresu hassan ni naru kara, tameshite minai? Tetori ashitori oshiete ageru. Seito ichigou tte koto ni naru kedo, atashi, ii sensei ni nareru jishin ga aru yo. Datte papa to Burakkari obaa-chan ga oshiete kureta koto, zenbu oboeteru mon!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ナヴィアを知る·3.mp3',
                },
                {
                    title: 'ナヴィアを知る·4',
                    text: 'あたしはパパみたいにはならないよ。棘薔薇の会に昔からいる幹部の中には、あたしがますますパパに似てきてるって思ってる人もいるみたいだけど、それって単なるちょっとした傾向だと思うんだよね。だって一部の問題を解決するには、限られた方法の中から選ぶしかないから。棘薔薇の会は、もう昔とは違う。だから会長だっておんなじなはずないのよ。',
                    reading:
                        'Atashi wa papa mitai ni naranai yo. Supina di Roosura ni mukashi kara iru kanbu no naka ni wa, atashi ga masumasu papa ni nite kiteru tte omotteru hito mo iru mitai dakedo, sore tte tan naru chotto shita keikou da to omou nda yo ne. Datte ichibu no mondai wo kaiketsu suru ni wa, kagirareta houhou no naka kara erabu shika nai kara. Supina di Roosura wa, mou mukashi to wa chigau. Dakara kaichou datte onnajina hazu nai no yo.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ナヴィアを知る·4.mp3',
                },
                {
                    title: 'ナヴィアを知る·5',
                    text: 'ママと同じような人になることもないと思う。性格が似てるってよく言われるし、ママが採った色んな選択の理由も大体思いつくけど、でもやっぱり…はぁ、急にクレメンタイン線に乗りたくなっちゃった。今から行こうよ、付き合ってくれる？別にこれといった目的はないよ。フォンテーヌ廷の街を一緒にぶらぶらしようっていうお誘い…ってことならいい？',
                    reading:
                        'Mama to onaji you-na hito ni naru koto mo nai to omou. Seikaku ga niteru tte yoku iwarerushi, mama ga totta ironna sentaku no riyuu mo daitai omoitsuku kedo, demo yappari...Haa, kyuu ni Kurementain-sen ni noritaku nacchatta. Ima kara ikou yo, tsukiatte kureru? Betsu ni kore to itta mokuteki wa nai yo. Fonteenu-tei no machi wo issho ni burabura shiyou tte iu osasoi... tte koto nara ii?',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ナヴィアを知る·5.mp3',
                },
                {
                    title: 'ナヴィアの趣味…',
                    text: '小さい頃からお菓子作りが好きだったの。バラバラの食材を決まった割合で混ぜて焼くと、少しずつ膨らんで形を成して、香ばしくなる…すごく不思議でしょ？そうだ、機会があったら一緒にジンジャーブレッドを焼いてみない？どっちがより高さのある綺麗なヘクセンハウスを作れるか勝負しましょ！',
                    reading:
                        'Chiisai koro kara okashidzukuri ga suki datta no. Barabara no shokuzai wo kimatta wariai de mazete yaku to, sukoshizutsu fukurande katachi wo nashite, koubashiku naru... Sugoku fushigi desho?Sou da, kikai ga attara issho ni jinjaabureddo wo yaite minai? Docchi ga yori takasa no aru kirei-na hekusenhausu wo tsukureru ka shoubu shimasho!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ナヴィアの趣味….mp3',
                },
                {
                    title: 'ナヴィアの悩み…',
                    text: 'うぅ…ケーキを焼いた後、あちこちに散らばってる小麦粉を片付けるのって、すごく大変なんだよね。それに、容器の中にくっついてる卵白とクリームも…す、すぐ助っ人を呼んで来るから待ってて！',
                    reading:
                        'Uu... Keeki wo yaita ato, achikochi ni chirabatteru komugiko wo katadzukeru no tte, sugoku taihen nanda yo ne. Sore ni, youki no naka ni kuttsu iteru ranpaku to kuriimu mo... Su, sugu suketto wo yonde kuru kara mattete!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/ナヴィアの悩み….mp3',
                },
                {
                    title: '好きな食べ物…',
                    text: 'サプライズをくれる食べ物が好きよ。あっ、でも味覚は疑わないでね。ただ、その中に込められてる創造的なアイデアが気に入ってるだけ。まあ、そういう食べ物の大半が不味いって事実は変わらないけどね。',
                    reading:
                        "Sapuraizu wo kureru tabemono ga suki yo. A', demo mikaku wa utagawanaide ne. Tada, sono naka ni komerareteru souzouteki-na aidea ga ki ni itteru dake. Maa, sou iu tabemono no taihan ga fumazui tte jijitsu wa kawaranai kedo ne.",
                    audio: 'assets/character/voice_overs/Navia/story/ja/好きな食べ物….mp3',
                },
                {
                    title: '嫌いな食べ物…',
                    text: 'ずっと保存されてる食べ残しは苦手かな。何だか、新鮮な食材の一生を無駄にされた気分になるんだもん…',
                    reading: 'Zutto hozon sareteru tabenokoshi wa nigate ka na. Nanda ka, shinsen-na shokuzai no isshou wo muda ni sareta kibun ni naru nda mon...',
                    audio: 'assets/character/voice_overs/Navia/story/ja/嫌いな食べ物….mp3',
                },
                {
                    title: '贈り物を受け取る·1',
                    text: 'すっごい腕ね！あんたと一緒にお出かけするなら、食材とか調理器具を運ぶ係に徹するべきなのはあたしのほうかも。',
                    reading: 'Suggoi ude ne! Anta to issho ni odekake suru nara, shokuzai to ka chouri kigu wo hakobu kakari ni tessuru beki na no wa atashi no hou ka mo.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/贈り物を受け取る·1.mp3',
                },
                {
                    title: '贈り物を受け取る·2',
                    text: 'なかなか美味しいじゃない。あたしの芸術的盛り付けセンスが加わったら、もっと完璧になるはずよ。',
                    reading: 'Nakanaka oishii ja nai. Atashi no geijutsuteki moritsuke sensu ga kuwawattara, motto kanbeki ni naru hazu yo.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/贈り物を受け取る·2.mp3',
                },
                {
                    title: '贈り物を受け取る·3',
                    text: '気を落とさないで。世界にはこういう、大胆に創造する精神だって必要なんだから。',
                    reading: 'Ki wo otosanaide. Sekai ni wa kou iu, daitan ni souzou suru seishin datte hitsuyou nan dakara.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/贈り物を受け取る·3.mp3',
                },
                {
                    title: '誕生日…',
                    text: '願いの叶うおまじないって信じる？泉の中にモラを一枚投げて、好運が降りかかるのを待つってやつ。思うんだけどさ、あれって投げたモラの数さえ十分あれば、そのうちいくつかは実現できることなんじゃない？だから、そんなランダムなイベントに運を任せるより、一袋のモラであんたの今日の願いを叶えてあげようと思うの。このナヴィアの力が及ぶ範囲でなら、何でも叶えてあげる！',
                    reading:
                        "Negai no kanau omajinai tte shinjiru? Izumi no naka ni mora wo ichimai nagete, kou'un ga furikakaru no wo matsu tte yatsu. Omou ndakedo sa, are tte nageta mora no kazu sae juubun areba, sono uchi ikutsuka wa jitsugen dekiru koto nan ja nai?Dakara, sonna randamu-na ibento ni un wo makaseru yori, hitofukuro no mora de anta no kyou no negai wo kanaete ageyou to omou no. Kono Navia no chikara ga oyobu han'i de nara, nan de mo kanaete ageru!",
                    audio: 'assets/character/voice_overs/Navia/story/ja/誕生日….mp3',
                },
                {
                    title: '突破した感想·起',
                    text: 'この気分…まるでレモンチーズケーキみたい！',
                    reading: 'Kono kibun... Maru de remon chiizukeeki mitai!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/突破した感想·起.mp3',
                },
                {
                    title: '突破した感想·承',
                    text: 'クリームが舌に溶けるのと一緒に、ストレスも消えてっちゃった。',
                    reading: 'Kuriimu ga shita ni tokeru no to issho ni, sutoresu mo kietecchatta.',
                    audio: 'assets/character/voice_overs/Navia/story/ja/突破した感想·承.mp3',
                },
                {
                    title: '突破した感想·転',
                    text: '弾丸の形をしたチョコレートキャンディがあるって知ってる？全身から力がみなぎってくる甘さなの！あたしの今の気分とおんなじ！',
                    reading: 'Tama no katachi wo shita chokoreeto kuandi ga aru tte shitteru? Zenshin kara chikara ga minagitte kuru amasa na no! Atashi no ima no kibun to onnaji!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/突破した感想·転.mp3',
                },
                {
                    title: '突破した感想·結',
                    text: '仕上げにほっとするミルクティーを用意できたら、あたしとあんただけのティータイムを過ごせるね。でも、これだけやってくれたのに、感謝の気持ちがお茶とデザートだけっていうのは、やっぱ不十分だと思う。今後フォンテーヌで何か助けが必要になったら、遠慮なく棘薔薇の会に来て！',
                    reading:
                        'Shiage ni hotto suru miruku tii wo youi dekitara, atashi to anta dake no tiitaimu wo sugoseru ne. Demo, kore dake yatte kureta no ni, kansha no kimochi ga ocha to dezaato dake tte iu no wa, yappa fujuubun da to omou. Kongo Fonteenu de nani ka tasuke ga hitsuyou ni nattara, enryo naku Supina Di Roosura ni kite!',
                    audio: 'assets/character/voice_overs/Navia/story/ja/突破した感想·結.mp3',
                },
            ],
            ko: [
                {
                    title: '첫 만남…',
                    text: '난 명성이 자자한 가시 장미회의 현임 회장, 리더, 통솔자, 책임자, 그리고 보스인 나비아야. 만나서 반가워! 넌 외모도 재능도 출중하고, 기질이 범상치 않은 걸 보니, 우리의 인연이 내 호칭처럼 길 것 같다는 예감이 들어!',
                    reading:
                        "Nan myeongseong'i jajahan gasi jangmihoe'ui hyeonim hoejang, rideo, tongsolja, chaegimja, geurigo boseu'in nabiaya. Mannaseo ban'gawo! Neon oemodo jaeneungdo chuljunghago, gijiri beomsangchi aneun geol boni, uriui inyeoni nae hochingcheoreom gil geot gatdaneun yegami deureo!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/첫 만남….mp3',
                },
                {
                    title: '잡담·여행',
                    text: '여행 가고 싶다~ 친구들이랑 같이 놀 수만 있다면 어디든 좋아, 헤헤',
                    reading: "Yeohaeng gago sipda~ Chin'gudeurirang gachi nol suman itdamyeon eodideun joa, hehe",
                    audio: 'assets/character/voice_overs/Navia/story/ko/잡담·여행.mp3',
                },
                {
                    title: '잡담·경험담',
                    text: '몇 년 동안 조직에 몸담은 경험으로 볼 때, 자기한테 맞지 않는 무기를 쓰는 건 무기가 없는 것보다 더 위험한 일이야',
                    reading: "Myeot nyeon dong'an jojige momdameun gyeongheomeuro bol ttae, jagihante matji anneun mugireul sseuneun geon mugiga eomneun geotboda deo wiheomhan iriya",
                    audio: 'assets/character/voice_overs/Navia/story/ko/잡담·경험담.mp3',
                },
                {
                    title: '잡담·마크',
                    text: '가시 장미회의 마크는 어머니가 디자인하셨어. 봐, 꼭 심장처럼 생겨서 마음에 들어',
                    reading: "Gasi jangmihoe'ui makeuneun eomeoniga dijainhasyeosseo. Bwa, kkok simjangcheoreom saenggyeoseo ma'eume deureo",
                    audio: 'assets/character/voice_overs/Navia/story/ko/잡담·마크.mp3',
                },
                {
                    title: '비가 올 때…',
                    text: '아… 또 비네…',
                    reading: 'A... Tto bine...',
                    audio: 'assets/character/voice_overs/Navia/story/ko/비가 올 때….mp3',
                },
                {
                    title: '번개가 칠 때…',
                    text: '으앗! 방금 번개를 봤을 때 얼른 귀 막을걸!',
                    reading: "Euat! Banggeum beon'gaereul bwasseul ttae eolleun gwi mageulgeol!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/번개가 칠 때….mp3',
                },
                {
                    title: '눈이 올 때…',
                    text: '모자를 벗고 얼굴에 떨어지는 눈송이를 느껴볼까? 분명 엄청 시원할 거야',
                    reading: "Mojareul beotgo eolgure tteoreojineun nunsong'ireul neukkyeobolkka? Bunmyeong eomcheong siwonhal geoya",
                    audio: 'assets/character/voice_overs/Navia/story/ko/눈이 올 때….mp3',
                },
                {
                    title: '햇살이 좋을 때…',
                    text: '지금이야! 어서 고개를 들어봐! 불덩이처럼 뜨겁게 타오르는 태양이 보이지? 저게 뭘 의미하는지 알아?지금 당장 가장 큰 사이즈의 아이스크림을 사서 누가 가장 빨리 먹어 치우는지 시합하라는 계시라고!',
                    reading:
                        "Jigeumiya! Eoseo gogaereul deureobwa! Buldeong'icheoreom tteugeopge taoreuneun taeyang'i boiji? Jeoge mwol uimihaneunji ara?Jigeum dangjang gajang keun saijeuui aiseukeurimeul saseo nuga gajang ppalli meogeo chiuneunji sihapharaneun gyesirago!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/햇살이 좋을 때….mp3',
                },
                {
                    title: '비가 그친 후…',
                    text: '다행이다, 비가 그쳤어!',
                    reading: "Dahaeng'ida, biga geuchyeosseo!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/비가 그친 후….mp3',
                },
                {
                    title: '강풍이 불 때…',
                    text: '모자랑 드레스… 둘 다 포기할 수 없어!',
                    reading: 'Mojarang deureseu... Dul da pogihal su eopseo!',
                    audio: 'assets/character/voice_overs/Navia/story/ko/강풍이 불 때….mp3',
                },
                {
                    title: '사막에 있을 때…',
                    text: '선글라스를 쓰면 모래가 눈에 들어가는 걸 막을 수 있어! 날이 어두울 땐 앞이 좀 안 보이긴 하지만…',
                    reading: "Seon'geullaseureul sseumyeon moraega nune deureoganeun geol mageul su isseo! Nari eoduul ttaen api jom an boigin hajiman...",
                    audio: 'assets/character/voice_overs/Navia/story/ko/사막에 있을 때….mp3',
                },
                {
                    title: '아침 인사…',
                    text: '좋은 아침! 오늘 뭘 할지 생각해 뒀어? 아직 결정 못 했으면 나랑 같이 갈래?',
                    reading: 'Joeun achim! Oneul mwol halji saenggakhae dwosseo? Ajik gyeoljeong mot haesseumyeon narang gachi gallae?',
                    audio: 'assets/character/voice_overs/Navia/story/ko/아침 인사….mp3',
                },
                {
                    title: '점심 인사…',
                    text: '요즘 새로운 맛의 라자냐가 출시됐다던데, 관심 있어? 맛은 없을 것 같은데, 한번 시도해 보고 싶어!',
                    reading: 'Yojeum saeroun masui rajanyaga chulsidwaetdadeonde, gwansim isseo? Maseun eopseul geot gateunde, hanbeon sidohae bogo sipeo!',
                    audio: 'assets/character/voice_overs/Navia/story/ko/점심 인사….mp3',
                },
                {
                    title: '저녁 인사…',
                    text: '저녁 뉴스를 보도합니다. 「오늘도 가시 장미회 회장은 파트너와 함께 완벽한 하루를 보냈습니다」 아주 좋아!',
                    reading: 'Jeonyeok nyuseureul bodohamnida. "Oneuldo gasi jangmihoe hoejang\'eun pateuneowa hamkke wanbyeokhan harureul bonaetseumnida" Aju joa!',
                    audio: 'assets/character/voice_overs/Navia/story/ko/저녁 인사….mp3',
                },
                {
                    title: '굿나잇…',
                    text: '머리에 든 고민은 전부 비우고 얼른 푹 자! 그럼 내일 보자',
                    reading: 'Meorie deun gomineun jeonbu biugo eolleun puk ja! Geureom naeil boja',
                    audio: 'assets/character/voice_overs/Navia/story/ko/굿나잇….mp3',
                },
                {
                    title: '나비아 자신에 대해·낙천주의',
                    text: '맹목적인 낙천주의는 금물이야. 행복은 스스로 쟁취해야 하거든! 그러니까 여기, 내 두 손을 잡고 좌우로 흔들어 봐. 어때? 기분 좋아졌지?',
                    reading:
                        'Maengmokjeogin nakcheonjuuineun geummuriya. Haengbogeun seuseuro jaengchwihaeya hageodeun! Geureonikka yeogi, nae du soneul japgo jwauro heundeureo bwa. Eottae? Gibun joajyeotji?',
                    audio: 'assets/character/voice_overs/Navia/story/ko/나비아 자신에 대해·낙천주의.mp3',
                },
                {
                    title: '나비아 자신에 대해·운',
                    text: '내 과거를 아는 사람이라면 내가 운이 나쁘다고 생각할지도 몰라. 근데 난 그렇게 생각 안 해.이렇게 많은 사랑을 받을 수 있는 건 내 삶에 있어서 최대의 행운이니까',
                    reading:
                        "Nae gwageoreul aneun saramiramyeon naega uni nappeudago saenggakhaljido molla. Geunde nan geureoke saenggak an hae.Ireoke maneun sarang'eul badeul su inneun geon nae salme isseoseo choedae'ui haeng'uninikka",
                    audio: 'assets/character/voice_overs/Navia/story/ko/나비아 자신에 대해·운.mp3',
                },
                {
                    title: '우리에 대해·파트너',
                    text: '날 보스라고 부르는 사람도 있고 아가씨라고 부르는 사람도 있는데, 난 딱히 신경 안 써. 그래도 역시 네가 날 「파트너」라고 불러줄 때가 제일 좋더라! 그러니까 내 허영심을 만족시키기 위해서라도 자주 그렇게 불러줘!',
                    reading:
                        'Nal boseurago bureuneun saramdo itgo agassirago bureuneun saramdo inneunde, nan ttakhi sin\'gyeong an sseo. Geuraedo yeoksi nega nal "Pateuneo"-rago bulleojul ttaega jeil joteora! Geureonikka nae heoyeongsimeul manjoksikigi wihaeseorado jaju geureoke bulleojwo!',
                    audio: 'assets/character/voice_overs/Navia/story/ko/우리에 대해·파트너.mp3',
                },
                {
                    title: '우리에 대해·비밀',
                    text: '비밀은 말하는 순간 비밀이 아니랬어. 하지만 친구와 공유할 수 있는 비밀이야말로 정말 소중한 거 아닐까?…뭐야, 협박하는 거 아니거든! 물론 가시 장미회 회장으로서 비밀을 지키게 만드는 방법은 수도 없이 알지만, 그걸 너한테 쓰진 않을 테니 걱정 마',
                    reading:
                        "Bimireun malhaneun sun'gan bimiri aniraesseo. Hajiman chin'guwa gong'yuhal su inneun bimiriyamallo jeongmal sojunghan geo anilkka?...Mwoya, hyeopbakhaneun geo anigeodeun! Mullon gasi jangmihoe hoejang'euroseo bimireul jikige mandeuneun bangbeobeun sudo eopsi aljiman, geugeol neohante sseujin aneul teni geokjeong ma",
                    audio: 'assets/character/voice_overs/Navia/story/ko/우리에 대해·비밀.mp3',
                },
                {
                    title: '「신의 눈」에 대해…',
                    text: '봐, 이게 내 신의 눈이야! 엄청 반짝거리고 색도 내 옷이랑 잘 어울리지?근데 나보단 네가 훨씬 대단한 것 같아. 신의 눈 없이도 여러 가지 원소를 다룰 수 있잖아. 연습만으로는 안 되는 일이겠지?',
                    reading:
                        'Bwa, ige nae sinui nuniya! Eomcheong banjjakgeorigo saekdo nae osirang jal eoulliji?Geunde nabodan nega hwolssin daedanhan geot gata. Sinui nun eopsido yeoreo gaji wonsoreul darul su itjana. Yeonseummaneuroneun an doeneun irigetji?',
                    audio: 'assets/character/voice_overs/Navia/story/ko/「신의 눈」에 대해….mp3',
                },
                {
                    title: '하고 싶은 이야기·강아지',
                    text: '난 강아지 중에서 밤색 사냥개가 제일 좋아. 눈 위의 무늬가 꼭 눈썹 같지 않아? 그래서 항상 순박하고 성실해 보여.대신 이건 비밀로 해줘. 다른 강아지들한테 얘기하면 안 돼!',
                    reading:
                        "Nan gang'aji jung'eseo bamsaek sanyanggaega jeil joa. Nun wiui munuiga kkok nunsseop gatji ana? Geuraeseo hangsang sunbakhago seongsilhae boyeo.Daesin igeon bimillo haejwo. Dareun gang'ajideulhante yaegihamyeon an dwae!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/하고 싶은 이야기·강아지.mp3',
                },
                {
                    title: '하고 싶은 이야기·든든한 가시 장미회',
                    text: '잿빛의 강에서 한동안 지내다 보면, 폰타인에 다른 조직도 꽤 많다는 걸 알게 될 거야. 다들 목적이 달라서 가시 장미회처럼 우호적이진 않으니까 꼭 조심해야 해. 도움이 필요할 땐 바텐더 테토를 찾아가 봐. 상대방이 순순히 대화해 주지 않으면, 우리의 든든한 흰 장갑 씨가 나설 수밖에',
                    reading:
                        "Jaetbichui gang'eseo handong'an jinaeda bomyeon, pontaine dareun jojikdo kkwae mantaneun geol alge doel geoya. Dadeul mokjeogi dallaseo gasi jangmihoecheoreom uhojeogijin aneunikka kkok josimhaeya hae. Doumi piryohal ttaen batendeo tetoreul chajaga bwa. Sangdaebang'i sunsunhi daehwahae juji aneumyeon, uriui deundeunhan huin janggap ssiga naseol subakke",
                    audio: 'assets/character/voice_overs/Navia/story/ko/하고 싶은 이야기·든든한 가시 장미회.mp3',
                },
                {
                    title: '흥미있는 일…',
                    text: '장마 연꽃은 색이 참 예뻐. 하나둘 꽃이 피면 기나긴 장마가 드디어 끝났다는 걸 의미하지',
                    reading: 'Jangma yeonkkocheun saegi cham yeppeo. Hanadul kkochi pimyeon ginagin jangmaga deudieo kkeunnatdaneun geol uimihaji',
                    audio: 'assets/character/voice_overs/Navia/story/ko/흥미있는 일….mp3',
                },
                {
                    title: '클로린드에 대해…',
                    text: '전에 아버지 일 때문에, 음… 약간 서먹서먹했었는데, 그때 그 조심스러워하던 태도는 정말 마음에 안 들었어…. 평소에 말수도 적고 표정도 거의 없지만, 그래도 감정 변화는 나름 드러나는 편이거든. 역시 지금 같은 모습이 좋아',
                    reading:
                        "Jeone abeoji il ttaemune, eum... Yakgan seomeokseomeokhaesseonneunde, geuttae geu josimseureowohadeon taedoneun jeongmal ma'eume an deureosseo.... Pyeongso'e malsudo jeokgo pyojeongdo geoui eopjiman, geuraedo gamjeong byeonhwaneun nareum deureonaneun pyeonigeodeun. Yeoksi jigeum gateun moseubi joa",
                    audio: 'assets/character/voice_overs/Navia/story/ko/클로린드에 대해….mp3',
                },
                {
                    title: '샤를로트에 대해…',
                    text: '난 샤를로트가 취재하러 다닐 때의 열정과 속도보다 그 애의 촬영 기술에 더 놀랐어. 전에 내 상반신 사진을 찍어준 적이 있는데, 조명 효과가 꼭 정성껏 그린 유화 같았다니까. 뻔하지 않은 기사를 쓸 뿐만 아니라 사람들의 시선을 확 잡아끄는 사진도 찍을 줄 알다니, 샤를로트는 꼭 기자가 되려고 태어난 사람 같아',
                    reading:
                        "Nan syareulloteuga chwijaehareo danil ttae'ui yeoljeonggwa sokdoboda geu ae'ui chwaryeong gisure deo nollasseo. Jeone nae sangbansin sajineul jjigeojun jeogi inneunde, jomyeong hyogwaga kkok jeongseongkkeot geurin yuhwa gatatdanikka. Ppeonhaji aneun gisareul sseul ppunman anira saramdeurui siseoneul hwak jabakkeuneun sajindo jjigeul jul aldani, syareulloteuneun kkok gijaga doeryeogo taeeonan saram gata",
                    audio: 'assets/character/voice_overs/Navia/story/ko/샤를로트에 대해….mp3',
                },
                {
                    title: '치오리에 대해…',
                    text: '폰타인 패션계에 이국적인 느낌을 불어넣어 준 그 패션 디자이너는 사적으로 가시 장미회를 여러 번 도운 적이 있어. 내 기발한 아이디어 덕분에 창작 영감이 많이 떠올랐다고 하더라. 내가 알고 있는 치오리라면, 빈말을 한 건 아닐 거야. 근데 전에 10미터 높이의 모자를 만들어 달라고 했더니 엄청 단호하게 거절한 거 있지? 휴, 가게 앞에 두면 분명 아주 눈에 띄는 홍보 효과를 볼 수 있을 텐데!',
                    reading:
                        "Pontain paesyeon'gyee igukjeogin neukkimeul bureoneoeo jun geu paesyeon dijaineoneun sajeogeuro gasi jangmihoereul yeoreo beon doun jeogi isseo. Nae gibalhan aidieo deokbune changjak yeonggami mani tteoollatdago hadeora. Naega algo inneun chioriramyeon, binmareul han geon anil geoya. Geunde jeone 10-Miteo nopiui mojareul mandeureo dallago haetdeoni eomcheong danhohage geojeolhan geo itji? Hyu, gage ape dumyeon bunmyeong aju nune ttuineun hongbo hyogwareul bol su isseul tende!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/치오리에 대해….mp3',
                },
                {
                    title: '푸리나에 대해…',
                    text: '어릴 때 그분이 자선 공연 형식으로 참여하신 오페라를 관람한 적이 있어. 표를 구하기가 정말 힘들었다구! 그땐 다른 등장인물을 연기하셨지만, 높은 곳에서 연설할 때보다 더 자연스러워 보이셨어…. 지금 생각해 보면 그게 내 착각이 아니었나 봐',
                    reading:
                        "Eoril ttae geubuni jaseon gong'yeon hyeongsigeuro chamyeohasin operareul gwallamhan jeogi isseo. Pyoreul guhagiga jeongmal himdeureotdagu! Geuttaen dareun deungjang'inmureul yeon'gihasyeotjiman, nopeun goseseo yeonseolhal ttaeboda deo jayeonseureowo boisyeosseo.... Jigeum saenggakhae bomyeon geuge nae chakgagi anieonna bwa",
                    audio: 'assets/character/voice_overs/Navia/story/ko/푸리나에 대해….mp3',
                },
                {
                    title: '느비예트에 대해…',
                    text: '느비예트 씨는… 복잡하면서도 단순해. 뭐랄까… 바닷속 암초처럼 울퉁불퉁하지만, 그 안의 규칙을 이해하면 아예 예측할 수 없는 것도 아니야',
                    reading:
                        'Neubiyeteu ssineun... Bokjaphamyeonseodo dansunhae. Mworalkka... Badatsok amchocheoreom ultungbultunghajiman, geu anui gyuchigeul ihaehamyeon aye yecheukhal su eomneun geotdo aniya',
                    audio: 'assets/character/voice_overs/Navia/story/ko/느비예트에 대해….mp3',
                },
                {
                    title: '라이오슬리에 대해…',
                    text: '그 사람이랑 대화 한번 하려면 정말 힘이 든다니까. 이미 계약을 한 상황이라면 안심하고 협력해도 되지만, 그가 하는 말은 단 한 마디도 믿지 말라고 클로린드가 그랬어. 그래서 아버지가 물 아래 일에는 절대 관여하지 않으셨었나 봐. 혹시 모르니까 지금 상태를 쭉 유지하는 게 좋을 것 같네',
                    reading:
                        "Geu saramirang daehwa hanbeon haryeomyeon jeongmal himi deundanikka. Imi gyeyageul han sanghwang'iramyeon ansimhago hyeomnyeokhaedo doejiman, geuga haneun mareun dan han madido mitji mallago keullorindeuga geuraesseo. Geuraeseo abeojiga mul arae ireneun jeoldae gwanyeohaji aneusyeosseonna bwa. Hoksi moreunikka jigeum sangtaereul jjuk yujihaneun ge joeul geot ganne",
                    audio: 'assets/character/voice_overs/Navia/story/ko/라이오슬리에 대해….mp3',
                },
                {
                    title: '「아를레키노」에 대해…',
                    text: '그분은 카리스마 있으면서도 자애로운 리더야. 한 집의 「가장」 같은 느낌이랄까. 하지만 우인단 집행관 자리에 있는 이상, 분명 무자비한 면도 있겠지.그러니까 걱정 마. 「아를레키노」 씨가 푸아송 마을을 도운 은혜는 기억해도 다른 일에서는 조심할게',
                    reading:
                        'Geubuneun kariseuma isseumyeonseodo jaaeroun rideoya. Han jibui "Gajang" Gateun neukkimiralkka. Hajiman u\'indan jiphaenggwan jarie inneun isang, bunmyeong mujabihan myeondo itgetji.Geureonikka geokjeong ma. "Areullekino" Ssiga puasong ma\'eureul doun eunhyeneun gieokhaedo dareun ireseoneun josimhalge',
                    audio: 'assets/character/voice_overs/Navia/story/ko/「아를레키노」에 대해….mp3',
                },
                {
                    title: '리니와 리넷에 대해…',
                    text: '마술사가 과장된 말투를 사용한다는 건 알지만, 리니가 친구들을 진심으로 대한다는 건 알겠더라. 가끔 그가 보여주는 책임감은 그의 나이보다 훨씬 성숙한 것 같아….아 참, 전에 리니가 푸아송 마을 아이들에게 무료로 마술을 보여준 적이 있어! 나중에 기회 되면 리니랑 리넷을 초대해서 같이 마카롱 먹자. 리넷은 종종 마술로 찻잔을 만들어서 차를 마시니까, 분명 디저트도 좋아하겠지?',
                    reading:
                        "Masulsaga gwajangdoen maltureul sayonghandaneun geon aljiman, riniga chin'gudeureul jinsimeuro daehandaneun geon algetdeora. Gakkeum geuga boyeojuneun chaegimgameun geuui naiboda hwolssin seongsukhan geot gata....A cham, jeone riniga puasong ma'eul aideurege muryoro masureul boyeojun jeogi isseo! Najung'e gihoe doemyeon rinirang rineseul chodaehaeseo gachi makarong meokja. Rineseun jongjong masullo chatjaneul mandeureoseo chareul masinikka, bunmyeong dijeoteudo joahagetji?",
                    audio: 'assets/character/voice_overs/Navia/story/ko/리니와 리넷에 대해….mp3',
                },
                {
                    title: '에스코피에에 대해',
                    text: '내 친구 에스코피에가 드디어 세상 밖으로 나왔어. 지금까지 「드보르 케이크」를 뛰어넘는 신메뉴를 개발하기 위해 자기 주방에 틀어박혀 있었다는데, 그 상태로 더 있었다간 빛도 못 쬐는 눈이 됐을 거야. 우리, 에스코피에를 불러서 같이 피크닉 가자! 양산이랑 선글라스는 걔 보고 고르라고 하고. 에스코피에랑 같이 나가면, 평범한 소풍도 미식 여행이 된다구~',
                    reading:
                        "Nae chin'gu eseukopiega deudieo sesang bakkeuro nawasseo. Jigeumkkaji \"Deuboreu keikeu\"-reul ttwieoneomneun sinmenyureul gaebalhagi wihae jagi jubang'e teureobakhyeo isseotdaneunde, geu sangtaero deo isseotdagan bitdo mot jjoeneun nuni dwaesseul geoya. Uri, eseukopiereul bulleoseo gachi pikeunik gaja! Yangsanirang seon'geullaseuneun gyae bogo goreurago hago. Eseukopierang gachi nagamyeon, pyeongbeomhan sopungdo misik yeohaeng'i doendagu~",
                    audio: 'assets/character/voice_overs/Navia/story/ko/에스코피에에 대해.mp3',
                },
                {
                    title: '나비아에 대해 알기·첫 번째',
                    text: '가시 장미회의 업무는 아주 잡다하지만, 우리의 가장 중요한 목적은 사람들의 성가신 문제를 해결해 주는 거야. 성가시다는 건 단순히 문제 자체가 그렇다는 거지, 내가 그 일들 때문에 귀찮다는 건 아니야. 오히려 모두를 도울 수 있어서 기분이 상쾌한걸',
                    reading:
                        "Gasi jangmihoe'ui eommuneun aju japdahajiman, uriui gajang jung'yohan mokjeogeun saramdeurui seonggasin munjereul haegyeolhae juneun geoya. Seonggasidaneun geon dansunhi munje jachega geureotaneun geoji, naega geu ildeul ttaemune gwichantaneun geon aniya. Ohiryeo modureul doul su isseoseo gibuni sangkwaehan'geol",
                    audio: 'assets/character/voice_overs/Navia/story/ko/나비아에 대해 알기·첫 번째.mp3',
                },
                {
                    title: '나비아에 대해 알기·두 번째',
                    text: '사람은 역시 낭만을 품고 살아야 해. 봄날의 꽃, 여름날의 바다, 그리고 친구의 웃음! 모두 지나쳐서는 안 되는 풍경이지',
                    reading: "Sarameun yeoksi nangmaneul pumgo saraya hae. Bomnarui kkot, yeoreumnarui bada, geurigo chin'guui useum! Modu jinachyeoseoneun an doeneun punggyeong'iji",
                    audio: 'assets/character/voice_overs/Navia/story/ko/나비아에 대해 알기·두 번째.mp3',
                },
                {
                    title: '나비아에 대해 알기·세 번째',
                    text: '가끔은 인적이 드문 야외에서 이런저런 물건을 과녁 삼아 사격 연습을 해.그러면 스트레스가 확 풀리거든! 너도 해볼래? 내가 차근차근 가르쳐 줄게. 누군가를 가르치는 건 처음이지만, 난 분명 좋은 선생님이 될 거야. 아버지와 브라카리 할머니가 가르쳐 주신 것들을 아직 기억하고 있거든!',
                    reading:
                        "Gakkeumeun injeogi deumun yaoeeseo ireonjeoreon mulgeoneul gwanyeok sama sagyeok yeonseubeul hae.Geureomyeon seuteureseuga hwak pulligeodeun! Neodo haebollae? Naega chageunchageun gareuchyeo julge. Nugun'gareul gareuchineun geon cheo'eumijiman, nan bunmyeong joeun seonsaengnimi doel geoya. Abeojiwa beurakari halmeoniga gareuchyeo jusin geotdeureul ajik gieokhago itgeodeun!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/나비아에 대해 알기·세 번째.mp3',
                },
                {
                    title: '나비아에 대해 알기·네 번째',
                    text: '난 아버지 같은 사람이 되지 않을 거야. 가시 장미회의 일부 오래된 간부들은 내가 점점 아버지를 닮아간다고 하지만, 난 그게 아주 작은 경향에 불과하다고 봐. 어떤 문제들은 제한된 방법으로만 해결할 수 있으니까. 지금의 가시 장미회가 그때와 다른 것처럼, 회장도 달라지는 게 당연해',
                    reading:
                        "Nan abeoji gateun sarami doeji aneul geoya. Gasi jangmihoe'ui ilbu oraedoen ganbudeureun naega jeomjeom abeojireul dalmagandago hajiman, nan geuge aju jageun gyeonghyang'e bulgwahadago bwa. Eotteon munjedeureun jehandoen bangbeobeuroman haegyeolhal su isseunikka. Jigeumui gasi jangmihoega geuttaewa dareun geotcheoreom, hoejangdo dallajineun ge dang'yeonhae",
                    audio: 'assets/character/voice_overs/Navia/story/ko/나비아에 대해 알기·네 번째.mp3',
                },
                {
                    title: '나비아에 대해 알기·다섯 번째',
                    text: '난 어머니 같은 사람이 되지도 않을 것 같아. 다들 내 성격이 어머니랑 닮았다고 하고, 그때 당시 어머니가 하신 여러 선택의 이유도 어렴풋이 알 것 같지만…하아, 갑자기 클레멘타인선을 타고 싶어졌어. 지금 바로 같이 가줄 수 있을까? 딱히 특별한 목적 같은 건 없어. 그냥 같이 시내 구경하러 간다고 생각해 줄래?',
                    reading:
                        'Nan eomeoni gateun sarami doejido aneul geot gata. Dadeul nae seonggyeogi eomeonirang dalmatdago hago, geuttae dangsi eomeoniga hasin yeoreo seontaegui iyudo eoryeompusi al geot gatjiman...Haa, gapjagi keullementainseoneul tago sipeojyeosseo. Jigeum baro gachi gajul su isseulkka? Ttakhi teukbyeolhan mokjeok gateun geon eopseo. Geunyang gachi sinae gugyeonghareo gandago saenggakhae jullae?',
                    audio: 'assets/character/voice_overs/Navia/story/ko/나비아에 대해 알기·다섯 번째.mp3',
                },
                {
                    title: '나비아의 취미…',
                    text: '난 어릴 때부터 베이킹을 좋아했어. 흩어져 있는 재료들을 비율에 따라 섞은 다음, 오븐에 넣어 굽는 과정에서 조금씩 부풀어 오르면, 모양이 잡힌 향긋한 디저트가 된다는 게 신기하지 않아?참, 나중에 기회 되면 같이 생강 쿠키 구울래? 누가 더 높고 예쁜 쿠키 집을 만드는지 대결하는 거야!',
                    reading:
                        "Nan eoril ttaebuteo beiking'eul joahaesseo. Heuteojyeo inneun jaeryodeureul biyure ttara seokkeun da'eum, obeune neoeo gumneun gwajeong'eseo jogeumssik bupureo oreumyeon, moyang'i japhin hyanggeuthan dijeoteuga doendaneun ge sin'gihaji ana?Cham, najung'e gihoe doemyeon gachi saenggang kuki guullae? Nuga deo nopgo yeppeun kuki jibeul mandeuneunji daegyeolhaneun geoya!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/나비아의 취미….mp3',
                },
                {
                    title: '나비아의 고민…',
                    text: '흐아, 케이크를 굽고 나서 흩어진 밀가루는 치우기가 정말 번거로운 것 같아. 그리고 베이킹 용기에 붙은 달걀흰자와 크림도…. 으으, 도와줄 사람을 불러올게!',
                    reading:
                        "Heua, keikeureul gupgo naseo heuteojin milgaruneun chiugiga jeongmal beon'georoun geot gata. Geurigo beiking yonggie buteun dalgyalhuinjawa keurimdo.... Eueu, dowajul sarameul bulleoolge!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/나비아의 고민….mp3',
                },
                {
                    title: '좋아하는 음식…',
                    text: '난 뻔하지 않은 참신한 음식이 좋아. 그렇다고 내 미각을 의심하진 마. 난 그냥 음식에 담긴 기발함을 높이 사는 것뿐이거든. 물론 창의적인 요리가 대부분 맛이 없다는 사실은 바뀌지 않지만',
                    reading:
                        "Nan ppeonhaji aneun chamsinhan eumsigi joa. Geureotago nae migageul uisimhajin ma. Nan geunyang eumsige damgin gibalhameul nopi saneun geotppunigeodeun. Mullon chang'uijeogin yoriga daebubun masi eopdaneun sasireun bakkwiji anchiman",
                    audio: 'assets/character/voice_overs/Navia/story/ko/좋아하는 음식….mp3',
                },
                {
                    title: '싫어하는 음식…',
                    text: '오랫동안 보관한 음식은 별로야. 신선한 식자재의 일생을 낭비해 버린 것 같은 느낌이 든달까…',
                    reading: "Oraetdong'an bogwanhan eumsigeun byeolloya. Sinseonhan sikjajae'ui ilsaeng'eul nangbihae beorin geot gateun neukkimi deundalkka...",
                    audio: 'assets/character/voice_overs/Navia/story/ko/싫어하는 음식….mp3',
                },
                {
                    title: '선물 획득·첫 번째',
                    text: '놀라운 요리 실력이야! 너랑 외출하게 되면 식자재와 조리도구는 내가 챙길게',
                    reading: 'Nollaun yori sillyeogiya! Neorang oechulhage doemyeon sikjajaewa joridoguneun naega chaenggilge',
                    audio: 'assets/character/voice_overs/Navia/story/ko/선물 획득·첫 번째.mp3',
                },
                {
                    title: '선물 획득·두 번째',
                    text: '맛 좋은데? 내 데코레이션 스킬까지 더하면 더 완벽할 것 같아',
                    reading: 'Mat joeunde? Nae dekoreisyeon seukilkkaji deohamyeon deo wanbyeokhal geot gata',
                    audio: 'assets/character/voice_overs/Navia/story/ko/선물 획득·두 번째.mp3',
                },
                {
                    title: '선물 획득·세 번째',
                    text: '낙담하지 마. 세상엔 이런 참신한 요리도 필요한 법이니까',
                    reading: "Nakdamhaji ma. Sesang'en ireon chamsinhan yorido piryohan beobinikka",
                    audio: 'assets/character/voice_overs/Navia/story/ko/선물 획득·세 번째.mp3',
                },
                {
                    title: '생일…',
                    text: '넌 소원을 빌면 이뤄질 거라고 믿어? 샘물에 모라를 던지고, 행운이 찾아오길 기다리는 그런 거 말이야. 모라를 많이 던진다면 그중 하나는 이루어지지 않을까?그런 불확실한 일에 희망을 걸기보단, 오늘은 모라 한 주머니로 너의 소원을 들어줄게. 이 나비아가 할 수 있는 일이라면 뭐든지 말이야!',
                    reading:
                        "Neon sowoneul bilmyeon irwojil georago mideo? Saemmure morareul deonjigo, haeng'uni chajaogil gidarineun geureon geo mariya. Morareul mani deonjindamyeon geujung hananeun irueojiji aneulkka?Geureon bulhwaksilhan ire huimang'eul geolgibodan, oneureun mora han jumeoniro neoui sowoneul deureojulge. I nabiaga hal su inneun iriramyeon mwodeunji mariya!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/생일….mp3',
                },
                {
                    title: '돌파의 느낌·기',
                    text: '이 느낌은… 꼭 레몬 치즈케이크 같아!',
                    reading: 'I neukkimeun... Kkok remon chijeukeikeu gata!',
                    audio: 'assets/character/voice_overs/Navia/story/ko/돌파의 느낌·기.mp3',
                },
                {
                    title: '돌파의 느낌·승',
                    text: '크림이 혀끝에서 녹으면 스트레스도 같이 녹아버리지',
                    reading: 'Keurimi hyeokkeuteseo nogeumyeon seuteureseudo gachi nogabeoriji',
                    audio: 'assets/character/voice_overs/Navia/story/ko/돌파의 느낌·승.mp3',
                },
                {
                    title: '돌파의 느낌·전',
                    text: '그거 알아? 총알 모양의 초콜릿 사탕이 있는데, 아주 달아서 먹는 순간 온몸에 힘이 넘쳐. 꼭 지금 내 기분처럼!',
                    reading: "Geugeo ara? Chong'al moyang'ui chokollit satang'i inneunde, aju daraseo meongneun sun'gan onmome himi neomchyeo. Kkok jigeum nae gibuncheoreom!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/돌파의 느낌·전.mp3',
                },
                {
                    title: '돌파의 느낌·결',
                    text: '마지막으로 속이 편안해지는 밀크티를 준비한 다음 우리만의 티타임을 시작하는 거야. 넌 나에게 아주 많은 도움을 줬으니까, 고작 디저트 따위로 퉁칠 순 없지. 앞으로 폰타인에서 도움이 필요할 땐 언제든 가시 장미회를 찾아와!',
                    reading:
                        "Majimageuro sogi pyeonanhaejineun milkeutireul junbihan da'eum urimanui titaimeul sijakhaneun geoya. Neon na'ege aju maneun doumeul jwosseunikka, gojak dijeoteu ttawiro tungchil sun eopji. Apeuro pontaineseo doumi piryohal ttaen eonjedeun gasi jangmihoereul chajawa!",
                    audio: 'assets/character/voice_overs/Navia/story/ko/돌파의 느낌·결.mp3',
                },
            ],
        },
        combat: {
            en: [
                {
                    title: 'Elemental Skill',
                    text: '(Press) Watch out~!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Elemental Skill 01.mp3',
                },
                {
                    title: 'Elemental Skill',
                    text: "(Press) Comin' at ya!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Elemental Skill 02.mp3',
                },
                {
                    title: 'Elemental Skill',
                    text: '(Press) Hey there!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Elemental Skill 03.mp3',
                },
                {
                    title: 'Elemental Skill',
                    text: "(Hold) Feelin' lucky?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Elemental Skill 04.mp3',
                },
                {
                    title: 'Elemental Skill',
                    text: "(Hold) This one's got your name on it!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Elemental Skill 05.mp3',
                },
                {
                    title: 'Elemental Skill',
                    text: '(Hold) ...Umbrella warfare, I guess?',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Elemental Skill 06.mp3',
                },
                {
                    title: 'Elemental Burst',
                    text: 'Fire!!! ...Well, with rocks.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Elemental Burst 01.mp3',
                },
                {
                    title: 'Elemental Burst',
                    text: 'A proper sendoff! From the Spina, with love.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Elemental Burst 02.mp3',
                },
                {
                    title: 'Elemental Burst',
                    text: "Attack! Mm-hmm, that's the way.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Elemental Burst 03.mp3',
                },
                {
                    title: 'Opening Treasure Chest',
                    text: 'Whoa! What a stroke of good luck!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Opening Treasure Chest 01.mp3',
                },
                {
                    title: 'Opening Treasure Chest',
                    text: "Quick! Let's pack it up!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Opening Treasure Chest 02.mp3',
                },
                {
                    title: 'Opening Treasure Chest',
                    text: "I'm loving this treasure hunt~!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Opening Treasure Chest 03.mp3',
                },
                {
                    title: 'Low HP',
                    text: 'Just... a little longer!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Low HP 01.mp3',
                },
                {
                    title: 'Low HP',
                    text: '...I must do my duty!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Low HP 02.mp3',
                },
                {
                    title: 'Low HP',
                    text: "C'mon, Navia, focus!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Low HP 03.mp3',
                },
                {
                    title: 'Ally at Low HP',
                    text: 'Leave it to the president!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Ally at Low HP 01.mp3',
                },
                {
                    title: 'Ally at Low HP',
                    text: 'Reinforcements are here!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Ally at Low HP 02.mp3',
                },
                {
                    title: 'Fallen',
                    text: "Guess I'm... going home...",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Fallen 01.mp3',
                },
                {
                    title: 'Fallen',
                    text: 'Sorry, partner...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Fallen 02.mp3',
                },
                {
                    title: 'Fallen',
                    text: 'No... not me, too...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Fallen 03.mp3',
                },
                {
                    title: 'Light Hit Taken',
                    text: "What's your problem?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Light Hit Taken.mp3',
                },
                {
                    title: 'Heavy Hit Taken',
                    text: "Where'd that come from!?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Heavy Hit Taken 01.mp3',
                },
                {
                    title: 'Heavy Hit Taken',
                    text: "Ow... I'm fine!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Heavy Hit Taken 02.mp3',
                },
                {
                    title: 'Joining Party',
                    text: 'Count me in.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Joining Party 01.mp3',
                },
                {
                    title: 'Joining Party',
                    text: "The Spina's on the case!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Joining Party 02.mp3',
                },
                {
                    title: 'Joining Party',
                    text: "I'll take the lead today!",
                    reading: null,
                    audio: 'assets/character/voice_overs/Navia/combat/en/Joining Party 03.mp3',
                },
            ],
            zh: [
                {
                    title: '元素战技',
                    text: '小心咯！',
                    reading: 'Xiǎoxīn lo!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/元素战技 01.mp3',
                },
                {
                    title: '元素战技',
                    text: '正面偷袭！',
                    reading: 'Zhèngmiàn tōuxí!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/元素战技 02.mp3',
                },
                {
                    title: '元素战技',
                    text: '你好呀！',
                    reading: 'Nǐ hǎo ya!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/元素战技 03.mp3',
                },
                {
                    title: '元素战技',
                    text: '试着躲躲看？',
                    reading: 'Shìzhe duǒduo kàn?',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/元素战技 04.mp3',
                },
                {
                    title: '元素战技',
                    text: '猜我还有几颗子弹？',
                    reading: 'Cāi wǒ hái yǒu jǐ kē zǐdàn?',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/元素战技 05.mp3',
                },
                {
                    title: '元素战技',
                    text: '是…伞弹枪？',
                    reading: 'Shì… sǎndànqiāng?',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/元素战技 06.mp3',
                },
                {
                    title: '元素爆发',
                    text: '开火！虽然是岩元素啦。',
                    reading: 'Kāihuǒ! Suīrán shì yán yuánsù la.',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/元素爆发 01.mp3',
                },
                {
                    title: '元素爆发',
                    text: '玫瑰礼花！刺玫会特别定制版。',
                    reading: 'Méiguī lǐhuā! Cìmèihuì tèbié dìngzhì bǎn.',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/元素爆发 02.mp3',
                },
                {
                    title: '元素爆发',
                    text: '持续打击！嗯嗯，就是这样。',
                    reading: 'Chíxù dǎjí! Ń ń, jiùshì zhèyàng.',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/元素爆发 03.mp3',
                },
                {
                    title: '打开宝箱',
                    text: '喔！好运连连！',
                    reading: 'Wō! Hǎoyùn liánlián!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/打开宝箱 01.mp3',
                },
                {
                    title: '打开宝箱',
                    text: '快，快收好！',
                    reading: 'Kuài, kuài shōuhǎo!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/打开宝箱 02.mp3',
                },
                {
                    title: '打开宝箱',
                    text: '寻宝大成功！',
                    reading: 'Xúnbǎo dà chénggōng!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/打开宝箱 03.mp3',
                },
                {
                    title: '生命值低',
                    text: '再…再撑一会儿！',
                    reading: 'Zài… zài chēng yīhuìr!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/生命值低 01.mp3',
                },
                {
                    title: '生命值低',
                    text: '…得尽到责任！',
                    reading: '…děi jìn dào zérèn!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/生命值低 02.mp3',
                },
                {
                    title: '生命值低',
                    text: '注意力集中。',
                    reading: 'Zhùyì lì jízhōng.',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/生命值低 03.mp3',
                },
                {
                    title: '同伴生命值低',
                    text: '交给会长吧！',
                    reading: 'Jiāo gěi huìzhǎng ba!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/同伴生命值低 01.mp3',
                },
                {
                    title: '同伴生命值低',
                    text: '增援到了！',
                    reading: 'Zēngyuán dào le!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/同伴生命值低 02.mp3',
                },
                {
                    title: '倒下',
                    text: '就当是…回家了…',
                    reading: 'Jiù dāng shì… huíjiā le…',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/倒下 01.mp3',
                },
                {
                    title: '倒下',
                    text: '是我的错吗…',
                    reading: 'Shì wǒ de cuò ma…',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/倒下 02.mp3',
                },
                {
                    title: '倒下',
                    text: '就连我也…',
                    reading: 'Jiù lián wǒ yě…',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/倒下 03.mp3',
                },
                {
                    title: '普通受击',
                    text: '怎么了？',
                    reading: 'Zěnme le?',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/普通受击.mp3',
                },
                {
                    title: '重受击',
                    text: '哪来的？！',
                    reading: 'Nǎ lái de?!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/重受击 01.mp3',
                },
                {
                    title: '重受击',
                    text: '啊…不算什么！',
                    reading: 'A… bù suàn shénme!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/重受击 02.mp3',
                },
                {
                    title: '加入队伍',
                    text: '说走就走。',
                    reading: 'Shuō zǒu jiù zǒu.',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/加入队伍 01.mp3',
                },
                {
                    title: '加入队伍',
                    text: '刺玫会出马！',
                    reading: 'Cìmèihuì chūmǎ!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/加入队伍 02.mp3',
                },
                {
                    title: '加入队伍',
                    text: '今天我带路！',
                    reading: 'Jīntiān wǒ dàilù!',
                    audio: 'assets/character/voice_overs/Navia/combat/zh/加入队伍 03.mp3',
                },
            ],
            ja: [
                {
                    title: '元素スキル',
                    text: '気を付けなさい～！',
                    reading: 'Ki wo tsukenasai~!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/元素スキル 01.mp3',
                },
                {
                    title: '元素スキル',
                    text: '堂々不意打ち！',
                    reading: 'Doudou fuiuchi!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/元素スキル 02.mp3',
                },
                {
                    title: '元素スキル',
                    text: 'やっほー！',
                    reading: 'Yahhoo!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/元素スキル 03.mp3',
                },
                {
                    title: '元素スキル',
                    text: '避けられる？',
                    reading: 'Yokerareru?',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/元素スキル 04.mp3',
                },
                {
                    title: '元素スキル',
                    text: 'あと何発でしょー？',
                    reading: 'Ato nanpatsu deshoo?',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/元素スキル 05.mp3',
                },
                {
                    title: '元素スキル',
                    text: 'これって…「傘弾銃」？',
                    reading: 'Kore tte... "Sandanjuu"?',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/元素スキル 06.mp3',
                },
                {
                    title: '元素爆発',
                    text: 'ファイアー！ま、岩元素なんだけどね。',
                    reading: 'Faiaa! Ma, iwa gensou nandakedo ne.',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/元素爆発 01.mp3',
                },
                {
                    title: '元素爆発',
                    text: 'ローズクラッカー！「棘薔薇の会」特注版よ。',
                    reading: 'Roozukurakkaa! "Supina di Roosura" tokuchuuban yo.',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/元素爆発 02.mp3',
                },
                {
                    title: '元素爆発',
                    text: '撃ち続けて～！うんうん、イイ感じ！',
                    reading: 'Uchitsuzukete~! Un un, ii kanji!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/元素爆発 03.mp3',
                },
                {
                    title: '宝箱を開ける',
                    text: 'わーお！ラッキー！',
                    reading: 'Waao! Rakkii!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/宝箱を開ける 01.mp3',
                },
                {
                    title: '宝箱を開ける',
                    text: 'さ、早くしまって！',
                    reading: 'Sa, hayaku shimatte!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/宝箱を開ける 02.mp3',
                },
                {
                    title: '宝箱を開ける',
                    text: 'お宝探し、大成功～！',
                    reading: 'Otakara sagashi, daiseikou~!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/宝箱を開ける 03.mp3',
                },
                {
                    title: 'HP低下',
                    text: 'も…もうちょっと踏ん張るから！',
                    reading: 'Mo... mou chotto funbaru kara!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/HP低下 01.mp3',
                },
                {
                    title: 'HP低下',
                    text: '…責任を果たさなくちゃ！',
                    reading: '...Sekinin wo hatasanakucha!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/HP低下 02.mp3',
                },
                {
                    title: 'HP低下',
                    text: '集中集中！',
                    reading: 'Shuuchuu shuuchuu!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/HP低下 03.mp3',
                },
                {
                    title: '仲間HP低下',
                    text: '会長に任せなさい！',
                    reading: 'Kaichou ni makasenasai!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/仲間HP低下 01.mp3',
                },
                {
                    title: '仲間HP低下',
                    text: '援軍のお出ましよ！',
                    reading: 'Engun no odemashiyo!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/仲間HP低下 02.mp3',
                },
                {
                    title: '戦闘不能',
                    text: '家に…帰ったって思えば…',
                    reading: 'Ie ni... kaetta tte omoeba...',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/戦闘不能 01.mp3',
                },
                {
                    title: '戦闘不能',
                    text: 'あたしのせい、なのかな…',
                    reading: 'Atashi no sei, na no kana...',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/戦闘不能 02.mp3',
                },
                {
                    title: '戦闘不能',
                    text: 'あたしの番…なのね…',
                    reading: 'Atashi no ban... na no ne...',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/戦闘不能 03.mp3',
                },
                {
                    title: 'ダメージを受ける',
                    text: 'なになに？',
                    reading: 'Nani nani?',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/ダメージを受ける.mp3',
                },
                {
                    title: '重ダメージを受ける',
                    text: 'い、いつの間に！？',
                    reading: 'I, itsu no ma ni!?',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/重ダメージを受ける 01.mp3',
                },
                {
                    title: '重ダメージを受ける',
                    text: 'ッ…どうってことない！',
                    reading: "'... Dou tte koto nai!",
                    audio: 'assets/character/voice_overs/Navia/combat/ja/重ダメージを受ける 02.mp3',
                },
                {
                    title: 'チーム加入',
                    text: '思い立ったが吉日。',
                    reading: 'Omoi tatta ga kichijitsu.',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/チーム加入 01.mp3',
                },
                {
                    title: 'チーム加入',
                    text: '棘薔薇の会の出番よ！',
                    reading: 'Supina di Roosura no debanyo!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/チーム加入 02.mp3',
                },
                {
                    title: 'チーム加入',
                    text: '今日はあたしが案内してあげる！',
                    reading: 'Kyou wa atashi ga annaisite ageru!',
                    audio: 'assets/character/voice_overs/Navia/combat/ja/チーム加入 03.mp3',
                },
            ],
            ko: [
                {
                    title: '원소전투 스킬',
                    text: '조심해!',
                    reading: 'Josimhae!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/원소전투 스킬 01.mp3',
                },
                {
                    title: '원소전투 스킬',
                    text: '정면 기습이다!',
                    reading: 'Jeongmyeon giseubida!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/원소전투 스킬 02.mp3',
                },
                {
                    title: '원소전투 스킬',
                    text: '거기 안녕!',
                    reading: 'Geogi annyeong!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/원소전투 스킬 03.mp3',
                },
                {
                    title: '원소전투 스킬',
                    text: '피할 수 있겠어?',
                    reading: 'Pihal su itgesseo?',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/원소전투 스킬 04.mp3',
                },
                {
                    title: '원소전투 스킬',
                    text: '몇 발 남았게?',
                    reading: 'Myeot bal namatge?',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/원소전투 스킬 05.mp3',
                },
                {
                    title: '원소전투 스킬',
                    text: '이건… 우산탄?',
                    reading: 'Igeon... Usantan?',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/원소전투 스킬 06.mp3',
                },
                {
                    title: '원소폭발',
                    text: '발포! 바위 원소긴 하지만',
                    reading: 'Balpo! Bawi wonsogin hajiman',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/원소폭발 01.mp3',
                },
                {
                    title: '원소폭발',
                    text: '장미 축포! 가시 장미회 특별 제작 버전이야',
                    reading: 'Jangmi chukpo! Gasi jangmihoe teukbyeol jejak beojeoniya',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/원소폭발 02.mp3',
                },
                {
                    title: '원소폭발',
                    text: '계속 공격해! 응~ 바로 그거야',
                    reading: 'Gyesok gonggyeokhae! Eung~ Baro geugeoya',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/원소폭발 03.mp3',
                },
                {
                    title: '보물 상자 열기',
                    text: '우와~ 행운이 끊이질 않네!',
                    reading: "Uwa~ Haeng'uni kkeunijil anne!",
                    audio: 'assets/character/voice_overs/Navia/combat/ko/보물 상자 열기 01.mp3',
                },
                {
                    title: '보물 상자 열기',
                    text: '얼, 얼른 챙겨!',
                    reading: 'Eol, eolleun chaenggyeo!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/보물 상자 열기 02.mp3',
                },
                {
                    title: '보물 상자 열기',
                    text: '보물찾기 대성공!',
                    reading: 'Bomulchatgi daeseonggong!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/보물 상자 열기 03.mp3',
                },
                {
                    title: 'HP 부족',
                    text: '좀 더… 버텨보자!',
                    reading: 'Jom deo... Beotyeoboja!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/HP 부족 01.mp3',
                },
                {
                    title: 'HP 부족',
                    text: '…내 책임을 다해야 해!',
                    reading: '...Nae chaegimeul dahaeya hae!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/HP 부족 02.mp3',
                },
                {
                    title: 'HP 부족',
                    text: '집중, 집중!',
                    reading: 'Jipjung, jipjung!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/HP 부족 03.mp3',
                },
                {
                    title: '동료 HP 감소',
                    text: '이 회장님한테 맡겨둬!',
                    reading: 'I hoejangnimhante matgyeodwo!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/동료 HP 감소 01.mp3',
                },
                {
                    title: '동료 HP 감소',
                    text: '지원군 등장!',
                    reading: "Jiwon'gun deungjang!",
                    audio: 'assets/character/voice_overs/Navia/combat/ko/동료 HP 감소 02.mp3',
                },
                {
                    title: '전투 불능',
                    text: '집에 가는 셈… 치지 뭐…',
                    reading: 'Jibe ganeun sem... Chiji mwo...',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/전투 불능 01.mp3',
                },
                {
                    title: '전투 불능',
                    text: '내… 잘못…인가…?',
                    reading: "Nae... Jalmot...In'ga...?",
                    audio: 'assets/character/voice_overs/Navia/combat/ko/전투 불능 02.mp3',
                },
                {
                    title: '전투 불능',
                    text: '결국, 나까지…',
                    reading: 'Gyeolguk, nakkaji...',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/전투 불능 03.mp3',
                },
                {
                    title: '일반 피격',
                    text: '뭐야?',
                    reading: 'Mwoya?',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/일반 피격.mp3',
                },
                {
                    title: '강공격 피격',
                    text: '어디서 튀어나온 거야?!',
                    reading: 'Eodiseo twieonaon geoya?!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/강공격 피격 01.mp3',
                },
                {
                    title: '강공격 피격',
                    text: '칫… 별거 아냐!',
                    reading: 'Chit... Byeolgeo anya!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/강공격 피격 02.mp3',
                },
                {
                    title: '파티 가입',
                    text: '당장 출발하자',
                    reading: 'Dangjang chulbalhaja',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/파티 가입 01.mp3',
                },
                {
                    title: '파티 가입',
                    text: '가시 장미회가 나설 시간이군!',
                    reading: 'Gasi jangmihoega naseol siganigun!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/파티 가입 02.mp3',
                },
                {
                    title: '파티 가입',
                    text: '오늘은 나만 따라와!',
                    reading: 'Oneureun naman ttarawa!',
                    audio: 'assets/character/voice_overs/Navia/combat/ko/파티 가입 03.mp3',
                },
            ],
        },
    },
    demo_music: {
        name: 'Largo alla donzella',
        url: 'assets/character/demo_music/Navia.mp3',
    },
    build: {
        version: '5.4',
        type: 'On-field DPS',
        weapons: [
            {
                name: 'Verdict',
                icon: 'assets/weapons/Verdict.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'A Thousand Blazing Suns',
                icon: 'assets/weapons/A Thousand Blazing Suns.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'Serpent Spine',
                icon: 'assets/weapons/Serpent Spine.avif',
                quality: '4',
                how_to_obtain: 'Battle Pass (Gnostic Hymn)',
            },
            {
                name: 'Beacon of the Reed Sea',
                icon: 'assets/weapons/Beacon of the Reed Sea.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event WishesChronicled Wishes',
            },
            {
                name: 'Redhorn Stonethresher',
                icon: 'assets/weapons/Redhorn Stonethresher.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'Fang of the Mountain King',
                icon: 'assets/weapons/Fang of the Mountain King.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'The Unforged',
                icon: 'assets/weapons/The Unforged.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: "Wolf's Gravestone",
                icon: "assets/weapons/Wolf's Gravestone.avif",
                quality: '5',
                how_to_obtain: 'Wishes',
            },
            {
                name: 'Skyward Pride',
                icon: 'assets/weapons/Skyward Pride.avif',
                quality: '5',
                how_to_obtain: 'Wishes',
            },
            {
                name: 'Talking Stick',
                icon: 'assets/weapons/Talking Stick.avif',
                quality: '4',
                how_to_obtain: 'Battle Pass (Gnostic Hymn)',
            },
            {
                name: "Ultimate Overlord's Mega Magic Sword",
                icon: "assets/weapons/Ultimate Overlord's Mega Magic Sword.avif",
                quality: '4',
                how_to_obtain: 'Roses and Muskets Event',
            },
            {
                name: 'Tidal Shadow',
                icon: 'assets/weapons/Tidal Shadow.avif',
                quality: '4',
                how_to_obtain: 'Forging',
            },
            {
                name: 'Earth Shaker',
                icon: 'assets/weapons/Earth Shaker.avif',
                quality: '4',
                how_to_obtain: 'Forging',
            },
            {
                name: 'Prototype Archaic',
                icon: 'assets/weapons/Prototype Archaic.avif',
                quality: '4',
                how_to_obtain: 'Forging',
            },
            {
                name: 'Katsuragikiri Nagamasa',
                icon: 'assets/weapons/Katsuragikiri Nagamasa.avif',
                quality: '4',
                how_to_obtain: 'Forging',
            },
        ],
        artifacts: ['4pc Nighttime Whispers in the Echoing Woods', '4pc Marechaussee Hunter', '4pc Golden Troupe'],
        talents: ['Skill', 'Normal Attack', 'Burst'],
        main_stats: ['ATK% / ER', 'Geo DMG Bonus', 'CRIT Rate / CRIT DMG'],
        sub_stats: ['ER (until requirement)', 'CRIT Rate / CRIT DMG', 'ATK%'],
        teams: [
            [
                {
                    name: 'Navia',
                    icon: 'assets/character/icon/Navia.avif',
                    quality: '5',
                    element: {
                        name: 'Geo',
                        icon: 'assets/elements/Geo.avif',
                    },
                },
                {
                    name: 'Xilonen',
                    icon: 'assets/character/icon/Xilonen.avif',
                    quality: '5',
                    element: {
                        name: 'Geo',
                        icon: 'assets/elements/Geo.avif',
                    },
                },
                {
                    name: 'Mavuika',
                    icon: 'assets/character/icon/Mavuika.avif',
                    quality: '5',
                    element: {
                        name: 'Pyro',
                        icon: 'assets/elements/Pyro.avif',
                    },
                },
                {
                    name: 'Bennett',
                    icon: 'assets/character/icon/Bennett.avif',
                    quality: '4',
                    element: {
                        name: 'Pyro',
                        icon: 'assets/elements/Pyro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Navia',
                    icon: 'assets/character/icon/Navia.avif',
                    quality: '5',
                    element: {
                        name: 'Geo',
                        icon: 'assets/elements/Geo.avif',
                    },
                },
                {
                    name: 'Kachina',
                    icon: 'assets/character/icon/Kachina.avif',
                    quality: '4',
                    element: {
                        name: 'Geo',
                        icon: 'assets/elements/Geo.avif',
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
                    name: 'Bennett',
                    icon: 'assets/character/icon/Bennett.avif',
                    quality: '4',
                    element: {
                        name: 'Pyro',
                        icon: 'assets/elements/Pyro.avif',
                    },
                },
            ],
            [
                {
                    name: 'Navia',
                    icon: 'assets/character/icon/Navia.avif',
                    quality: '5',
                    element: {
                        name: 'Geo',
                        icon: 'assets/elements/Geo.avif',
                    },
                },
                {
                    name: 'Xilonen',
                    icon: 'assets/character/icon/Xilonen.avif',
                    quality: '5',
                    element: {
                        name: 'Geo',
                        icon: 'assets/elements/Geo.avif',
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
        ],
    },
};
