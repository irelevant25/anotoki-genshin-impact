var KAMISATO_AYAKA = {
    name: 'Kamisato Ayaka',
    secondary_title: 'Frostflake Heron',
    card_icon: 'assets/character/card/Kamisato Ayaka.avif',
    wish_icon: 'assets/character/wish/Kamisato Ayaka.avif',
    ingame_icon: 'assets/character/ingame/Kamisato Ayaka.avif',
    icon: 'assets/character/icon/Kamisato Ayaka.avif',
    quality: '5',
    weapon: {
        name: 'Sword',
        icon: 'assets/weapon_types/Sword.avif',
    },
    element: {
        name: 'Cryo',
        icon: 'assets/elements/Cryo.avif',
    },
    model: 'Medium Female',
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
    birthday: 'September 28th',
    constellations: [
        {
            name: 'Snowswept Sakura',
            level: 1,
            icon: 'assets/character/constellations/Snowswept Sakura.avif',
            description:
                "When Kamisato Ayaka's Normal or Charged Attacks deal Cryo DMG to opponents, it has a 50% chance of decreasing the CD of Kamisato Art: Hyouka by 0.3s. This effect can occur once every 0.1s.",
        },
        {
            name: 'Blizzard Blade Seki no To',
            level: 2,
            icon: 'assets/character/constellations/Blizzard Blade Seki no To.avif',
            description: "When casting Kamisato Art: Soumetsu, unleashes 2 smaller additional Frostflake Seki no To, each dealing 20% of the original storm's DMG.",
        },
        {
            name: 'Frostbloom Kamifubuki',
            level: 3,
            icon: 'assets/character/constellations/Frostbloom Kamifubuki.avif',
            description: 'Increases the Level of Kamisato Art: Soumetsu by 3.Maximum upgrade level is 15.',
        },
        {
            name: 'Ebb and Flow',
            level: 4,
            icon: 'assets/character/constellations/Ebb and Flow.avif',
            description: "Opponents damaged by Kamisato Art: Soumetsu's Frostflake Seki no To will have their DEF decreased by 30% for 6s.",
        },
        {
            name: 'Blossom Cloud Irutsuki',
            level: 5,
            icon: 'assets/character/constellations/Blossom Cloud Irutsuki.avif',
            description: 'Increases the Level of Kamisato Art: Hyouka by 3.Maximum upgrade level is 15.',
        },
        {
            name: 'Dance of Suigetsu',
            level: 6,
            icon: 'assets/character/constellations/Dance of Suigetsu.avif',
            description:
                "Kamisato Ayaka gains Usurahi Butou every 10s, increasing her Charged Attack DMG by 298%. This buff will be cleared 0.5s after Ayaka's Charged ATK hits an opponent, after which the timer for this ability will restart.",
        },
    ],
    region: {
        name: 'Inazuma',
        icon: 'assets/regions/Inazuma.avif',
    },
    affiliations: ['Yashiro Commission', 'Kamisato Clan'],
    special_dish: {
        name: '"Snow on the Hearth"',
        icon: 'assets/foods/Snow on the Hearth.avif',
    },
    namecard: {
        icon: 'assets/character/namecard_icon/Kamisato Ayaka.avif',
        background: 'assets/character/namecard_background/Kamisato Ayaka.avif',
        banner: 'assets/character/namecard_banner/Kamisato Ayaka.avif',
        description:
            "Ayaka does constantly change out the fans she carries with her, of course. If you're buying her some as gifts, remember not to send summer fans or throwing fans. Dancing fans or tea fans are good choices, though.",
        quality: '4',
        sources: ['Reward for reaching Friendship Level 10 with Kamisato Ayaka'],
    },
    how_to_obtain: "Event Wish — The Heron's Court",
    release_date: 'July 21, 2021',
    titles: ["Daughter of the Yashiro Commission's Kamisato Clan"],
    family: {
        ancestry: 'Kamisato Clan',
        father: 'Unnamed (deceased)',
        mother: 'Kamisato Kayo (deceased)',
    },
    voice_actors: [
        {
            language: 'English',
            actor: 'Erica Mendez',
        },
        {
            language: 'Chinese',
            actor: 'Xiao N (小N)',
        },
        {
            language: 'Japanese',
            actor: 'Hayami Saori (早見 沙織)',
        },
        {
            language: 'Korean',
            actor: 'Lee Yu-ri (이유리)',
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
                    hp: 1000.99,
                    atk: 26.63,
                    def: 61.03,
                },
                {
                    level: '20/20',
                    hp: 2596.56,
                    atk: 69.07,
                    def: 158.3,
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
                    hp: 3454.81,
                    atk: 91.9,
                    def: 210.63,
                },
                {
                    level: '40/40',
                    hp: 5169.5,
                    atk: 137.51,
                    def: 315.17,
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
                    name: 'Shivada Jade Sliver',
                    value: 1,
                    icon: 'assets/materials/Shivada Jade Sliver.avif',
                    quality: '2',
                },
                {
                    name: 'Sakura Bloom',
                    value: 3,
                    icon: 'assets/materials/Sakura Bloom.avif',
                    quality: '0',
                },
                {
                    name: 'Old Handguard',
                    value: 3,
                    icon: 'assets/materials/Old Handguard.avif',
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
                    hp: 5779.31,
                    atk: 153.73,
                    def: 352.35,
                },
                {
                    level: '50/50',
                    hp: 6649.17,
                    atk: 176.87,
                    def: 405.38,
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
                    name: 'Perpetual Heart',
                    value: 2,
                    icon: 'assets/materials/Perpetual Heart.avif',
                    quality: '4',
                },
                {
                    name: 'Shivada Jade Fragment',
                    value: 3,
                    icon: 'assets/materials/Shivada Jade Fragment.avif',
                    quality: '3',
                },
                {
                    name: 'Sakura Bloom',
                    value: 10,
                    icon: 'assets/materials/Sakura Bloom.avif',
                    quality: '0',
                },
                {
                    name: 'Old Handguard',
                    value: 15,
                    icon: 'assets/materials/Old Handguard.avif',
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
                    hp: 7462.26,
                    atk: 198.49,
                    def: 454.95,
                },
                {
                    level: '60/60',
                    hp: 8341.12,
                    atk: 221.87,
                    def: 508.53,
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
                    name: 'Perpetual Heart',
                    value: 4,
                    icon: 'assets/materials/Perpetual Heart.avif',
                    quality: '4',
                },
                {
                    name: 'Shivada Jade Fragment',
                    value: 6,
                    icon: 'assets/materials/Shivada Jade Fragment.avif',
                    quality: '3',
                },
                {
                    name: 'Sakura Bloom',
                    value: 20,
                    icon: 'assets/materials/Sakura Bloom.avif',
                    quality: '0',
                },
                {
                    name: 'Kageuchi Handguard',
                    value: 12,
                    icon: 'assets/materials/Kageuchi Handguard.avif',
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
                    hp: 8950.93,
                    atk: 238.09,
                    def: 545.71,
                },
                {
                    level: '70/70',
                    hp: 9837.81,
                    atk: 261.68,
                    def: 599.78,
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
                    name: 'Perpetual Heart',
                    value: 8,
                    icon: 'assets/materials/Perpetual Heart.avif',
                    quality: '4',
                },
                {
                    name: 'Shivada Jade Chunk',
                    value: 3,
                    icon: 'assets/materials/Shivada Jade Chunk.avif',
                    quality: '4',
                },
                {
                    name: 'Sakura Bloom',
                    value: 30,
                    icon: 'assets/materials/Sakura Bloom.avif',
                    quality: '0',
                },
                {
                    name: 'Kageuchi Handguard',
                    value: 18,
                    icon: 'assets/materials/Kageuchi Handguard.avif',
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
                    hp: 10447.62,
                    atk: 277.9,
                    def: 636.96,
                },
                {
                    level: '80/80',
                    hp: 11344.5,
                    atk: 301.76,
                    def: 691.64,
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
                    name: 'Perpetual Heart',
                    value: 12,
                    icon: 'assets/materials/Perpetual Heart.avif',
                    quality: '4',
                },
                {
                    name: 'Shivada Jade Chunk',
                    value: 6,
                    icon: 'assets/materials/Shivada Jade Chunk.avif',
                    quality: '4',
                },
                {
                    name: 'Sakura Bloom',
                    value: 45,
                    icon: 'assets/materials/Sakura Bloom.avif',
                    quality: '0',
                },
                {
                    name: 'Famed Handguard',
                    value: 12,
                    icon: 'assets/materials/Famed Handguard.avif',
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
                    hp: 11954.32,
                    atk: 317.98,
                    def: 728.82,
                },
                {
                    level: '90/90',
                    hp: 12858.21,
                    atk: 342.03,
                    def: 783.93,
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
                    name: 'Perpetual Heart',
                    value: 20,
                    icon: 'assets/materials/Perpetual Heart.avif',
                    quality: '4',
                },
                {
                    name: 'Shivada Jade Gemstone',
                    value: 6,
                    icon: 'assets/materials/Shivada Jade Gemstone.avif',
                    quality: '5',
                },
                {
                    name: 'Sakura Bloom',
                    value: 60,
                    icon: 'assets/materials/Sakura Bloom.avif',
                    quality: '0',
                },
                {
                    name: 'Famed Handguard',
                    value: 24,
                    icon: 'assets/materials/Famed Handguard.avif',
                    quality: '3',
                },
            ],
        },
    ],
    talents: [
        {
            name: 'Kamisato Art: Kabuki',
            type: 'Normal Attack',
            icon: 'assets/character/talents/Kamisato Art Kabuki.avif',
            description:
                'Normal AttackPerforms up to 5 rapid strikes.Charged AttackConsumes a certain amount of Stamina to unleash a flurry of sword ki.Plunging AttackPlunges from mid-air to strike the ground below, damaging enemies along the path and dealing AoE DMG upon impact.',
        },
        {
            name: 'Kamisato Art: Hyouka',
            type: 'Elemental Skill',
            icon: 'assets/character/talents/Kamisato Art Hyouka.avif',
            description: 'Summons blooming ice to launch nearby opponents, dealing AoE Cryo DMG.',
        },
        {
            name: 'Kamisato Art: Soumetsu',
            type: 'Elemental Burst',
            icon: 'assets/character/talents/Kamisato Art Soumetsu.avif',
            description:
                'Summons forth a snowstorm with flawless poise, unleashing a Frostflake Seki no To that moves forward continuously.Frostflake Seki no ToA storm of whirling icy winds that slashes repeatedly at every enemy it touches, dealing Cryo DMG.The snowstorm explodes after its duration ends, dealing AoE Cryo DMG.',
        },
        {
            name: 'Kamisato Art: Senho',
            type: 'Alternate Sprint',
            icon: 'assets/character/talents/Kamisato Art Senho.avif',
            description:
                "Alternate SprintAyaka consumes Stamina and cloaks herself in a frozen fog that moves with her.In Senho form, she moves swiftly upon water.When she reappears, the following effects occur:Ayaka unleashes frigid energy to apply Cryo on nearby opponents.Coldness condenses around Ayaka's blade, infusing her attacks with Cryo for a brief period.",
        },
        {
            name: 'Amatsumi Kunitsumi Sanctification',
            type: '1st Ascension Passive',
            icon: 'assets/character/talents/Amatsumi Kunitsumi Sanctification.avif',
            description: "After using Kamisato Art: Hyouka, Kamisato Ayaka's Normal and Charged attacks deal 30% increased DMG for 6s.",
        },
        {
            name: 'Kanten Senmyou Blessing',
            type: '4th Ascension Passive',
            icon: 'assets/character/talents/Kanten Senmyou Blessing.avif',
            description:
                'When the Cryo application at the end of Kamisato Art: Senho hits an opponent, Kamisato Ayaka gains the following effects:Restores 10 StaminaGains 18% Cryo DMG Bonus for 10s.',
        },
        {
            name: 'Fruits of Shinsa',
            type: 'Utility Passive',
            icon: 'assets/character/talents/Fruits of Shinsa.avif',
            description: 'When Ayaka crafts Weapon Ascension Materials, she has a 10% chance to receive double the product.',
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
                    name: 'Old Handguard',
                    value: 6,
                    icon: 'assets/materials/Old Handguard.avif',
                    quality: '1',
                },
                {
                    name: 'Teachings of Elegance',
                    value: 3,
                    icon: 'assets/materials/Teachings of Elegance.avif',
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
                    name: 'Kageuchi Handguard',
                    value: 3,
                    icon: 'assets/materials/Kageuchi Handguard.avif',
                    quality: '2',
                },
                {
                    name: 'Guide to Elegance',
                    value: 2,
                    icon: 'assets/materials/Guide to Elegance.avif',
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
                    name: 'Kageuchi Handguard',
                    value: 4,
                    icon: 'assets/materials/Kageuchi Handguard.avif',
                    quality: '2',
                },
                {
                    name: 'Guide to Elegance',
                    value: 4,
                    icon: 'assets/materials/Guide to Elegance.avif',
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
                    name: 'Kageuchi Handguard',
                    value: 6,
                    icon: 'assets/materials/Kageuchi Handguard.avif',
                    quality: '2',
                },
                {
                    name: 'Guide to Elegance',
                    value: 6,
                    icon: 'assets/materials/Guide to Elegance.avif',
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
                    name: 'Kageuchi Handguard',
                    value: 9,
                    icon: 'assets/materials/Kageuchi Handguard.avif',
                    quality: '2',
                },
                {
                    name: 'Guide to Elegance',
                    value: 9,
                    icon: 'assets/materials/Guide to Elegance.avif',
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
                    name: 'Famed Handguard',
                    value: 4,
                    icon: 'assets/materials/Famed Handguard.avif',
                    quality: '3',
                },
                {
                    name: 'Philosophies of Elegance',
                    value: 4,
                    icon: 'assets/materials/Philosophies of Elegance.avif',
                    quality: '4',
                },
                {
                    name: 'Bloodjade Branch',
                    value: 1,
                    icon: 'assets/materials/Bloodjade Branch.avif',
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
                    name: 'Famed Handguard',
                    value: 6,
                    icon: 'assets/materials/Famed Handguard.avif',
                    quality: '3',
                },
                {
                    name: 'Philosophies of Elegance',
                    value: 6,
                    icon: 'assets/materials/Philosophies of Elegance.avif',
                    quality: '4',
                },
                {
                    name: 'Bloodjade Branch',
                    value: 1,
                    icon: 'assets/materials/Bloodjade Branch.avif',
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
                    name: 'Famed Handguard',
                    value: 9,
                    icon: 'assets/materials/Famed Handguard.avif',
                    quality: '3',
                },
                {
                    name: 'Philosophies of Elegance',
                    value: 12,
                    icon: 'assets/materials/Philosophies of Elegance.avif',
                    quality: '4',
                },
                {
                    name: 'Bloodjade Branch',
                    value: 2,
                    icon: 'assets/materials/Bloodjade Branch.avif',
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
                    name: 'Famed Handguard',
                    value: 12,
                    icon: 'assets/materials/Famed Handguard.avif',
                    quality: '3',
                },
                {
                    name: 'Philosophies of Elegance',
                    value: 16,
                    icon: 'assets/materials/Philosophies of Elegance.avif',
                    quality: '4',
                },
                {
                    name: 'Bloodjade Branch',
                    value: 2,
                    icon: 'assets/materials/Bloodjade Branch.avif',
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
    version: '2.0',
    voice_overs: {
        story: {
            en: [
                {
                    title: 'Hello',
                    text: 'Master of Inazuma Kamisato Art Tachi Jutsu — Kamisato Ayaka, present!Delighted to make your acquaintance.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Hello.mp3',
                },
                {
                    title: 'Chat: Stability',
                    text: 'I only wish life could be as leisurely as this a little more often... How greedy of me.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Chat - Stability.mp3',
                },
                {
                    title: 'Chat: Sword',
                    text: 'A blade is like a tea-leaf. Only those who sample it many times can appreciate its true qualities.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Chat - Sword.mp3',
                },
                {
                    title: 'Chat: Zoning Out',
                    text: "So this is a day in the life of the Traveler... Hehe, I'm learning more about you all the time.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Chat - Zoning Out.mp3',
                },
                {
                    title: 'Chat: Famous Sword',
                    text: 'A blade embraces its duty as a jeweler cherishes their gems.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Chat - Famous Sword.mp3',
                },
                {
                    title: 'When It Rains',
                    text: 'Come with me, let us find shelter from the rain.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/When It Rains.mp3',
                },
                {
                    title: 'When Thunder Strikes',
                    text: 'Her Excellency... What is she trying to communicate?',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/When Thunder Strikes.mp3',
                },
                {
                    title: 'When It Snows',
                    text: '"Snow that once adorned the world in silver, thaws to reveal the gleam of the fruit upon frost-laden branches." *sigh* How picturesque! Only some tea would make this setting more complete.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/When It Snows.mp3',
                },
                {
                    title: 'When the Sun Is Out',
                    text: "There's a pleasant breeze and glorious sunshine... So, where shall we go for a walk?",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/When the Sun Is Out.mp3',
                },
                {
                    title: "When It's Windy",
                    text: "Close your eyes and face the wind... It feels wonderful, doesn't it?",
                    reading: null,
                    audio: "assets/character/voice_overs/Kamisato Ayaka/story/en/When It's Windy.mp3",
                },
                {
                    title: 'Good Morning',
                    text: 'Oh, good morning, Traveler. ...Whenever I see you in the morning, somehow, it makes me feel like... today is going to be a good day.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Good Morning.mp3',
                },
                {
                    title: 'Good Afternoon',
                    text: 'Good afternoon. It is normal to feel drowsy after lunch, might I interest you in a game of Go to stimulate the mind?',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Good Afternoon.mp3',
                },
                {
                    title: 'Good Evening',
                    text: 'Greetings. An auspicious breeze blows this evening. Tonight will be peaceful.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Good Evening.mp3',
                },
                {
                    title: 'Good Night',
                    text: '"Was it one\'s thoughts that drew him to my dreams? Had I known it a dream, one would not have awakened." Hehe, I love that poem.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Good Night.mp3',
                },
                {
                    title: 'About Kamisato Ayaka: Yashiro Commission',
                    text: '"Inazuma Shogunate, Yashiro Commission, Kamisato Clan." Widely known as one of the most distinguished clans in all of Inazuma, it is the branch of the Tri-Commission that manages ceremonial and cultural affairs. Since my parents passed, Brother and I assumed responsibility for all clan matters, big and small.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Kamisato Ayaka - Yashiro Commission.mp3',
                },
                {
                    title: 'About Kamisato Ayaka: Position',
                    text: 'Many look up to me as the Shirasagi Himegimi and as the daughter of the Kamisato Clan. But the object of their respect has everything to do with my position, and nothing at all to do with me, Ayaka. It makes me think that... maybe, there is only one person I know who is truly able to get close to me...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Kamisato Ayaka - Position.mp3',
                },
                {
                    title: 'About Kamisato Ayaka: Aspiration',
                    text: 'Today, as in the past, I aspire to be somebody whom everyone can trust. But what motivates me is no longer the responsibilities I shoulder, or the expectations of other people. Rather, it is the fact that you are this kind of person, too.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Kamisato Ayaka - Aspiration.mp3',
                },
                {
                    title: 'About Us: Teahouse',
                    text: "If you've got time, shall we take a walk to Komore Teahouse? To chat about the art of tea on a pleasant day like this seems like the sophisticated thing to do.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Us - Teahouse.mp3',
                },
                {
                    title: 'About Us: Festivals',
                    text: 'If I ever have the chance, I would very much like to experience the festivities of another nation with you one day. Though, I will need some guidance on local customs and etiquette, and advice on what gifts to bring... Could I trouble you to give me some guidance?',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Us - Festivals.mp3',
                },
                {
                    title: 'About the Vision',
                    text: 'Visions are a seal of approval for those who are most ambitious. As for my own ambitions, they shall remain private for now. It is nothing more than an insignificant dream.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About the Vision.mp3',
                },
                {
                    title: 'Something to Share',
                    text: 'It is said that "the flavor of Zen is that of tea," and it is also said that "the power of Zen is that of the blade." One might then ask: What does that say about the relationship between tea and the blade?',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Something to Share.mp3',
                },
                {
                    title: 'Interesting Things',
                    text: "Have you ever noticed the withering sakura tree in the city? For me, there is a beauty to the withering, it brings back fond memories of the spring. Most people don't agree — sakura trees that will never bloom again are removed. But when I look at a tree, all I want is to see it blossom again... just one more time...",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Interesting Things.mp3',
                },
                {
                    title: 'About Thoma',
                    text: 'Thoma is a dear friend. He always lifts my spirits with his sunny disposition. In a sense, I think of him as another brother, and as a full member of the Kamisato Clan.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Thoma.mp3',
                },
                {
                    title: 'About Kujou Sara',
                    text: 'Kujou Sara of the Tenryou Commission is... not known to smile, and I have had my fair share of disputes with her. She is, however, a loyal servant to Inazuma, there is no question about that.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Kujou Sara.mp3',
                },
                {
                    title: 'About Shikanoin Heizou',
                    text: 'Mr. Shikanoin belongs to the Tenryou Commission, just like Miss Kujou. He is very... principled, sometimes even more determinedly so than Miss Kujou. The only thing is, when it comes to the question of which matters should be governed by his principles, I believe only Mr. Shikanoin himself knows the answer...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Shikanoin Heizou.mp3',
                },
                {
                    title: 'About Sayu',
                    text: "Ah, little Sayu. She hasn't been causing you any trouble lately, has she? Hehe, if you ever notice her slacking off, please let me know.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Sayu.mp3',
                },
                {
                    title: 'About the Raiden Shogun: Guesswork',
                    text: 'The Almighty Shogun? It would be improper of me to comment, given that I am one of her subjects. All I will say is that... I think that Her Excellency must get lonely on the road to eternity.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About the Raiden Shogun - Guesswork.mp3',
                },
                {
                    title: 'About the Raiden Shogun: Standpoint',
                    text: "To witness the Musou no Hitotachi and live to tell the tale is quite a remarkable feat. Even though I recognize her as our true deity with the power to change Inazuma's fate at will, if there is conflict between the two of you, then... I shall choose to side with you.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About the Raiden Shogun - Standpoint.mp3',
                },
                {
                    title: 'About Yae Miko',
                    text: "I have always greatly enjoyed working with Guuji Yae. Organizing festival affairs generally takes a lot of effort and doesn't generate much income, but Guuji Yae's events always come off both elegant and profitable.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Yae Miko.mp3',
                },
                {
                    title: 'About Kamisato Ayato',
                    text: "As the head of the Kamisato Clan, brother always has a full schedule of places he needs to be. I do try my best to share his load, but there is no changing the pressure he is subjected to all year round, and the toll it takes upon him. *sigh* If you see him, remind him to take care of himself, for his sister's sake...",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Kamisato Ayato.mp3',
                },
                {
                    title: 'About Yoimiya',
                    text: 'The Yashiro Commission and the shrine maidens are responsible for festival affairs, and Yoimiya, as a fireworks expert, knows how to create an atmosphere. So we have become well acquainted with her over the years.Hmm? Public order and fire prevention? We factor these concerns in well in advance during the planning stage. To deny people the chance to see fireworks simply for these reasons would leave them feeling very disappointed.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/About Yoimiya.mp3',
                },
                {
                    title: 'More About Kamisato Ayaka: I',
                    text: 'Your request is quite unusual for me. Since I see you as a friend, it would only be fair to be open and honest with you, but if this means sharing secrets of the Kamisato Clan... I would ask that you keep anything I tell you in strict confidence.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/More About Kamisato Ayaka - I.mp3',
                },
                {
                    title: 'More About Kamisato Ayaka: II',
                    text: "The Kamisato Clan once suffered a major blow when we failed to protect a swordsmith of national significance. We were harassed by the Fatui, we lost many of our people, and we received a great deal of criticism. It all aged Father greatly, and severely damaged the Kamisato Clan's standing within the Shogunate. Brother has worked tirelessly to reverse the trend since he assumed leadership, but although our clan's position is now restored and the Yashiro Commission is unified once more, we still rely on Brother to make the decisions on all matters of any importance.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/More About Kamisato Ayaka - II.mp3',
                },
                {
                    title: 'More About Kamisato Ayaka: III',
                    text: "The art of blade forging taught by the Shogun varies based on astrology, application, materials used, the furnace conditions, individual personalities, and elemental changes. These differences between smiths is what gave rise to the Raiden Gokaden. Swordsmiths capable of forging renowned blades are seen as spiritual personnel with sacred abilities, and as such they should be managed by the Yashiro Commission, which oversees all cultural, artistic, and ceremonial affairs. So naturally, the swordsmith's betrayal is the fault of ineffectual management by the Kamisato Clan.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/More About Kamisato Ayaka - III.mp3',
                },
                {
                    title: 'More About Kamisato Ayaka: IV',
                    text: "My mother was the most incredible person. She was always so dignified and elegant, always smiling, no matter what situation she might be facing. She had so much to deal with in the clan on so many levels, but she took it all in stride — it was like nothing could ever faze her. Everything about her was perfect, and I say that without exaggerating. *sigh* But the moment she passed away, I realized... I couldn't hide behind my mother any longer. I wasn't little Ayaka any more.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/More About Kamisato Ayaka - IV.mp3',
                },
                {
                    title: 'More About Kamisato Ayaka: V',
                    text: "What I want to say next is perhaps not befitting of a member of the Inazuma Shogunate, Yashiro Commission, Kamisato Clan, but... unless I am mistaken, I trust that you will not take issue with this slight departure from convention on my part...That is to say... I'm a little tired, may I rest my head on your shoulder? Just for a moment.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/More About Kamisato Ayaka - V.mp3',
                },
                {
                    title: "Kamisato Ayaka's Hobbies",
                    text: 'I have great affection for the arts: music, song, poetry, shougi, and dancing. And you?',
                    reading: null,
                    audio: "assets/character/voice_overs/Kamisato Ayaka/story/en/Kamisato Ayaka's Hobbies.mp3",
                },
                {
                    title: "Kamisato Ayaka's Troubles: Concerns",
                    text: "Troubles? Well, I mean... that's life, isn't it? There will always be things that don't go one's way. But I do not wish to worry those around me on account of things that are my concern alone... so, it is best if I keep them to myself.",
                    reading: null,
                    audio: "assets/character/voice_overs/Kamisato Ayaka/story/en/Kamisato Ayaka's Troubles - Concerns.mp3",
                },
                {
                    title: "Kamisato Ayaka's Troubles: Desires",
                    text: "Openness is something I find very difficult. I constantly have to remind myself that as a lady of the Kamisato Clan, there are countless people watching and countless expectations to live up to. I must be a model of exemplary conduct at all times. But even so, shouldn't I still follow my dreams? Shouldn't I... share my true feelings with you?",
                    reading: null,
                    audio: "assets/character/voice_overs/Kamisato Ayaka/story/en/Kamisato Ayaka's Troubles - Desires.mp3",
                },
                {
                    title: 'Favorite Food',
                    text: "I'm fascinated by food from overseas. Though I don't get to try it very often... So, if I had to choose something from Inazuma, then probably... Chazuke. But not when anybody else is watching... So I tell you that in confidence.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Favorite Food.mp3',
                },
                {
                    title: 'Least Favorite Food',
                    text: 'Though I do not eschew animal fat and organs entirely, they are far from my first choice.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Least Favorite Food.mp3',
                },
                {
                    title: 'Receiving a Gift: I',
                    text: 'Mmm... Yes, I am truly fortunate...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Receiving a Gift - I.mp3',
                },
                {
                    title: 'Receiving a Gift: II',
                    text: 'Thank you for the opportunity to try this dish. I will always savor it.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Receiving a Gift - II.mp3',
                },
                {
                    title: 'Receiving a Gift: III',
                    text: "Hmm... It's a bit greasy for my taste.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Receiving a Gift - III.mp3',
                },
                {
                    title: 'Birthday',
                    text: "Come with me! We're not going far away — I promise it won't delay you too much.I managed to find out when your birthday was well in advance, so I could prepare in good time. Hopefully this wasn't assuming too much, but I guessed you might prefer this to an expensive gift.In honor of your birthday, please allow me to perform a fan dance for you.",
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Birthday.mp3',
                },
                {
                    title: 'Feelings About Ascension: Intro',
                    text: 'Thank you very much. It has been richly rewarding to learn from you so far, and I believe my skills with the blade can go even further still.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Feelings About Ascension - Intro.mp3',
                },
                {
                    title: 'Feelings About Ascension: Building Up',
                    text: 'Thank you for your guidance. With your assistance, I am gaining a more thorough understanding of my capabilities.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Feelings About Ascension - Building Up.mp3',
                },
                {
                    title: 'Feelings About Ascension: Climax',
                    text: 'I feel more competent now than ever before. I even have the time outside my work for the Yashiro Commission to try some new things. Would you like to try one of my home-made snacks? I just learned how to make them recently.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Feelings About Ascension - Climax.mp3',
                },
                {
                    title: 'Feelings About Ascension: Conclusion',
                    text: '"Though I cling to that which has given me the strength to hold on, the weight of letting go is ever-foreboding."My apologies, it should be a happy occasion, and yet it is such a sad phrase that comes to mind. Our time together has been so pleasant that I am fearful of losing what I have gained. I\'m sorry, I must compose myself.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/en/Feelings About Ascension - Conclusion.mp3',
                },
            ],
            zh: [
                {
                    title: '初次见面…',
                    text: '稻妻神里流太刀术皆传——神里绫华，参上！请多指教哦。',
                    reading: 'Dàoqī shénlǐ-liú tàidāo-shù jiēchuán⸺ Shénlǐ Línghuá, cānshàng!Qǐngduōzhǐjiào ō.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/初次见面….mp3',
                },
                {
                    title: '闲聊・安定',
                    text: '像这样悠闲安稳的时光，如果再多一点就好了…我真贪心啊。',
                    reading: 'Xiàng zhèyàng yōuxián ānwěn de shíguāng, rúguǒ zài duō yīdiǎn jiù hǎole... Wǒ zhēn tānxīn a.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/闲聊・安定.mp3',
                },
                {
                    title: '闲聊・剑',
                    text: '剑，就和茶一样，细细品味才能理解其中风雅。',
                    reading: 'Jiàn, jiù hé chá yīyàng, xìxìpǐnwèi cáinéng lǐjiě qí zhòng fēngyǎ.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/闲聊・剑.mp3',
                },
                {
                    title: '闲聊・出神',
                    text: '这就是旅行者平日里的生活么，呵，感觉又多了解了你一些。',
                    reading: 'Zhè jiùshì Lǚxíngzhě píngrì lǐ de shēnghuó me, hē, gǎnjué yòu duō liǎojiěle nǐ yīxiē.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/闲聊・出神.mp3',
                },
                {
                    title: '闲聊・名刀',
                    text: '刀剑抱业，名工怀宝。',
                    reading: 'Dāojiàn bào yè, mínggōng huái bǎo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/闲聊・名刀.mp3',
                },
                {
                    title: '下雨的时候…',
                    text: '请随我一同避雨吧。',
                    reading: 'Qǐng suí wǒ yītóng bì yǔ ba.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/下雨的时候….mp3',
                },
                {
                    title: '打雷的时候…',
                    text: '大御所大人…是在诉说什么吗？',
                    reading: 'Dàyùsuǒ-dàrén... Shì zài sùshuō shénme ma?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/打雷的时候….mp3',
                },
                {
                    title: '下雪的时候…',
                    text: '「雪霁银妆素，桔高映琼枝。」嗯…美景当前，只差一壶茶与之相衬呢。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/下雪的时候….mp3',
                },
                {
                    title: '阳光很好…',
                    text: '风和日丽，要去哪边走走么？',
                    reading: 'Fēnghé-rìlì, yào qù nǎ biān zǒuzou me?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/阳光很好….mp3',
                },
                {
                    title: '起风的时候…',
                    text: '闭上眼睛，向着风吹来的方向…怎么样，很舒服吧？',
                    reading: 'Bì shàng yǎnjīng, xiàngzhe fēng chuī lái de fāngxiàng... Zěnme yàng, hěn shūfú ba?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/起风的时候….mp3',
                },
                {
                    title: '早上好…',
                    text: '早安，旅行者。能像这样在清晨见你一面，我会忍不住觉得…接下来将是顺利的一天。',
                    reading: "Zǎo'ān, Lǚxíngzhě. Néng xiàng zhèyàng zài qīngchén jiàn nǐ yīmiàn, wǒ huì rěn bù zhù juéde... Jiē xiàlái jiāng shì shùnlì de yītiān.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/早上好….mp3',
                },
                {
                    title: '中午好…',
                    text: '午安。茶饭之后，难免略有困倦。是否有兴致下盘棋提神呢？',
                    reading: "Wǔ'ān. Cháfàn zhīhòu, nánmiǎn lüè yǒu kùnjuàn. Shìfǒu yǒu xìngzhì xià pán qí tíshén ne?",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/中午好….mp3',
                },
                {
                    title: '晚上好…',
                    text: '晚上好。夜风舒畅，会是一个良宵呢。',
                    reading: 'Wǎnshàng hǎo. Yè fēng shūchàng, huì shì yīgè liángxiāo ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/晚上好….mp3',
                },
                {
                    title: '晚安…',
                    text: '「若知是梦何须醒，不比真如一相会。」',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/晚安….mp3',
                },
                {
                    title: '关于绫华自己・社奉行',
                    text: '「稻妻幕府社奉行神里家」，位于稻妻名门中的笔头之格位。作为三奉行之一，掌管祭祀活动与人文艺术。自从双亲过世之后，族内的大小事务，便由兄长和我承担了。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于绫华自己・社奉行.mp3',
                },
                {
                    title: '关于绫华自己・地位',
                    text: '很多人因为我是「白鹭公主」，是社奉行神里家的大小姐而敬重我。他们所敬重的，只是我所身处的地位，与绫华我是怎样的人并无关系…所以我想，能真正走近我的，或许只有…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于绫华自己・地位.mp3',
                },
                {
                    title: '关于绫华自己・愿望',
                    text: '如今的我，依旧想成为值得大家信任的人。不过，鼓舞我的原因，已不再是肩上的责任或他人的期待。而是因为，你也是这样的人啊。',
                    reading:
                        'Rújīn de wǒ, yījiù xiǎng chéngwéi zhídé dàjiā xìnrèn de rén. Bùguò, gǔwǔ wǒ de yuányīn, yǐ bù zài shì jiān shàng de zérèn huò tārén de qídài. Ér shì yīnwèi, nǐ yěshì zhèyàng de rén a.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于绫华自己・愿望.mp3',
                },
                {
                    title: '关于我们・茶室',
                    text: '如你有空，我们移步木漏茶室如何？在这样恬静的日子，略加交流茶艺心得，想来是颇具雅趣的。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于我们・茶室.mp3',
                },
                {
                    title: '关于我们・节日',
                    text: '如果有机会的话，我想试着和你共度异国的节日。需要遵循的当地风俗、礼仪规范，还有伴手礼的推荐，可以麻烦你…一一指导我吗？',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于我们・节日.mp3',
                },
                {
                    title: '关于「神之眼」…',
                    text: '「神之眼」，即是胸怀大志之人所获的印绶。如果问我有什么志向的话…这个还是保密吧，只是一个微不足道的梦想罢了。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于「神之眼」….mp3',
                },
                {
                    title: '有什么想要分享…',
                    text: '试问，常说「禅茶一味」，又说「剑禅一如」，那么剑和茶，又是什么关系呢？',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/有什么想要分享….mp3',
                },
                {
                    title: '感兴趣的见闻…',
                    text: '你在城中，见过枯萎的樱花树么？这种「枯」之美，让我想到春天盛开之景。不过别人似乎并不这么想，不再开花的樱树会被移走…就算一次也好，真想看到它再次开放。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/感兴趣的见闻….mp3',
                },
                {
                    title: '关于托马…',
                    text: '托马是我很重要的朋友，他的开朗和阳光总是感染着我。某种意义上来说，他就像是我的另一个兄长一样，已经成为了「神里家」的一员。',
                    reading:
                        'Tuōmǎ shì wǒ hěn zhòngyào de péngyǒu, tā de kāilǎng hé yángguāng zǒng shì gǎnrǎnzhe wǒ. Mǒu zhǒng yìyì shànglái shuō, tā jiù xiàng shì wǒ de lìng yīgè xiōngzhǎng yīyàng, yǐjīng chéngwéile "Shénlǐ-jiā" de yī yuán.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于托马….mp3',
                },
                {
                    title: '关于九条裟罗…',
                    text: '为「天领奉行」工作的九条裟罗…她总是一脸严肃。我和她曾经起过几次争端，不过她本质是忠义之士，这点无可否认。',
                    reading:
                        'Wèi "Tiānlǐng-fèngxíng" gōngzuò de Jiǔtiáo Shāluō... tā zǒng shì yī liǎn yánsù. Wǒ hé tā céngjīng qǐguò jǐ cì zhēngduān, bùguò tā běnzhí shì zhōngyì zhī shì, zhè diǎn wú kě fǒurèn.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于九条裟罗….mp3',
                },
                {
                    title: '关于鹿野院平藏…',
                    text: '鹿野院先生？他和九条小姐一样，是「天领奉行」的人。他…也是一个很有原则的人。对于这些「原则」的坚持，甚至比九条小姐更执着。只不过，什么事应该被算在这些「原则」之内，我想，或许只有鹿野院先生自己知道吧。',
                    reading:
                        'Lùyěyuàn-xiānshēng? Tā hé Jiǔtiáo-xiǎojiě yīyàng, shì "Tiānlǐng-fèngxíng" de rén. Tā... yěshì yīgè hěn yǒu yuánzé de rén. Duìyú zhèxiē "yuánzé" de jiānchí, shènzhì bǐ Jiǔtiáo-xiǎojiě gèng zhízhuó. Zhǐ bùguò, shénme shì yīnggāi bèi suàn zài zhèxiē "yuánzé" zhī nèi, wǒ xiǎng, huòxǔ zhǐyǒu Lùyěyuàn-xiānshēng zìjǐ zhīdào ba.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于鹿野院平藏….mp3',
                },
                {
                    title: '关于早柚…',
                    text: '早柚这孩子，最近有没有给你添什么麻烦呢？如果看见她偷懒，可以直接告诉我。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于早柚….mp3',
                },
                {
                    title: '关于雷电将军・猜测',
                    text: '对大御所大人的看法吗？这并不该由我等下属随意议论。但…将军大人她，在追求「永恒」之路上，可能也很孤独吧。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于雷电将军・猜测.mp3',
                },
                {
                    title: '关于雷电将军・立场',
                    text: '见证了「无想的一刀」并且活了下来，该说是堪称伟业的经历了吧。虽然对我来说，她是真正的神明，一念之间可以更改稻妻的命运，但如果是和你起了冲突的话…我一定会站在你这一边的。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于雷电将军・立场.mp3',
                },
                {
                    title: '关于八重神子…',
                    text: '我和八重宫司大人的合作向来很愉快。你看，操办节庆庆典非常劳神费力，营收多半也不好看。但是八重宫司大人操办的产业，真的既风雅又有收成。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于八重神子….mp3',
                },
                {
                    title: '关于神里绫人…',
                    text: '作为神里家的家主，兄长平日需要出面诸多场合。我虽尽力分担兄长肩上所负担的责任，却也无法缓和他常年积压在身的疲倦。唉，就当是为了妹妹着想，希望你能劝言，让兄长多多注意身体啊。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于神里绫人….mp3',
                },
                {
                    title: '关于宵宫…',
                    text: '操办节庆庆典是社奉行和巫女众的责任，那位烟火专家也的确能让气氛热烈起来，彼此合作多了，因而渐渐熟络。嗯？治安和消防问题吗？我们也会一并纳入预先规划的。因为这些原因而看不到烟花，才会让人们心中留下缺憾吧。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/关于宵宫….mp3',
                },
                {
                    title: '想要了解绫华・其一',
                    text: '你的请求，对我来说很特别呢。既然把你当做朋友，我也应坦诚以待。不过，事关神里家的秘密，还希望你能守口如瓶。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/想要了解绫华・其一.mp3',
                },
                {
                    title: '想要了解绫华・其二',
                    text: '曾经，神里家因为没能保护好国宝级别的刀工，遭受了不小的冲击。受愚人众阴谋算计，我们折损了诸多臣下，受到许多责罚。父亲甚至因之早衰，神里家在幕府中的地位也一落千丈…好在兄长继任后力挽狂澜。不过，家门虽已复兴，社奉行一系也上下齐心，但大事要事方面，仍靠兄长定夺。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/想要了解绫华・其二.mp3',
                },
                {
                    title: '想要了解绫华・其三',
                    text: '将军所传的锻刀之术，也因星象、用途、矿质、炉火环境、人之性格、元素变化的不同，而有所区分。即是刀工之间所说的「雷电五传」。能锻造名刀的刀工，也被算作是本领通神的神事相关人员，归属统筹文化、艺术、祭祀的社奉行一派管理。因此，出现了刀工背叛的事情，自然就是神里家的督办不力了。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/想要了解绫华・其三.mp3',
                },
                {
                    title: '想要了解绫华・其四',
                    text: '对我来说，母亲是意义非凡的存在。端庄、优雅，无论遇到怎样的局面都会露出沉静的笑容，以从容不迫的态度，操持着神里家大大小小的事务，说母亲是完美的化身也不为过。但自从她离世的那一刻起，我就深切地意识到，我已经不是那个可以躲在母亲身后的小绫华了。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/想要了解绫华・其四.mp3',
                },
                {
                    title: '想要了解绫华・其五',
                    text: '接下来要说的话，可能不太符合「稻妻幕府社奉行神里家」的身份。不过，就我的判断，你应该能容许我小小的任性吧？…稍微有点累了…可以让我靠一下你的肩膀吗？一下就好。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/想要了解绫华・其五.mp3',
                },
                {
                    title: '绫华的爱好…',
                    text: '风雅之物我都很喜欢：雅乐诗词、棋艺与舞蹈。你也感兴趣吗？',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/绫华的爱好….mp3',
                },
                {
                    title: '绫华的烦恼・忧虑',
                    text: '烦恼吗？啊，是啊。只要生活在这个世界上，就难免遇到种种不如意的事情。但如果是因为自己的事情，就让周遭的人担心的话…果然，我还是不能说…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/绫华的烦恼・忧虑.mp3',
                },
                {
                    title: '绫华的烦恼・心意',
                    text: '「坦率」，真的是一件很难的事情。我必须不断告诫自己是神里家的大小姐，在无数双眼睛，无数人的期盼之下摆出完美无缺的姿态。这样的我，是否也该追求自己的愿望呢，是否也该…让你理解我的心意呢…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/绫华的烦恼・心意.mp3',
                },
                {
                    title: '喜欢的食物…',
                    text: '我对异国料理很有兴趣，虽然很少有尝试的机会。嗯…如果是要局限在稻妻料理内的话…应该是「茶泡饭」吧。不过，不能给一般客人看见，我也是偷偷告诉你的。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/喜欢的食物….mp3',
                },
                {
                    title: '讨厌的食物…',
                    text: '虽然不是不能吃，但我对动物脂肪或内脏大概会有点…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/讨厌的食物….mp3',
                },
                {
                    title: '收到赠礼・其一',
                    text: '嗯…我真是太幸福了…',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/收到赠礼・其一.mp3',
                },
                {
                    title: '收到赠礼・其二',
                    text: '谢谢你让我有机会尝试这道菜，我会把它的味道记在心里的。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/收到赠礼・其二.mp3',
                },
                {
                    title: '收到赠礼・其三',
                    text: '啊…稍微有点油腻了呢。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/收到赠礼・其三.mp3',
                },
                {
                    title: '生日…',
                    text: '请随我来！只要走一小段路，不会耽搁你太长时间的哦。打听到你的生日之后，我就提前了一段时间开始筹备。比起名贵的礼物，我妄自猜测…或许这样的礼物会更合我们的情谊。此次，就请让我以扇舞为礼吧。那么，失礼了。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/生日….mp3',
                },
                {
                    title: '突破的感受・起',
                    text: '非常感谢。与你切磋使我受益良多，相信在剑术上也能更进一步。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/突破的感受・起.mp3',
                },
                {
                    title: '突破的感受・承',
                    text: '多亏你的点拨。有你相助，我对自己的能力也理解得更透彻了。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/突破的感受・承.mp3',
                },
                {
                    title: '突破的感受・转',
                    text: '感觉更加游刃有余了。处理社奉行事务之余，甚至有空尝试一些新的事情。要来试试最近学做的点心吗？',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/突破的感受・转.mp3',
                },
                {
                    title: '突破的感受・合',
                    text: '「尝有所思，斯世如磐；孰料浮世事，留驻难。」…抱歉，明明是值得高兴的时候，我却想起了那么悲伤的诗歌。和你相处的时间过于畅怀，竟然让我害怕再次失去。真是…失态了呀。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/zh/突破的感受・合.mp3',
                },
            ],
            ja: [
                {
                    title: '初めまして…',
                    text: '稲妻神里流太刀術免許皆伝——神里綾華、参ります！よろしくお願いします。',
                    reading: 'Inazuma Kamisato-ryuu Tachi-jutsu Menkyo Kaiden⸺ Kamisato Ayaka, mairimasu!Yoroshiku o-negaishimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/初めまして….mp3',
                },
                {
                    title: '世間話・長閑',
                    text: 'この長閑な時間がもっと増えると嬉しいのですが…ふふ、私って欲張りですね。',
                    reading: 'Kono nodoka-na jikan ga motto fueru to ureshii no desu ga... Fufu, watakushi tte yokubari desu ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/世間話・長閑.mp3',
                },
                {
                    title: '世間話・刀',
                    text: '刀はお茶と同じく、丁寧に味わってこそ、本来の趣が分かるものです。',
                    reading: 'Katana wa o-cha to onajiku, teinei ni ajiwatte koso, honrai no omomuki ga wakaru mono desu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/世間話・刀.mp3',
                },
                {
                    title: '世間話・ぼんやり',
                    text: 'これが旅人さんの普段の暮らしですか。ふふ、また貴方に少し近づけた気がします。',
                    reading: 'Kore ga Tabibito-san no fudan no kurashi desu ka. Fufu, mata anata ni sukoshi chikadzuketa ki ga shimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/世間話・ぼんやり.mp3',
                },
                {
                    title: '世間話・名刀',
                    text: '刀は業を支え、匠は宝を有す。',
                    reading: 'Katana wa waza wo sasae, takumi wa takara wo yuusu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/世間話・名刀.mp3',
                },
                {
                    title: '雨の日…',
                    text: '私と共に雨宿りをしましょう。',
                    reading: 'Watakushi to tomo ni amayadori wo shimashou.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/雨の日….mp3',
                },
                {
                    title: '雷の日…',
                    text: '将軍様…何か訴えているのでしょうか？',
                    reading: 'Shougun-sama... Nani ka uttaeteiru no deshou ka?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/雷の日….mp3',
                },
                {
                    title: '雪の日…',
                    text: '「この雪の 消残る時に いざ行かな山橘の 実の照るも見む」…美しい景色には、やはりお茶がなくてはいけませんね。',
                    reading: '"Kono yuki no kenokoru toki ni iza yuka nayamatachibana no mi no teru mo mimu"...Utsukushii keshiki ni wa, yahari o-cha ga nakute wa ikemasen ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/雪の日….mp3',
                },
                {
                    title: '晴れの日…',
                    text: '麗らかな日和です。どこかへ行きませんか？',
                    reading: 'Uraraka-na hiyori desu. Doko ka he ikimasen ka?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/晴れの日….mp3',
                },
                {
                    title: '風の日…',
                    text: '目を閉じ、風を感じてみてください…どうですか？気持ちいいでしょう？',
                    reading: 'Me wo toji, kaze wo kanjite mite kudasai... Dou desu ka? Kimochi ii deshou?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/風の日….mp3',
                },
                {
                    title: 'おはよう…',
                    text: 'おはようございます、旅人さん。こうして朝の時間に貴方とお会いできると…良い一日を送れるような気がします。',
                    reading: 'Ohayou gozaimasu, Tabibito-san. Koushite asa no jikan ni anata to o-ai dekiru to... Yoi ichinichi wo okureru you-na ki ga shimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/おはよう….mp3',
                },
                {
                    title: 'こんにちは…',
                    text: 'こんにちは。昼食の後はどうしても眠くなってしまいますね。眠気を覚ますために、将棋などいかがでしょうか？',
                    reading: 'Konnichiwa. Chuushoku no ato wa doushite mo nemuku natte shimaimasu ne. Nemuke wo samasu tame ni, shougi nado ikaga deshou ka?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/こんにちは….mp3',
                },
                {
                    title: 'こんばんは…',
                    text: 'こんばんは。夜風が気持ちよく、とてもいい夜ですね。',
                    reading: 'Konbanwa. Yokaze ga kimochi yoku, totemo ii yoru desu ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/こんばんは….mp3',
                },
                {
                    title: 'おやすみ…',
                    text: '夢と知っていれば目覚めぬものを、もう少し一緒にいさせてほしいのに。',
                    reading: 'Yume to shitteireba mezamenu mono wo, mou sukoshi issho ni isasete hoshii no ni.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/おやすみ….mp3',
                },
                {
                    title: '神里綾華自身について・社奉行',
                    text: '「稲妻幕府社奉行神里家」、稲妻の名門にして筆頭。三奉行の一つとして、祭祀活動や人道、芸術などの管理を担っています。両親が亡くなってからは、私とお兄様が一族の業務を受け継ぎました。',
                    reading:
                        '"Inazuma Bakufu Sha-bugyou Kamisato-ke", Inazuma no meimon ni shite hittou. San-bugyou no hitotsu to shite, saishi katsudou ya jindou, geijutsu nado no kanri wo ninatte imasu. Ryoushin ga nakunatte kara wa, watakushi to onii-sama ga ichizoku no gyoumu wo uketsugimashita.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華自身について・社奉行.mp3',
                },
                {
                    title: '神里綾華自身について・立場',
                    text: '多くの方々が私を敬重してくださるのは、私を「白鷺の姫君」や社奉行神里家の令嬢として見ているからです。彼らが敬重しているのは私の立場であって、綾華という一個人とは関係ございません…ですので、私と本当に近しい関係になれるお方は、おそらく…',
                    reading:
                        'Ooku no katagata ga watakushi wo keichou shite kudasaru no wa, watakushi wo "Shirasagi no Himegimi" ya Sha-bugyou Kamisato-ke no reijou to shite mite iru kara desu. Karera ga keichou shite iru no wa watakushi no tachiba de atte, Ayaka to iu ichikojin wa kankei gozaimasen...Desu no de, watakushi to hontou ni chikashii kankei ni nareru o-kata wa, osoraku...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華自身について・立場.mp3',
                },
                {
                    title: '神里綾華自身について・願い',
                    text: '今の私は、皆さんから信頼される人になりたいと思っています。その気持ちを鼓舞するものは、肩にのしかかる重責でも他人からの期待でもございません。貴方がすでにそのようなお方だからです。',
                    reading:
                        'Ima no watakushi wa, mina-san kara shinrai sareru hito ni naritai to omotte imasu. Sono kimochi wo kobu suru mono wa, kata ni noshikakaru juuseki de mo tanin kara no kitai de mo gozaimasen. Anata ga sude ni sono you-na o-kata dakara desu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華自身について・願い.mp3',
                },
                {
                    title: '茶屋について…',
                    text: '時間が空いていらしたら、共に木漏茶屋に行ってみませんか？こんな穏やかな日は、茶道の心得を通じて交流するのもまた一興かもしれませんよ。',
                    reading:
                        'Jikan ga aite irashitara, tomo ni Komore Djaya ni itte mimasen ka? Konna odayaka-na hi wa, sadou no kokoroe wo tsuujite kouryuu suru no mo mata ikkyou ka mo shiremasen yo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/茶屋について….mp3',
                },
                {
                    title: 'お祭りについて…',
                    text: '機会がございましたら、貴方と共に異国のお祭りを過ごしてみたいです。その地の風習、礼儀作法、お勧めのお土産など…それらすべてをこの私に…ご教授いただけませんでしょうか？',
                    reading:
                        'Kikai ga gozaimashitara, anata to tomo ni ikoku no o-matsuri wo sugoshite mitai desu. Sono ji no fuushuu, reigi sahou, o-susume no o-miyage nado... Sorera subete wo kono watakushi ni... Go-kyouju itadakemasen deshou ka?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/お祭りについて….mp3',
                },
                {
                    title: '「神の目」について…',
                    text: '「神の目」、それは大志を抱く者に与えられる証です。私の志ですか…？それは…いえ、やはり秘密にさせてください。些細な夢に過ぎませんので。',
                    reading:
                        '"Kami no Me", sore wa taishi wo idaku mono ni ataerareru akashi desu. Watakushi no kokorozashi desu ka...? Sore wa... ie, yahari himitsu ni sasete kudasai. Sasai-na yume ni sugimasen no de.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/「神の目」について….mp3',
                },
                {
                    title: 'シェアしたいこと…',
                    text: 'よく「茶禅一味」、「剣禅一如」と言いますが、刀とお茶にどのような関係があるのでしょうか？',
                    reading: 'Yoku "chazen ichimi", "kenzen ichinyo" to iimasu ga, katana to ocha ni dono you-na kankei ga aru no deshou ka?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/シェアしたいこと….mp3',
                },
                {
                    title: '興味のあること…',
                    text: '城内で枯れた櫻を見たことはございますか？この「枯れる」という美があるからこそ、春に咲き誇る姿を想像できるのです。しかし、他の方はそう思っていません。枯れた櫻はすぐに取り除かれてしまいます。一度でもいいので、それらがまた咲く姿を見てみたいものですね。',
                    reading:
                        'Jounai de kareta sakura wo mita koto wa gozaimasu ka? Kono "kareru" to iu bi ga aru kara koso, haru ni sakihokoru sugata wo souzou dekiru no desu. Shikashi, hoka no kata wa sou omotte imasen. Kareta sakura wa sugu ni torinozokarete shimaimasu. Ichido de mo ii no de, sorera ga mata saku sugata wo mite mitai mono desu ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/興味のあること….mp3',
                },
                {
                    title: 'トーマについて…',
                    text: 'トーマは私の大切な友人です。彼の明るさと陽気さにはいつも感化されてきました。ある意味、彼はもう一人の兄のような存在で、すでに「神里家」の一員だとも思っています。',
                    reading:
                        'Tooma wa watakushi no taisetsu-na yuujin desu. Kare no akarusa to youkisa ni wa itsumo kanka sarete kimashita. Aru imi, kare wa mou hitori no ani no you-na sonzai de, sude ni "Kamisato-ke" no ichi\'in da to mo omotte imasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/トーマについて….mp3',
                },
                {
                    title: '九条裟羅について…',
                    text: '「天領奉行」に付き従う九条裟羅…彼女はいつも真剣な顔をしていますね。私も彼女と幾度か口論になったことがございます。しかし、彼女の本質は忠義によるもの、その点だけは否定できません。',
                    reading:
                        '"Tenryou-bugyou" ni tsukishitagau Kujou Sara... Kanojo wa itsumo shinken-na kao wo shite imasu ne. Watakushi mo kanojo to ikudo ka kouron ni natta koto ga gozaimasu. Shikashi, kanojo no honshitsu wa chuugi ni yoru mono, sono ten dake wa hitei dekimasen.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/九条裟羅について….mp3',
                },
                {
                    title: '鹿野院平蔵について…',
                    text: '鹿野院さんですか？彼は九条さんと同じように、「天領奉行」の人間です。彼も…自分の信条を持っているお方です。その「信条」を守る執着心は、九条さんよりも強いかもしれません。ただ、何を以って「信条」というべきかは、鹿野院さんのみが知ることでしょう…',
                    reading:
                        'Shikanoin-san desu ka? Kare wa Kujou-san to onaji you ni, "Tenryou-bugyou" no ningen desu. Kare mo... jibun no shinjou wo motte iru o-kata desu. Sono "shinjou" wo mamoru shuuchakushin wa, Kujou-san yori mo tsuyoi ka mo shiremasen. Tada, nani wo motte "shinjou" to iu beki ka wa, Shikanoin-san nomi ga shiru koto deshou...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/鹿野院平蔵について….mp3',
                },
                {
                    title: '早柚について…',
                    text: 'この所、早柚ちゃんは貴方に迷惑をかけていないでしょうか？ふふ、彼女がサボっているところを見かけたら、私に言ってくださいね。',
                    reading: 'Kono tokoro, Sayu-chan wa anata ni meiwaku wo kakete inai deshou ka? Fufu, kanojo ga sabotte iru tokoro wo mikaketara, watakushi ni itte kudasai ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/早柚について….mp3',
                },
                {
                    title: '雷電将軍について・推察',
                    text: '将軍様のお考え？それは私ども配下が議論できることではございません。ただ…「永遠」を追い求める道において、孤独を感じることもあるかもしれませんね。',
                    reading:
                        'Shougun-sama no o-kangae? Sore wa watakushi-domo haika ga giron dekiru koto de wa gozaimasen. Tada... "Eien" wo oimotomeru michi ni oite, kodoku wo kanjiru koto mo aru ka mo shiremasen ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/雷電将軍について・推察.mp3',
                },
                {
                    title: '雷電将軍について・立場',
                    text: '「無想の一太刀」を見ても生き延びられたこと、それだけでも偉業と言えるでしょう。私にとってあのお方は本物の神であり、稲妻の命運を一瞬にして変えることのできる存在です。しかし、もしあのお方と貴方が衝突した場合…私は必ず貴方を選びます。',
                    reading:
                        '"Musou no Hitotachi" wo mite mo ikinobirareta koto, sore dake de mo igyou to ieru deshou. Watakushi ni totte ano o-kata wa honmono no kami de ari, Inazuma no meiun wo isshun ni shite kaeru koto no dekiru sonzai desu. Shikashi, moshi ano o-kata to anata ga shoutotsu shita baai... Watakushi wa kanarazu anata wo erabimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/雷電将軍について・立場.mp3',
                },
                {
                    title: '八重神子について…',
                    text: '私と八重宮司様はかねてより協力関係を続けてきました。お祭りの開催は非常に手間がかかる上、収益もそれほど良いものではございません。しかし八重宮司様が仕切られた事業は、優雅さを保ちながら収益化にも成功されています。',
                    reading:
                        'Watakushi to Yae Guuji-sama wa kanete yori kyouryoku kankei wo tsudzukete kimashita. O-matsuri no kaisai wa hijou ni tema ga kakaru ue, shuueki mo sorehodo yoi mono de wa gozaimasen. Shikashi Yae Guuji-sama ga shikirareta jigyou wa, yuugasa wo tamochinagara shuuekika ni mo seikou sarete imasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/八重神子について….mp3',
                },
                {
                    title: '神里綾人について…',
                    text: '神里家の当主として、お兄様は平素より数々の場所に出向いています。私もお兄様の重荷を負担しようと尽力しているのですが、それでも長年蓄積した疲労を緩和させてあげることはできませんでした。はぁ…妹のためだと思って、体には気を付けてと貴方からもお兄様に言ってください。',
                    reading:
                        'Kamisato-ke no toushu to shite, onii-sama wa heiso yori kazukazu no basho ni demuite imasu. Watakushi mo onii-sama no omoni wo futan shiyou to jinryoku shite iru no desu ga, sore de mo naga-nen chikuseki shita hirou wo kanwa sasete ageru koto wa dekimasen deshita. Haa... imouto no tame da to omotte, karada ni wa ki wo tsukete to anata kara mo onii-sama ni itte kudasai.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾人について….mp3',
                },
                {
                    title: '宵宮について…',
                    text: 'お祭りの開催は社奉行と巫女の役目ですが、あの花火師の方もお祭りの雰囲気に貢献しています。度重なる協同から、今ではお互いをよく知る関係になりました。…なんでしょう？治安と消防の問題？もちろん事前に対策を立てていますよ。そのような理由で花火が見られなくなってしまっては、皆さん残念がるでしょうから。',
                    reading:
                        "O-matsuri no kaisai wa Sha-bugyou to miko no yakume desu ga, ano hanabi-shi no kata mo o-matsuri no fun'iki ni kouken shite imasu. Tabikasanaru kyoudou kara, ima de wa o-tagai wo yoku shiru kankei ni narimashita....Nan deshou? Chian to shoubou no mondai? Mochiron jizen ni taisaku wo tatete imasu yo. Sono you-na riyuu de hanabi ga mirarenakunatte shimatte wa, minna-san zannen garu deshou kara.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/宵宮について….mp3',
                },
                {
                    title: '神里綾華を知る・1',
                    text: '貴方の要求は私にとって特別なものです。貴方を友人と見なした以上、私も真摯に向き合う必要がございます。しかし、神里家の秘密については…どうか他言しないようお願いします。',
                    reading:
                        'Anata no youkyuu wa watakushi ni totte tokubetsu-na mono desu. Anata wo yuujin to minashita ijou, watakushi mo shinshi ni mukiau hitsuyou ga gozaimasu. Shikashi, Kamisato-ke no himitsu ni tsuite wa... douka tagon shinai you o-negaishimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華を知る・1.mp3',
                },
                {
                    title: '神里綾華を知る・2',
                    text: 'かつて、神里家は国宝級の刀工を守れなかったことで大打撃を受けました。ファデュイの奸計にかかり、多くの臣下を失い、数多の罰を受けたのです。お父様はその重圧のせいで急激に衰え、神里家の幕府においての地位も急落していきました…幸いお兄様が家業を継いでから挽回することができましたが、一族が復興して一致団結を保っている今も、重要な場面は未だにお兄様に頼るしかございません。',
                    reading:
                        'Katsute, Kamisato-ke wa kokuhoukyuu no toukou wo mamorenakatta koto de daidageki wo ukemashita. Fadyui no kankei ni kakari, ooku no shinka wo ushinai, amata no batsu wo uketa no desu. Otou-sama wa sono juuatsu no sei de kyuugeki ni otoroe, Kamisato-ke no bakufu ni oite no chii mo kyuuraku shite ikimashita... Saiwai onii-sama ga kagyou wo tsuide kara bankai suru koto ga dekimashita ga, ichizoku ga fukkou shite icchidanketsu wo tamotte iru ima mo, juuyou-na bamen wa imada ni onii-sama ni tayoru shika gozaimasen.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華を知る・2.mp3',
                },
                {
                    title: '神里綾華を知る・3',
                    text: '将軍様が伝授した刀の鍛造技法は、星の有り様、用途、鉱石の質、炉火の環境、人の性格、異なる元素変化、それぞれの違いによって差が生まれます。即ち、刀工の間で語り継がれている「雷電五箇伝」。名刀を鍛造できる刀工は神の領域に触れると言われることから、神事にまつわる人員と見なされます。ですので刀工も、文化や芸術、祭祀などを司る社奉行の管轄下に入っています。刀工から裏切りが出たということは、自ずと神里家の監督不行き届きとなるのです。',
                    reading:
                        'Shougun-sama ga denju shita katana no tanzou gihou wa, hoshi no ariyou, youto, kouseki no shitsu, roka no kankyou, hito no seikaku, kotonaru genso henka, sorezore no chigai ni yotte sa ga umaremasu. Sunawachi, toukou no aida de katari tsugarete iru "Raiden Gokaden". Meitou wo tanzou dekiru toukou wa kami no ryouiki ni fureru to iwareru koto kara, shinji ni matsuwaru jin\'in to minasaremasu. Desu no de toukou mo, bunka ya geijutsu, saishi nado wo tsukasadoru Sha-bugyou no kankatsuka ni haitte imasu. Toukou kara uragiri ga deta to iu koto wa, onozuto Kamisato-ke no kantoku fuyukitodoki to naru no desu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華を知る・3.mp3',
                },
                {
                    title: '神里綾華を知る・4',
                    text: '私にとって、お母様はとても大きな存在でした。どのような局面に陥ろうと落ち着いた笑顔を見せ、神里家の業務を淡々と取り仕切る端正で優雅な姿。完璧という概念の化身といっても過言ではございません…お母様が去ったあの瞬間から、私は感じたのです——もうお母様の後ろに隠れているだけの子供ではいられないと。',
                    reading:
                        'Watakushi ni totte, okaa-sama wa totemo ookina sonzai deshita. Dono you-na kyokumen ni ochiirou to ochitsuita egao wo mise, Kamisato-ke no gyoumu wo tantan to torishikiru tansei de yuuga-na sugata. Kanpeki to iu gainen no keshin to itte mo kagon de wa gozaimasen... Okaa-sama ga satta ano shunkan kara, watakushi wa kanjita no desu -- Mou okaa-sama no ushiro ni kakurete iru dake no kodomo de wa irarenai to.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華を知る・4.mp3',
                },
                {
                    title: '神里綾華を知る・5',
                    text: '今から言うことは、「稲妻幕府社奉行神里家」の肩書きにふさわしくないものかもしれません。ですが、貴方は私のワガママを受け入れてくださる方だと信じています。…少々疲れてしまいました…貴方の肩に寄りかかってもよろしいでしょうか？少しだけで…いいので。',
                    reading:
                        'Ima kara iu koto wa, "Inazuma Bakufu Sha-bugyou Kamisato-ke" no katagaki ni fusawashikunai mono ka mo shiremasen. Desu ga, anata wa watakushi no wagamama wo ukeirete kudasaru kata da to shinjite imasu....Shoushou tsukarete shimaimashita... Anata no kata ni yorikakatte mo yoroshii deshou ka? Sukoshi dake de... ii no de.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華を知る・5.mp3',
                },
                {
                    title: '神里綾華の趣味…',
                    text: '趣を感じられるものは何でも好きです。雅楽の詩、囲碁将棋や踊り。貴方も興味ございますでしょうか？',
                    reading: 'Omomuki wo kanjirareru mono wa nandemo suki desu. Gagaku no shi, igo shougi ya odori. Anata mo kyoumi gozaimasu deshou ka?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華の趣味….mp3',
                },
                {
                    title: '神里綾華の悩み・配慮',
                    text: '悩みですか？そうですね、この世に生きる以上、必然的に数々の不満に遭遇するでしょう。しかし、自分のことで周囲の方を心配させるのは…やはり私にはできません…',
                    reading:
                        'Nayami desu ka? Sou desu ne, kono yo ni ikiru ijou, hitsuzen-teki ni kazukazu no fuman ni souguu suru deshou. Shikashi, jibun no koto de shuui no kata wo shinpai saseru no wa... yahari watakushi ni wa dekimasen...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華の悩み・配慮.mp3',
                },
                {
                    title: '神里綾華の悩み・気持ち',
                    text: '「素直」になるというのは、非常に難しいことです。私は神里家の長女として、無数の注目と期待を浴びせられています。それに応えるため、常に完璧な姿勢で居続けることを自分に戒めてきました。そんな私が、自分の願いを追求してしまってもいいのでしょうか…私の気持ちを、貴方に理解してもらっても…いいのでしょうか…',
                    reading:
                        '"Sunao" ni naru to iu no wa, hijou ni muzukashii koto desu. Watakushi wa Kamisato-ke no choujo to shite, musuu no chuumoku to kitai wo abiserarete imasu. Sore ni kotaeru tame, tsune ni kanpeki-na shisei de itsudzukeru koto wo jibun ni imashimete kimashita. Sonna watakushi ga, jibun no negai wo tsuikyuu shite shimatte mo ii no deshou ka... Watakushi no kimochi wo, anata ni rikai shite moratte mo... ii no deshou ka...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/神里綾華の悩み・気持ち.mp3',
                },
                {
                    title: '好きな食べ物…',
                    text: '食べられる機会は少ないのですが…私は異国料理に興味がございます。稲妻料理に限定するなら…「お茶漬け」が好きです。しかし、一般のお客さまにお茶漬けをすする姿はお見せできません…貴方に教えたのも内緒ですよ。',
                    reading:
                        'Taberareru kikai wa sukunai no desu ga... watakushi wa ikoku ryouri ni kyoumi ga gozaimasu. Inazuma ryouri ni gentei suru nara... "O-chadzuke" ga suki desu. Shikashi, ippan no okyaku-sama ni o-chadzuke wo susuru sugata wa o-mise dekimasen... Anata ni oshieta no mo naisho desu yo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/好きな食べ物….mp3',
                },
                {
                    title: '嫌いな食べ物…',
                    text: '食べられないわけではございませんが、動物の脂肪や内臓はちょっと…',
                    reading: 'Taberarenai wake de wa gozaimasen ga, doubutsu no shibou ya naizou wa chotto...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/嫌いな食べ物….mp3',
                },
                {
                    title: '贈り物を受け取る・1',
                    text: 'ふふっ…私は本当に幸せ者ですね…',
                    reading: "Fufu'... Watakushi wa hontou ni shiawasemono desu ne...",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/贈り物を受け取る・1.mp3',
                },
                {
                    title: '贈り物を受け取る・2',
                    text: 'このような料理を味わわせていただき、ありがとうございます。この味を心に留めておきます。',
                    reading: 'Kono you-na ryouri wo ajiwawasete itadaki, arigatou gozaimasu. Kono aji wo kokoro ni todomete okimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/贈り物を受け取る・2.mp3',
                },
                {
                    title: '贈り物を受け取る・3',
                    text: 'おや…少し油が多いようですね。',
                    reading: 'Oya... Sukoshi abura ga ooi you desu ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/贈り物を受け取る・3.mp3',
                },
                {
                    title: '誕生日…',
                    text: '私についてきてくれますか。そう遠くありませんので、それほどお時間は取らせません。貴方の誕生日を知ってから、事前に準備をしていたのです。私の勝手な想像ですが、どんなに高貴な贈り物よりも、この方が私たちの関係に合っていると考えました。今回は、私の剣扇舞を貴方へ贈ります。では、参ります。',
                    reading:
                        'Watakushi ni tsuite kite kuremasu ka. Sou tooku arimasen no de, sorehodo o-jikan wa torasemasen.Anata no tanjoubi wo shitte kara, jizen ni junbi wo shite ita no desu. Watakushi no katte-na souzou desu ga, donna ni kouki-na okurimono yori mo, kono hou ga watakushi-tachi no kankei ni atte iru to kangaemashita. Konkai wa, watakushi no kensenbu wo anata he okurimasu.De wa, mairimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/誕生日….mp3',
                },
                {
                    title: '突破した感想・起',
                    text: '感謝いたします。貴方との手合わせから色々なものが学べました。剣術においてもさらに上達することができると思います。',
                    reading: 'Kansha itashimasu. Anata to no teawase kara iroiro na mono ga manabemashita. Kenjutsu ni oite mo sara ni joutatsu suru koto ga dekiru to omoimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/突破した感想・起.mp3',
                },
                {
                    title: '突破した感想・承',
                    text: 'ご指導ありがとうございます。貴方のおかげで、私は自分の能力への理解をより深めることができました。',
                    reading: 'Go-shidou arigatou gozaimasu. Anata no okage de, watakushi wa jibun no nouryoku he no rikai wo yori fukameru koto ga dekimashita.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/突破した感想・承.mp3',
                },
                {
                    title: '突破した感想・転',
                    text: 'ますます余裕を感じられるようになりました。社奉行の事務を片付ける傍ら、新しいことにも挑戦できるほどです。最近作ってみたお菓子を試食してみていただけませんか？',
                    reading:
                        'Masumasu yoyuu wo kanji rareru you ni narimashita. Sha-bugyou no jimu wo katazukeru katawara, atarashii koto ni mo chousen dekiru hodo desu. Saikin tsukuttemita o-kashi wo shishoku shite mite itadakemasen ka?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/突破した感想・転.mp3',
                },
                {
                    title: '突破した感想・結',
                    text: '「常磐なす かくしもがもと 思へども世の事なれば 留みかねつも」申し訳ございません、喜ばしいと思うべきこの時に、こんなに悲しい歌を思い出してしまいました。貴方と過ごす時間があまりにも心地よく、失うのが怖いと感じてしまったのです。本当に…失態ですね。',
                    reading:
                        '"Tokiwanasu kakushi moga moto omo he domoYo no koto nareba todomika netsu mo"Moushiwake gozaimasen, yorokobashii to omoubeki kono toki ni, konna ni kanashii uta wo omoidashite shimaimashita. Anata to sugosu jikan ga amari ni mo kokochiyoku, ushinau no ga kowai to kanjite shimatta no desu. Hontou ni... Shittai desu ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ja/突破した感想・結.mp3',
                },
            ],
            ko: [
                {
                    title: '첫 만남…',
                    text: '이나즈마의 카미사토류 태도술 계승자——카미사토 아야카 참전!잘 부탁드려요',
                    reading: 'Inajeuma-ui Kamisatoryu taedosum gyeseungja — Kamisato Ayaka chamjeon!Jal butakdeuryeoyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/첫 만남….mp3',
                },
                {
                    title: '잡담・안정',
                    text: '이렇게 여유롭고 평화로운 시간이 더 많았다면 좋을 텐데…. 전 욕심이 너무 많은가 봐요',
                    reading: 'Ireotge yeoyuropgo pyeonghwaroun sigani deo manatdamyeon joeul tende... Jeon yoksimi neomu maneunga bwayo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/잡담・안정.mp3',
                },
                {
                    title: '잡담・검',
                    text: '검은 차와 같이, 천천히 음미해야만 그 운치를 느낄 수 있어요',
                    reading: 'Geomeun chawa gachi, cheoncheonhi eummihaeyaman geu unchireul neukkil su isseoyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/잡담・검.mp3',
                },
                {
                    title: '잡담・멍 때리기',
                    text: '이게 여행자님의 일상생활이군요. 후후, 당신에 대해 조금 더 알게 된 거 같아요',
                    reading: 'Ige yeohaengjanim-ui ilsangsaenghwarigunyo. Huhu, dangsine daehae jogeum deo alge doen geo gatayo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/잡담・멍 때리기.mp3',
                },
                {
                    title: '잡담・명검',
                    text: '도검은 명장이 자신의 작품을 아끼는 것처럼 그 공예를 중시하죠',
                    reading: "Dogeomeun myeongjang'i jasin-ui jakpumeul akkineun geotcheoreom geu gongyereul jungsihajyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/잡담・명검.mp3',
                },
                {
                    title: '비가 올 때…',
                    text: '저랑 같이 비를 피하러 가요',
                    reading: 'Jeorang gachi bireul pihareo gayo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/비가 올 때….mp3',
                },
                {
                    title: '번개가 칠 때…',
                    text: '쇼군께서… 무언갈 하소연하고 있는 게 아닐까요?',
                    reading: 'Syogunkkeseo... mueongal hasoyeonhago itneun ge anilkkayo?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/번개가 칠 때….mp3',
                },
                {
                    title: '눈이 올 때…',
                    text: '「이 눈이 쌓였을 때 가야지, 산귤 열매가 눈에 비치는 모습을 보려면」…. 아, 이 아름다운 경치에 어울리는 차가 없어서 아쉽네요',
                    reading: '"I nuni ssayeosseul ttae gayaji, sangyul yeolmaega nune bichineun moseubeul boryeomyeon"... A, i areumdaun gyeongchie eoullineun chaga eopsseoseo aswipneyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/눈이 올 때….mp3',
                },
                {
                    title: '햇살이 좋을 때…',
                    text: '포근한 바람, 따스한 햇살. 같이 산책할래요?',
                    reading: 'Pogeunhan baram, ttaseuhan haessal. Gachi sanchaekhallaeyo?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/햇살이 좋을 때….mp3',
                },
                {
                    title: '바람이 불 때…',
                    text: '눈을 감고 바람이 불어오는 방향을 느껴봐요…. 기분 좋죠?',
                    reading: "Nuneul gamgo barami bureo'oneun banghyang'eul neukkyeobwayo... Gibun jyocho?",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/바람이 불 때….mp3',
                },
                {
                    title: '아침 인사…',
                    text: '좋은 아침이에요, 여행자님. 아침부터 이렇게 만나다니… 오늘은 모든 일이 잘 풀리겠어요',
                    reading: 'Joeun achimieyo, yeohaengjanim. Achimbuteo ireoke mannadani... Oneureun modeun iri jal pulligesseoyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아침 인사….mp3',
                },
                {
                    title: '점심 인사…',
                    text: '즐거운 오후에요. 점심을 먹고 난 후의 식곤증은 어쩔 수 없죠. 바둑을 두면서 졸음을 쫓는 건 어때요?',
                    reading: "Jeulgeoun ohueyo. Jeomsimeul meokgo nan hu-ui sikgonjeung'eun eojjeol su eopjyo. Badugeul dumyeonseo joreumuel jjotneun geon eottaeyo?",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/점심 인사….mp3',
                },
                {
                    title: '저녁 인사…',
                    text: '좋은 저녁이에요. 밤바람이 포근하니 아름다운 밤이 될 것 같네요',
                    reading: 'Joeun jeonyeogieyo. Bambarami pogeunhani areumdaun bami doel geot gatneyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/저녁 인사….mp3',
                },
                {
                    title: '굿나잇…',
                    text: '「꿈인 줄 알았다면 깨지 않았을 것을, 실제 만남보다 낫지 아니한가」',
                    reading: '"Kkumin jul aratdamyeon kkaeji anasseul geoseul, silje mannamboda natji anihanga".',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/굿나잇….mp3',
                },
                {
                    title: '아야카 자신에 대해・야시로 봉행',
                    text: '「이나즈마 막부 야시로 봉행 카미사토 가문」은 이나즈마 최고의 명문이에요. 삼봉행 중 하나로 제사와 문화 예술적인 부분을 주관하죠. 부모님이 돌아가신 후 가문의 모든 일은 오빠와 제가 담당하고 있어요',
                    reading:
                        '"Inajeuma Makbu Yasiro Bonghaeng Kamisato Gamun"eun Inajeuma choego-ui myeongmunieyo. Sambonghaeng jung hanaro jesawa munhwa yesuljeogin bubuneul jugwanhajyo. Bumonimi doragasin hu gamun-ui modeun ireun oppawa jega damdanghago isseoyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카 자신에 대해・야시로 봉행.mp3',
                },
                {
                    title: '아야카 자신에 대해・지위',
                    text: '사람들은 제가 「백로공주」이자 야시로 봉행 카미사토 가문의 장녀이기 때문에 절 존경해요. 그들이 존경하는 건 제 신분과 지위일 뿐이지, 제가 어떤 사람인지랑은 아무런 상관도 없죠…. 그래서 제게 진심으로 다가올 수 있는 사람은 어쩌면…',
                    reading:
                        "Saramdeureun jega \"Baekrogongju\"ija Yasiro Bonghaeng Kamisato gamun-ui jangnyeoigi ttaemune jeol jongyeonghaeyo. Geudeuri jon'gyeonghaneun geon je sinbungwa jiwi'il ppuniji, jega eotteon saraminjirang'eun amureon sanggwando eopjyo... Geuraeseo jege jinsimeuro dagaol su itneun sarameun eojjeomyeon...",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카 자신에 대해・지위.mp3',
                },
                {
                    title: '아야카 자신에 대해・염원',
                    text: '전 모두가 믿을 수 있는 사람이 되고 싶어요. 하지만 저를 나아가게 하는 건 더 이상 책임감이나 타인의 기대가 아니라, 당신 역시 저와 같은 사람이란 걸 알았기 때문이죠',
                    reading:
                        "Jeon moduga mideul su itneun sarami doego sipeoyo. Hajiman jeoreul na'agage haneun geon deo isang chaegimgamina tain-ui gidaega anira, dangsin yeoksi jeowa gateun saramiran geol aratgi ttaemunijyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카 자신에 대해・염원.mp3',
                },
                {
                    title: '우리에 대해・찻집',
                    text: '시간 있으시면 코모레 찻집으로 갈까요? 이렇게 평온한 날에 다도에 대해 이야기하는 것도 아주 재밌을 거예요',
                    reading: "Sigan isseusimyeon Komore chatjibeuro galkkayo? Ireotge pyeong'onhan nare dadoe daehae iyaginaneun geotdo aju jaemisseul geoyeyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/우리에 대해・찻집.mp3',
                },
                {
                    title: '우리에 대해・명절',
                    text: '기회가 된다면, 당신과 함께 이국의 명절을 보내고 싶어요. 꼭 지켜야 하는 현지 풍습, 예절과 규칙, 그리고 추천할만한 기념품 같은 것들을… 저한테 알려주실 수 있나요?',
                    reading:
                        'Gihoega doendamyeon, dangsingwa hamkke igugui myeongjeoreul bonaego sipeoyo. Kkok jikyeoya haneun hyeonji pungseup, yejeolgwa gyuchik, geurigo chucheonhalmanhan ginyeompum gateun geotdeureul... jeohante allyeojusil su itnayo?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/우리에 대해・명절.mp3',
                },
                {
                    title: '「신의 눈」에 대해…',
                    text: '「신의 눈」은 큰 뜻을 품은 자만이 얻을 수 있는 증표죠. 제가 품은 뜻을 물으신다면… 그건 비밀이에요. 아주 보잘것없는 꿈이거든요',
                    reading: '"Sin-ui Nun"eun keun tteuseul pumeun jamani eodeul su itneun jeungpyojyo. Jega pumeun tteuseul mureusindamyeon... geugeon bimirieyo. Aju bojalgeoteopeun kkumigeodeunyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/「신의 눈」에 대해….mp3',
                },
                {
                    title: '하고 싶은 이야기…',
                    text: '질문하나 할게요. 흔히 「선차일미(禪茶一味)」, 「검선일여(劍禪一如)」라고 하던데. 검과 차는 어떤 관계인가요?',
                    reading: 'Jilmunhana halgeyo. Heunhi "Seonchailmi", "Geonseomiryeo"rago hadeonde. Geomgwa chaneun eotteon gwangyeingayo?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/하고 싶은 이야기….mp3',
                },
                {
                    title: '흥미있는 일…',
                    text: '성안에서 메마른 벚나무를 보신 적 있나요? 「메마른 것」의 아름다움은 벚꽃이 만개한 아름다운 봄 풍경을 떠올리게 하죠. 하지만 다른 사람들의 생각은 다른가 봐요. 꽃이 피지 않는 벚나무는 바로 베어 버리더군요. 단 한 번이라도 그 꽃이 다시 피는 걸 보고 싶어요',
                    reading:
                        "Seong'anese memareun beotnamureun bosin jeok itnayo? \"Memareun geot\"-ui areumdaumeun beotkkochi mangaehan areumdaun bom punggyeong'eul tteo'olige hajyo. Hajiman dareun saramdeul-ui saenggageun darenga bwayo. Kkochi piji anneun beotnamuneun baro be'eo beorideogunyo. Dan han beonirado geu kkochi dasi pineun geol bogo sipeoyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/흥미있는 일….mp3',
                },
                {
                    title: '토마에 대해…',
                    text: '토마는 제 소중한 친구예요. 그의 햇살 같은 명랑함은 항상 절 행복하게 해주죠. 어떤 의미에서 그는 제 또 다른 오빠이자, 「카미사토 가문」의 일원이라고 할 수 있어요',
                    reading:
                        'Tomaneun je sojunghan chin\'guyeyo. Geu-u haetsal gateun myeongranghameun hangsang jeol haengbokhage haejujyo. Eotteon uimieseo geuneun je tto dareun oppaija, "Kamisato Gamun"-ui irwonirago hal su isseoyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/토마에 대해….mp3',
                },
                {
                    title: '쿠죠 사라에 대해…',
                    text: '「텐료봉행」을 위해 일하는 쿠죠 사라는… 늘 근엄함을 유지하죠. 그녀와 다툰 적도 있지만, 그녀의 충성심을 부정할 순 없어요',
                    reading:
                        '"Tenryo Bonghaeng"eul wihae ilhaneun Kujyo Saraneun... neul geuneomhameul yujihajyo. Geunyeowa datun jeokdo itjiman, geunyeo-ui chungseongsimeul bujeonghal sun eopsseoyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/쿠죠 사라에 대해….mp3',
                },
                {
                    title: '시카노인 헤이조에 대해…',
                    text: '시카노인 씨요? 그분도 쿠죠 씨처럼 「텐료봉행」의 일원이에요. 그분도… 원칙을 매우 중요시하죠. 「원칙」에 대한 집념이 쿠죠 씨보다도 강하답니다. 하지만 이런 「원칙」에 어떤 일들이 포함돼야 하는지는 오직 시카노인 씨만 알고 계시겠죠…',
                    reading:
                        'Sikanoin ssiyo? Geubundo Kujyo ssicheoreom "Tenryo Bonghaeng"-ui irwonieyo. Geubundo... wonchigeul maeu jungyosihajyo. "Wonchik"e daehan jipnyeomi Kujyo ssibodado ganghadapnida. Hajiman ireon "Wonchik"e eotteon ildeuri pohandwaeya haneunjineun ojik Sikanoin ssiman algo gyesigetjyo...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/시카노인 헤이조에 대해….mp3',
                },
                {
                    title: '사유에 대해…',
                    text: '요새 사유가 당신께 폐를 끼치진 않았나요? 후후, 만약 그 아이가 게으름 피우는 걸 보시면 꼭 저한테 알려주세요',
                    reading: "Yosae Sayuga dangsinkke pyereul kkichijin anatnayo? Huhu, manyak geu aiga ge'eureum piuneun geol bosimyeon kkok jeohante allyeojuseyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/사유에 대해….mp3',
                },
                {
                    title: '라이덴 쇼군에 대해・추측',
                    text: '쇼군에 대한 제 생각이요? 그건 저 같은 아랫사람이 함부로 얘기할 수 없는 부분이지만… 「영원」을 추구하는 과정에서 분명 외로우실 거라고 생각해요',
                    reading:
                        'Syogune daehan je saenggagiyo? Geugeon jeo gateun araetsarami hamburo yaegihal su eopneun bubunijiman... "Yeong\'won"eul chuguhaneun gwajeong\'eseo bunmyeong oerousil georago saenggakhaeyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/라이덴 쇼군에 대해・추측.mp3',
                },
                {
                    title: '라이덴 쇼군에 대해・입장',
                    text: '「무상의 일태도」를 목격하고도 살아남았다는 건 위대한 경험이라고 할 만하죠. 저에게 있어 그분은 이나즈마의 운명을 한순간에 바꿔 버릴 수 있는 진정한 신이지만, 만약 당신과 충돌이 생긴다면… 전 당신 편에 설 거예요',
                    reading:
                        '"Musang-ui Iltaedo"reul mokgyeokhagodo saranamatdaneun geon widaehan gyeongheomirago hal manhajyo. Jeoege isseo geubuneun Inajeuma-ui unmyeong\'eul hansungane bakkwo beoril su itneun jinjeonghan sinijiman, manyak dangsingwa chungdori saenggindamyeon... jeon dangsin pyeone seol geoeyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/라이덴 쇼군에 대해・입장.mp3',
                },
                {
                    title: '야에 미코에 대해…',
                    text: '야에 궁사님과 일하는 건 언제나 즐거워요. 축제를 준비하는 건 매우 힘들고 이익도 얼마 안 되지만, 야에 궁사님이 맡으신 사업은 고상하고 멋있으면서 수익성도 좋거든요',
                    reading:
                        "Yae gungsanimgwa ilhaneun geon eonjena jeulgeowoyo. Chukjereul junbihaneun geon maeu himdeulgo i'ikdo eolma an doejiman, Yae gungsanimi mateusin saeobeun gosanghago meosisseumyeonseo suikseongdo jokeodeunyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/야에 미코에 대해….mp3',
                },
                {
                    title: '카미사토 아야토에 대해…',
                    text: '오빠는 카미사토 가문의 가주로서 평소에 여러 곳에 얼굴을 비춰야 하죠. 제가 부담을 최대한 덜어주려고 노력하지만, 오빠의 오랜 피로를 완화시킬 순 없었어요. 휴, 동생을 생각해서라도 건강 좀 잘 챙기라고 말 좀 해주세요',
                    reading:
                        "Oppaneun Kamisato gamun-ui gajuroseo pyeongsoe yeoreo gose eolgureul bichwoya hajyo. Jega budameul choedaehan deoreojuryeogo noryeokhajiman, oppa-ui oraen piroreul wanhwasikil sun eopsseosseoyo. Hyu, dongsaeng'eul saenggakhaeseorado geongang jom jal chaenggirago mal jom haejuseyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/카미사토 아야토에 대해….mp3',
                },
                {
                    title: '요이미야에 대해…',
                    text: '축제를 운영하는 건 야시로 봉행과 무녀의 역할이지만, 그 폭죽 전문가도 축제를 떠들썩하게 만드는 데 일조한 셈이죠. 같이 일할 기회가 많아지다 보니 점점 친해졌어요.네? 치안과 소방 문제요? 사전 기획에 다 포함되어 있답니다. 이런 문제 때문에 불꽃놀이를 볼 수 없다면 사람들이 아쉬워할 거예요',
                    reading:
                        "Chukjereul unyeonghaneun geon Yasiro bonghaenggwa munyeo-ui yeokharijiman, geu pokjuk jeonmungado chukjereul tteodeulsseokhage mandeun de iljohan semijyo. Gachi ilhal gihoega manajida boni jeomjeom chinhaejyeosseoyo.Ne? Chiangwa sobang munjeyo? Sajeon gihoege da pohamdoe'eo itdapnida. Ireon munje ttaemune bulkkotnorireul bol su eopdamyeon saramdeuri aswiwohal geoyeyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/요이미야에 대해….mp3',
                },
                {
                    title: '아야카에 대해 알기・첫 번째',
                    text: '당신의 부탁은 제게 아주 특별해요. 당신을 친구로 여긴 이상 저도 당신에게 솔직해져야겠죠. 하지만 카미사토 가문의 비밀은… 부디 누설하지 말아 주세요',
                    reading:
                        "Dangsin-ui butageun jege aju teukbyeolhaeyo. Dangsineul chin'guro yeogin isang jeodo dangsinege soljikhaejyeoyagetjyo. Hajiman Kamisato gamun-ui bimireun... budi nuseolhaji mara juseyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카에 대해 알기・첫 번째.mp3',
                },
                {
                    title: '아야카에 대해 알기・두 번째',
                    text: '과거 카미사토 가문은 국보급의 도공을 지키지 못해서 큰 충격을 받은 적이 있어요. 우인단의 계략에 빠져 많은 가신을 잃고 처벌도 많이 받았죠. 그 일로 아버지가 일찍이 쇠약해지시면서 카미사토 가문은 한순간에 막부에서의 지위를 잃었어요…. 다행히 오빠가 자리를 즉시 이어받으면서 위기를 벗어날 수 있었죠. 가문이 다시 힘을 되찾고 야시로 봉행도 한 마음이 되었지만, 여전히 중대사는 오빠의 결정을 따르고 있어요',
                    reading:
                        "Gwageo Kamisato gamuneun gukbogeup-ui dogong'eul jikiji mothaeseo keun chunggyeogeul badeun jeogi isseoyo. Uindan-ui gyerage ppajyeo maneun gasineul ilko cheobeoldo mani badatjyo. Geu illo abeojiga iljjigi soeyakhaejisimyeonseo Kamisago gamuneun hansungane makbueseo-ui jiwireul ireosseoyo... Dahaenghi oppaga jarireul jeuksi ieobadeumyeonseo wigireul beoseonal su isseotjyo. Gamuni dasi himeul doechatgo Yasiro bonghaengdo han maeumi doe'eotjiman, yeoheonhi jungdaesaneun oppa-ui gyeoljeong'eul ttareugo isseoyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카에 대해 알기・두 번째.mp3',
                },
                {
                    title: '아야카에 대해 알기・세 번째',
                    text: '쇼군께서 전수하신 검을 단조하는 기술은 별의 형상, 용도, 광석의 질, 용광로의 환경, 사람의 성격, 원소 변화 등에 따라 달라져요. 이게 바로 도공들이 말하는 「뇌전오전」이죠. 훌륭한 도를 만들 수 있는 도공도 신통력이 있다고 여겨져서 문화와 예술, 제사를 담당하는 야시로 봉행 일파의 관리를 받아요. 그러다 보니 도공이 배신하는 일이 생기면 자연스레 카미사토 가문의 감독 소홀이 되는 거죠',
                    reading:
                        'Syogunkkeseo jeonsuhasin geomeul danjohaneun gisureun byeol-ui hyeongsang, yongdo gwangseok-ui jil, yonggwangro-ui hwangyeong, saram-ui seonggyeok, wonso byeonhwa deung\'e ttara dallajyeoyo. Ige baro dogongdeuri malhaneun "Noejeonojeon"ijyo. Hullyunghan doreul mandeul su itneun dogongdo sintongryeogi itdago yeogyeojyeoseo munhwawa yesul, jesareul damdanghaneun Yasiro bonghaeng ilpa-ui gwanrireul badayo. Geureoda boni dogong\'i baesinhaneun iri saenggimyeon jayeonseure Kamisato gamun-ui gamdok sohori doeneun geojyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카에 대해 알기・세 번째.mp3',
                },
                {
                    title: '아야카에 대해 알기・네 번째',
                    text: '어머니는 제게 아주 남다른 의미가 있는 분이세요. 단정하고 우아한 태도로 어떤 상황에서도 차분하게 웃으시며 카미사토 가문의 일을 모두 도맡아 하셨죠. 어머니는 그야말로 완벽하다고 해도 과언이 아니었지만… 그분이 세상을 떠나던 그 순간 깨달았어요, 전 더 이상 어머니 뒤에 숨어 있을 수 있는 어린아이가 아니라는 걸요',
                    reading:
                        "Eomeonineun jege aju namdareun uimiga itneun buniseyo. Danjeonghago uahan taedoro eotteon sanghwang'eseodo chabunhage useusimyeo Kamisago gamun-ui ireul modu domata hasyeotjyo. Eomonineun geuyamallo wanbyeokhadago haedo gwaeoni anieotjiman... Geubuni sesang'eul tteonadeon geu sungan kkaedarasseoyo, jeon deo isang eomoni dwie sumeo isseul su itneun eorinaiga aniraneun geolyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카에 대해 알기・네 번째.mp3',
                },
                {
                    title: '아야카에 대해 알기・다섯 번째',
                    text: '「이나즈마 막부 야시로 봉행 카미사토 가문」의 신분으로 이런 말 하기 껄끄럽지만… 당신은 이렇게 제멋대로인 저의 모습도 받아줄 것 같은 느낌이 들어요.…살짝 피곤하네요…. 어깨 좀 빌려줄래요? 아주 잠깐이면 돼요',
                    reading:
                        '"Inajeuma Makbu Yasiro Bonghaeng Kamisato Gamun"-ui sinbuneuro ireon mal hagi kkeolkkeureopjiman... dangsineun ireotge jemeotdaeroin jeo-ui moseupdo badajul geot gateun neukkimi deureoyo....Saljjak pigonhaneyo... Eokkae jom billyeojullaeyo? Aju jamkkanimyeon dwaeyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카에 대해 알기・다섯 번째.mp3',
                },
                {
                    title: '아야카의 취미…',
                    text: '고상하고 멋이 있는 건 전부 좋아해요. 아악, 시, 바둑, 춤 모두요. 당신도 좋아하시나요?',
                    reading: "Gosanghago meosi itneun geon jeonbu joahaeyo. A'ak, si, baduk, chum moduyo. Dangsindo joahasinayo?",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카의 취미….mp3',
                },
                {
                    title: '아야카의 고민・걱정',
                    text: '고민이요? 음, 그렇죠. 살다 보면 마음대로 할 수 없는 일들이 생길 수밖에 없죠. 하지만 제 일로 주변 사람들에게 걱정을 끼친다면… 역시, 전 말 못 하겠어요…',
                    reading:
                        "Gominiyo? Eum, georeotjyo. Salda bomyeon maeumdaero hal su eopneun ildeuri saenggil subakke eopjyo. Hajiman je illo jubyeon saramdeurege geokjeong'eul kkichindamyeon... Yeoksi, jeon mal mot hagesseoyo...",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카의 고민・걱정.mp3',
                },
                {
                    title: '아야카의 고민・마음',
                    text: '솔직해지는 건 정말 어려워요. 전 수많은 사람의 주목과 기대를 받는 카미사토 가문의 장녀로서 완벽한 모습을 보여줘야 한다고 끊임없이 다짐해 왔어요. 이런 제가 소망을 쫓아도 되는 걸까요? 당신에게… 제 마음을 보여줘도 되는 걸까요…?',
                    reading:
                        "Soljikhaejineun geon jeongmal eoryeowoyo. Jeon sumaneun saram-ui jumokgwa gidaereul batneun Kamisato gamun-ui jangnyeoroseo wanbyeokhan moseubeul boyeojwoya handago kkeunimeopssi dajimhae wasseoyo. Ireon jega somang'eul jjochado doeneun geolkkayo? Dangsinege... je maeumeul boyeojwodo doeneun geolkkayo...?",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/아야카의 고민・마음.mp3',
                },
                {
                    title: '좋아하는 음식…',
                    text: '전 이국적인 요리에 관심이 많아요. 먹어볼 기회는 거의 없지만…. 이나즈마 요리 중에서라면… 아마 「오차즈케」겠죠. 하지만 다른 사람한테 들키면 안 돼요…. 당신에게만 몰래 알려드리는 거거든요',
                    reading:
                        'Jeon igukjeogin yorie gwansimi manayo. Meogeobol gihoeneun geoui eopjiman... Inajeuma yori jung\'eseoramyeon... ama "Ochajeuke"getjyo. Hajiman dareun saramhante deulkimyeon an dwaeyo... Dangsinegeman mollae allyeodeurineun geogeodeunyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/좋아하는 음식….mp3',
                },
                {
                    title: '싫어하는 음식…',
                    text: '못 먹는 건 아니지만, 동물 지방이나 내장은 좀…',
                    reading: "Mot meokneun geon anijiman, dongmul jibang'ina naejang'eun jom...",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/싫어하는 음식….mp3',
                },
                {
                    title: '선물 획득・첫 번째',
                    text: '음… 저 정말 행복해요…',
                    reading: 'Eum... Jeo jeongmal haengbokhaeyo...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/선물 획득・첫 번째.mp3',
                },
                {
                    title: '선물 획득・두 번째',
                    text: '이런 요리를 맛볼 기회를 주셔서 감사해요. 이 맛은 평생 기억할게요',
                    reading: 'Ireon yorireul matbol gihoereul jusyeoseo gamsaehaeyo. I maseun pyeongsaeng gieokhalgeyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/선물 획득・두 번째.mp3',
                },
                {
                    title: '선물 획득・세 번째',
                    text: '아… 조금 기름지네요',
                    reading: 'A... Jogeum gireumjineyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/선물 획득・세 번째.mp3',
                },
                {
                    title: '생일…',
                    text: '절 따라오세요! 조금만 걸으면 되니까, 오래 걸리진 않을 거예요.당신의 생일을 알고 난 후부터 계속 준비했죠. 제 생각이긴 하지만… 비싼 선물보다 이런 게 저희 우정에 더 잘 맞을 것 같아요. 그래서 이번엔 부채춤을 준비했어요.그럼, 시작할게요',
                    reading:
                        "Jeol ttaraoseyo! Jogeumman georeumyeon doenikka, orae geollijin aneul geoyeyo.Dangsin-ui saeng'ireul algo nan hubuteo gyesok junbihaetjyo. Je saenggagigin hajiman... bissan seonmulboda ireon ge jeohui ujeong'e deo jal majeul geot gatayo. Geuraeseo igeonen buchaechumeul junbihaesseoyo.Geureom, sijakhalgeyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/생일….mp3',
                },
                {
                    title: '돌파의 느낌・기',
                    text: '정말 감사해요. 당신과 겨루면서 많은 걸 깨달았어요. 검술에도 분명 큰 도움이 될 거예요',
                    reading: 'Jeongmal gamsaehaeyo. Dangsingwa gyeorumyeonseo maneun geol kkaedarasseoyo. Geomsuredo bunmyeong keun doumi doel geoyeyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/돌파의 느낌・기.mp3',
                },
                {
                    title: '돌파의 느낌・승',
                    text: '당신의 조언과 도움 덕분에 제 능력을 더 정확하게 이해할 수 있게 됐어요',
                    reading: "Dangsin-ui joeon'gwa doum deokbune je neungryeogeul deo jeonghwakhage ihaehal su itge dwaesseoyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/돌파의 느낌・승.mp3',
                },
                {
                    title: '돌파의 느낌・전',
                    text: '훨씬 여유로워진 것 같아요. 야시로 봉행 일을 처리하면서 남은 시간에 새로운 일에 도전할 수 있을 정도예요. 최근에 새로 배운 디저트 드셔보실래요?',
                    reading:
                        'Hwolssin yeoyurowojin geot gatayo. Yasiro bonghaeng ireul cheorihamyeonseo nameun sigane saeroun ire dojeonhal su isseul jeongdoyeyo. Choegeune saero baeun dijeoteu deusyeobosillaeyo?',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/돌파의 느낌・전.mp3',
                },
                {
                    title: '돌파의 느낌・결',
                    text: '「반석처럼 영원하고 싶지만, 변해가는 세상은 아무도 붙잡을 수가 없네.」…죄송해요, 분명 기뻐해야 할 일인데 이렇게 슬픈 시가 떠올랐네요. 당신과 함께 지낸 시간이 너무 즐거워서 잃게 될까 봐 두려워하다니…. 부끄러운 모습을 보였군요',
                    reading:
                        "\"Banseokcheoreom yeong'wonhago sipjiman, byeonhaeganeun sesang'eun amudo butjabeul suga eopne.\"...Joesonghaeyo, bunmyeong gippeohaeya hal irinde ireotge seulpeun siga tteo'olatney. Dangsingwa hamkke jinaen sigani neomu jeulgeowoseo ilke doelkka bwa duryeowohadani... bukkeureoun moseubeul boyeotgunyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/story/ko/돌파의 느낌・결.mp3',
                },
            ],
        },
        combat: {
            en: [
                {
                    title: 'Elemental Skill',
                    text: 'Take flight.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Elemental Skill 01.mp3',
                },
                {
                    title: 'Elemental Skill',
                    text: 'My apologies.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Elemental Skill 02.mp3',
                },
                {
                    title: 'Elemental Skill',
                    text: 'Whirling snow.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Elemental Skill 03.mp3',
                },
                {
                    title: 'Elemental Burst',
                    text: 'Embrace the ice.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Elemental Burst 01.mp3',
                },
                {
                    title: 'Elemental Burst',
                    text: 'Sakura swirl.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Elemental Burst 02.mp3',
                },
                {
                    title: 'Elemental Burst',
                    text: 'Kamisato Art: Soumetsu!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Elemental Burst 03.mp3',
                },
                {
                    title: 'Opening Treasure Chest',
                    text: 'Collecting rare and exquisite treasures... Yes, this seems suitably sophisticated.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Opening Treasure Chest 01.mp3',
                },
                {
                    title: 'Opening Treasure Chest',
                    text: 'Hehe... Today is a lucky day.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Opening Treasure Chest 02.mp3',
                },
                {
                    title: 'Opening Treasure Chest',
                    text: 'I shall treasure this good fortune.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Opening Treasure Chest 03.mp3',
                },
                {
                    title: 'Low HP',
                    text: 'I will not stand for this.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Low HP 01.mp3',
                },
                {
                    title: 'Low HP',
                    text: 'A worthy opponent...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Low HP 02.mp3',
                },
                {
                    title: 'Low HP',
                    text: 'We ought to end this!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Low HP 03.mp3',
                },
                {
                    title: 'Ally at Low HP',
                    text: 'Do not overdo it.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Ally at Low HP 01.mp3',
                },
                {
                    title: 'Ally at Low HP',
                    text: 'Take care!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Ally at Low HP 02.mp3',
                },
                {
                    title: 'Fallen',
                    text: 'Pardon my indiscretion...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Fallen 01.mp3',
                },
                {
                    title: 'Fallen',
                    text: 'Much remains... unfinished...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Fallen 02.mp3',
                },
                {
                    title: 'Fallen',
                    text: 'I have dishonored... our clan...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Fallen 03.mp3',
                },
                {
                    title: 'Heavy Hit Taken',
                    text: 'So rude!',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Heavy Hit Taken 01.mp3',
                },
                {
                    title: 'Heavy Hit Taken',
                    text: 'Unthinkable...',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Heavy Hit Taken 02.mp3',
                },
                {
                    title: 'Joining Party',
                    text: 'Kamisato Ayaka, present.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Joining Party 01.mp3',
                },
                {
                    title: 'Joining Party',
                    text: 'I await your instruction.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Joining Party 02.mp3',
                },
                {
                    title: 'Joining Party',
                    text: 'A pleasure to be working with you.',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/en/Joining Party 03.mp3',
                },
            ],
            zh: [
                {
                    title: '元素战技',
                    text: '起舞吧。',
                    reading: 'Qǐwǔ ba.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/元素战技 01.mp3',
                },
                {
                    title: '元素战技',
                    text: '失礼了。',
                    reading: 'Shīlǐle.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/元素战技 02.mp3',
                },
                {
                    title: '元素战技',
                    text: '雪纷飞。',
                    reading: 'Xuě fēnfēi.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/元素战技 03.mp3',
                },
                {
                    title: '元素爆发',
                    text: '…拿下了！',
                    reading: '...Ná xiàle!',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/元素爆发 01.mp3',
                },
                {
                    title: '元素爆发',
                    text: '樱吹雪。',
                    reading: 'Yīng chuīxuě.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/元素爆发 02.mp3',
                },
                {
                    title: '元素爆发',
                    text: '神里流…霜灭！',
                    reading: 'Shénlǐ-liú... Shuāng miè!',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/元素爆发 03.mp3',
                },
                {
                    title: '打开宝箱',
                    text: '寻珍觅奇…也算得一种雅趣。',
                    reading: 'Xún zhēn mì qí... Yě suàndé yī zhǒng yǎqù.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/打开宝箱 01.mp3',
                },
                {
                    title: '打开宝箱',
                    text: '呵呵…今日运势不错。',
                    reading: 'Hēhē... Jīnrì yùnshì bùcuò.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/打开宝箱 02.mp3',
                },
                {
                    title: '打开宝箱',
                    text: '我会珍惜这一份幸运。',
                    reading: 'Wǒ huì zhēnxī zhè yī fèn xìngyùn.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/打开宝箱 03.mp3',
                },
                {
                    title: '生命值低',
                    text: '不容小觑呢。',
                    reading: 'Bùróng xiǎo qù ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/生命值低 01.mp3',
                },
                {
                    title: '生命值低',
                    text: '久违的对手…',
                    reading: 'Jiǔwéi de duìshǒu...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/生命值低 02.mp3',
                },
                {
                    title: '生命值低',
                    text: '该决断了…',
                    reading: 'Gāi juéduànle...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/生命值低 03.mp3',
                },
                {
                    title: '同伴生命值低',
                    text: '不可大意。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/同伴生命值低 01.mp3',
                },
                {
                    title: '同伴生命值低',
                    text: '阁下务必小心。',
                    reading: null,
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/同伴生命值低 02.mp3',
                },
                {
                    title: '倒下',
                    text: '失态了…',
                    reading: 'Shītàile...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/倒下 01.mp3',
                },
                {
                    title: '倒下',
                    text: '我还有…未竟之事…',
                    reading: 'Wǒ hái yǒu... wèijìng zhī shì...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/倒下 02.mp3',
                },
                {
                    title: '倒下',
                    text: '让家族…蒙羞了…',
                    reading: 'Ràng jiāzú... méng xiūle...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/倒下 03.mp3',
                },
                {
                    title: '重受击',
                    text: '无礼的家伙…',
                    reading: 'Wú lǐ de jiāhuo...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/重受击 01.mp3',
                },
                {
                    title: '重受击',
                    text: '怎么会…',
                    reading: 'Zěnme huì...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/重受击 02.mp3',
                },
                {
                    title: '加入队伍',
                    text: '神里绫华，参上。',
                    reading: 'Shénlǐ Línghuá, cānshàng.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/加入队伍 01.mp3',
                },
                {
                    title: '加入队伍',
                    text: '烦请赐教。',
                    reading: 'Fánqǐng cìjiào.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/加入队伍 02.mp3',
                },
                {
                    title: '加入队伍',
                    text: '呵呵，请多关照。',
                    reading: 'Hēhē, qǐngduōguānzhào.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/zh/加入队伍 03.mp3',
                },
            ],
            ja: [
                {
                    title: '元素スキル',
                    text: '踊りなさい。',
                    reading: 'Odorinasai.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/元素スキル 01.mp3',
                },
                {
                    title: '元素スキル',
                    text: '失礼。',
                    reading: 'Shitsurei.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/元素スキル 02.mp3',
                },
                {
                    title: '元素スキル',
                    text: '雪よ、舞え。',
                    reading: 'Yuki yo, mae.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/元素スキル 03.mp3',
                },
                {
                    title: '元素爆発',
                    text: '…取った！',
                    reading: '...Totta!',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/元素爆発 01.mp3',
                },
                {
                    title: '元素爆発',
                    text: '櫻吹雪。',
                    reading: 'Sakura fubuki.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/元素爆発 02.mp3',
                },
                {
                    title: '元素爆発',
                    text: '神里流…霜滅！',
                    reading: 'Kamisato-ryuu... Soumetsu!',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/元素爆発 03.mp3',
                },
                {
                    title: '宝箱を開ける',
                    text: '宝探し…これもまた一興です。',
                    reading: 'Takara sagashi... kore mo mata ikkyou desu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/宝箱を開ける 01.mp3',
                },
                {
                    title: '宝箱を開ける',
                    text: 'ふふ…本日は運がいいようです。',
                    reading: 'Fufu... honjitsu wa un ga iiyou desu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/宝箱を開ける 02.mp3',
                },
                {
                    title: '宝箱を開ける',
                    text: 'この幸運を大切に。',
                    reading: "Kono kou'un wo taisetsu ni.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/宝箱を開ける 03.mp3',
                },
                {
                    title: 'HP低下',
                    text: '油断できませんね。',
                    reading: 'Yudan dekimasen ne.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/HP低下 01.mp3',
                },
                {
                    title: 'HP低下',
                    text: '久方ぶりの相手ですね…',
                    reading: 'Hisakataburi no aite desu ne...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/HP低下 02.mp3',
                },
                {
                    title: 'HP低下',
                    text: '決断しなければ…',
                    reading: 'Ketsudan shinakereba...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/HP低下 03.mp3',
                },
                {
                    title: '仲間HP低下',
                    text: '油断してはいけません。',
                    reading: 'Yudan shite wa ikemasen.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/仲間HP低下 01.mp3',
                },
                {
                    title: '仲間HP低下',
                    text: 'お気を付けください。',
                    reading: 'O-ki wo tsuke kudasai.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/仲間HP低下 02.mp3',
                },
                {
                    title: '戦闘不能',
                    text: '失態です…',
                    reading: 'Shittai desu...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/戦闘不能 01.mp3',
                },
                {
                    title: '戦闘不能',
                    text: 'まだ…やり残したことが…',
                    reading: 'Mada... yari nokoshita koto ga...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/戦闘不能 02.mp3',
                },
                {
                    title: '戦闘不能',
                    text: '一族の名に…泥を塗ってしまいました…',
                    reading: 'Ichizoku no na ni... doro wo nutte shimaimashita...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/戦闘不能 03.mp3',
                },
                {
                    title: '重ダメージを受ける',
                    text: '無礼者…',
                    reading: 'Burei-mono...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/重ダメージを受ける 01.mp3',
                },
                {
                    title: '重ダメージを受ける',
                    text: 'まさか…',
                    reading: 'Masaka...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/重ダメージを受ける 02.mp3',
                },
                {
                    title: 'チーム加入',
                    text: '神里綾華、参ります。',
                    reading: 'Kamisato Ayaka, mairimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/チーム加入 01.mp3',
                },
                {
                    title: 'チーム加入',
                    text: 'ご指導お願いいたします。',
                    reading: 'Go-shidou o-negai-itashimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/チーム加入 02.mp3',
                },
                {
                    title: 'チーム加入',
                    text: 'ふふ、よろしくお願いいたします。',
                    reading: 'Fufu, yoroshiku o-negai-itashimasu.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ja/チーム加入 03.mp3',
                },
            ],
            ko: [
                {
                    title: '원소전투 스킬',
                    text: '춤추거라',
                    reading: 'Chumchugeora.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/원소전투 스킬 01.mp3',
                },
                {
                    title: '원소전투 스킬',
                    text: '실례할게',
                    reading: 'Sillyehalge.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/원소전투 스킬 02.mp3',
                },
                {
                    title: '원소전투 스킬',
                    text: '흩날려라',
                    reading: 'Heutnallyeora.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/원소전투 스킬 03.mp3',
                },
                {
                    title: '원소폭발',
                    text: '도망칠 수 없어!',
                    reading: 'Domangchil su eopsseo!',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/원소폭발 01.mp3',
                },
                {
                    title: '원소폭발',
                    text: '벚꽃 눈보라',
                    reading: 'Beotkkot nunbora.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/원소폭발 02.mp3',
                },
                {
                    title: '원소폭발',
                    text: '카미사토류… 멸망의 서리!',
                    reading: 'Kamisatoryu... Myeolmang-ui seori!',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/원소폭발 03.mp3',
                },
                {
                    title: '보물 상자 열기',
                    text: '진기한 물건을 찾는 것도… 고상한 취미라 할 수 있죠',
                    reading: 'Jingihan mulgeoneul chatneun geotdo... gosanghan chwimira hal su itjyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/보물 상자 열기 01.mp3',
                },
                {
                    title: '보물 상자 열기',
                    text: '후후… 오늘은 운이 좋네요',
                    reading: 'Huhu... oneureun uni jotneyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/보물 상자 열기 02.mp3',
                },
                {
                    title: '보물 상자 열기',
                    text: '이 행운, 소중히 간직할게요',
                    reading: "I haeng'un sojunghi ganjikhalgeyo.",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/보물 상자 열기 03.mp3',
                },
                {
                    title: 'HP 부족',
                    text: '얕보면 안 되겠군요',
                    reading: 'Yatbomyeon an doegetgunyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/HP 부족 01.mp3',
                },
                {
                    title: 'HP 부족',
                    text: '오랫동안 기다렸던 상대로군요…',
                    reading: "Oraetdong'an gidaryeotdeon sangdaerogunyo...",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/HP 부족 02.mp3',
                },
                {
                    title: 'HP 부족',
                    text: '결정을 내릴 때인가…',
                    reading: "Gyeoljeong'eul naeril ttaeinga...",
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/HP 부족 03.mp3',
                },
                {
                    title: '동료 HP 감소',
                    text: '방심하면 안 됩니다',
                    reading: 'Bangsimhamyeon an doepnida.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/동료 HP 감소 01.mp3',
                },
                {
                    title: '동료 HP 감소',
                    text: '반드시 조심해 주세요',
                    reading: 'Bandeusi josimhae juseyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/동료 HP 감소 02.mp3',
                },
                {
                    title: '전투 불능',
                    text: '추한 모습을 보였군요…',
                    reading: 'Chuhan moseubeul boyeotgunyo...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/전투 불능 01.mp3',
                },
                {
                    title: '전투 불능',
                    text: '아직… 끝내지 못한 일이…',
                    reading: 'Ajik... kkeutnaeji mothan iri...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/전투 불능 02.mp3',
                },
                {
                    title: '전투 불능',
                    text: '가문에… 수치를 안겨드렸네요…',
                    reading: 'Gamune... suchireul angyeodeuryeotneyo...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/전투 불능 03.mp3',
                },
                {
                    title: '강공격 피격',
                    text: '무례한 녀석…',
                    reading: 'Muryehan nyeoseok...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/강공격 피격 01.mp3',
                },
                {
                    title: '강공격 피격',
                    text: '어떻게…',
                    reading: 'Eotteotge...',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/강공격 피격 02.mp3',
                },
                {
                    title: '파티 가입',
                    text: '카미사토 아야카, 참전',
                    reading: 'Kamisato Ayaka, chamjeon.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/파티 가입 01.mp3',
                },
                {
                    title: '파티 가입',
                    text: '한 수 가르쳐 주세요',
                    reading: 'Han su gareuchyeo juseyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/파티 가입 02.mp3',
                },
                {
                    title: '파티 가입',
                    text: '후후, 잘 부탁드려요',
                    reading: 'Huhu, jal butakdeuryeoyo.',
                    audio: 'assets/character/voice_overs/Kamisato Ayaka/combat/ko/파티 가입 03.mp3',
                },
            ],
        },
    },
    demo_music: {
        name: 'Shirasagi Princess',
        url: 'assets/character/demo_music/Kamisato Ayaka.mp3',
    },
    build: {
        version: '4.1',
        type: 'On-field DPS',
        weapons: [
            {
                name: 'Mistsplitter Reforged',
                icon: 'assets/weapons/Mistsplitter Reforged.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'Haran Geppaku Futsu',
                icon: 'assets/weapons/Haran Geppaku Futsu.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'Primordial Jade Cutter',
                icon: 'assets/weapons/Primordial Jade Cutter.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'Light of Foliar Incision',
                icon: 'assets/weapons/Light of Foliar Incision.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'Summit Shaper',
                icon: 'assets/weapons/Summit Shaper.avif',
                quality: '5',
                how_to_obtain: 'Weapon Event Wishes',
            },
            {
                name: 'Finale of the Deep',
                icon: 'assets/weapons/Finale of the Deep.avif',
                quality: '4',
                how_to_obtain: 'Forging',
            },
            {
                name: 'Skyward Blade',
                icon: 'assets/weapons/Skyward Blade.avif',
                quality: '5',
                how_to_obtain: 'Wishes',
            },
            {
                name: 'Finale of the Deep',
                icon: 'assets/weapons/Finale of the Deep.avif',
                quality: '4',
                how_to_obtain: 'Forging',
            },
            {
                name: 'Aquila Favonia',
                icon: 'assets/weapons/Aquila Favonia.avif',
                quality: '5',
                how_to_obtain: 'Wishes',
            },
            {
                name: 'Amenoma Kageuchi',
                icon: 'assets/weapons/Amenoma Kageuchi.avif',
                quality: '4',
                how_to_obtain: 'Forging',
            },
            {
                name: 'Kagotsurube Isshin',
                icon: 'assets/weapons/Kagotsurube Isshin.avif',
                quality: '4',
                how_to_obtain: 'Ere the End, a Glance Back Quest',
            },
            {
                name: 'The Black Sword',
                icon: 'assets/weapons/The Black Sword.avif',
                quality: '4',
                how_to_obtain: 'Battle Pass  (Gnostic Hymn)',
            },
            {
                name: 'Amenoma Kageuchi',
                icon: 'assets/weapons/Amenoma Kageuchi.avif',
                quality: '4',
                how_to_obtain: 'Forging',
            },
            {
                name: 'Harbinger of Dawn',
                icon: 'assets/weapons/Harbinger of Dawn.avif',
                quality: '3',
                how_to_obtain: "WishesKaeya's Gain QuestTalk to Nanako",
            },
            {
                name: 'The Black Sword',
                icon: 'assets/weapons/The Black Sword.avif',
                quality: '4',
                how_to_obtain: 'Battle Pass (Gnostic Hymn)',
            },
            {
                name: 'Blackcliff Longsword',
                icon: 'assets/weapons/Blackcliff Longsword.avif',
                quality: '4',
                how_to_obtain: "Paimon's Bargains",
            },
        ],
        artifacts: ['4 Piece Blizzard Strayer'],
        talents: ['Burst', 'Normal Attack', 'Skill'],
        main_stats: ['ATK%', 'Cryo DMG Bonus', 'CRIT DMG / ATK%'],
        sub_stats: ['ER (until requirement)', 'CRIT Rate / CRIT DMG', 'ATK%'],
        teams: [
            [
                {
                    name: 'Kamisato Ayaka',
                    icon: 'assets/character/icon/Kamisato Ayaka.avif',
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
                    name: 'Mona',
                    icon: 'assets/character/icon/Mona.avif',
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
            ],
            [
                {
                    name: 'Kamisato Ayaka',
                    icon: 'assets/character/icon/Kamisato Ayaka.avif',
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
                    name: 'Sangonomiya Kokomi',
                    icon: 'assets/character/icon/Sangonomiya Kokomi.avif',
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
            ],
            [
                {
                    name: 'Kamisato Ayaka',
                    icon: 'assets/character/icon/Kamisato Ayaka.avif',
                    quality: '5',
                    element: {
                        name: 'Cryo',
                        icon: 'assets/elements/Cryo.avif',
                    },
                },
                {
                    name: 'Rosaria',
                    icon: 'assets/character/icon/Rosaria.avif',
                    quality: '4',
                    element: {
                        name: 'Cryo',
                        icon: 'assets/elements/Cryo.avif',
                    },
                },
                {
                    name: 'Sangonomiya Kokomi',
                    icon: 'assets/character/icon/Sangonomiya Kokomi.avif',
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
            ],
            [
                {
                    name: 'Kamisato Ayaka',
                    icon: 'assets/character/icon/Kamisato Ayaka.avif',
                    quality: '5',
                    element: {
                        name: 'Cryo',
                        icon: 'assets/elements/Cryo.avif',
                    },
                },
                {
                    name: 'Diona',
                    icon: 'assets/character/icon/Diona.avif',
                    quality: '4',
                    element: {
                        name: 'Cryo',
                        icon: 'assets/elements/Cryo.avif',
                    },
                },
                {
                    name: 'Mona',
                    icon: 'assets/character/icon/Mona.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Venti',
                    icon: 'assets/character/icon/Venti.avif',
                    quality: '5',
                    element: {
                        name: 'Anemo',
                        icon: 'assets/elements/Anemo.avif',
                    },
                },
            ],
            [
                {
                    name: 'Kamisato Ayaka',
                    icon: 'assets/character/icon/Kamisato Ayaka.avif',
                    quality: '5',
                    element: {
                        name: 'Cryo',
                        icon: 'assets/elements/Cryo.avif',
                    },
                },
                {
                    name: 'Diona',
                    icon: 'assets/character/icon/Diona.avif',
                    quality: '4',
                    element: {
                        name: 'Cryo',
                        icon: 'assets/elements/Cryo.avif',
                    },
                },
                {
                    name: 'Mona',
                    icon: 'assets/character/icon/Mona.avif',
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
            ],
            [
                {
                    name: 'Kamisato Ayaka',
                    icon: 'assets/character/icon/Kamisato Ayaka.avif',
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
                    name: 'Mona',
                    icon: 'assets/character/icon/Mona.avif',
                    quality: '5',
                    element: {
                        name: 'Hydro',
                        icon: 'assets/elements/Hydro.avif',
                    },
                },
                {
                    name: 'Venti',
                    icon: 'assets/character/icon/Venti.avif',
                    quality: '5',
                    element: {
                        name: 'Anemo',
                        icon: 'assets/elements/Anemo.avif',
                    },
                },
            ],
            [
                {
                    name: 'Kamisato Ayaka',
                    icon: 'assets/character/icon/Kamisato Ayaka.avif',
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
                    name: 'Diona',
                    icon: 'assets/character/icon/Diona.avif',
                    quality: '4',
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
            [
                {
                    name: 'Kamisato Ayaka',
                    icon: 'assets/character/icon/Kamisato Ayaka.avif',
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
                    name: 'Bennett',
                    icon: 'assets/character/icon/Bennett.avif',
                    quality: '4',
                    element: {
                        name: 'Pyro',
                        icon: 'assets/elements/Pyro.avif',
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
