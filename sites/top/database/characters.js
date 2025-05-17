const CharacterHeader = {
    props: {
        character: Object,
    },
    template: html`
        <div class="character-header">
            <img :src="character.card_icon" :alt="character.name" class="character-image" />

            <div class="character-basics">
                <h1 :class="['character-name', character.element.name.toLowerCase()]">
                    {{ character.name }}
                    <span class="rarity-stars">{{ '★'.repeat(parseInt(character.quality)) }}</span>
                </h1>

                <div v-if="character.titles && character.titles.length" class="character-title">{{ character.titles[0] }}</div>

                <div class="character-info">
                    <div class="info-item">
                        <span class="info-label">Element:</span>
                        <span class="info-value">
                            <img :src="character.element.icon" :alt="character.element.name" class="element-icon" />
                            {{ character.element.name }}
                        </span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Weapon:</span>
                        <span class="info-value">
                            <img :src="character.weapon.icon" :alt="character.weapon.name" class="weapon-icon" />
                            {{ character.weapon.name }}
                        </span>
                    </div>

                    <div v-if="character.region" class="info-item">
                        <span class="info-label">Region:</span>
                        <span class="info-value">
                            <img v-if="character.region.icon" :src="character.region.icon" :alt="character.region.name" class="region-icon" />
                            {{ character.region.name }}
                        </span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Model:</span>
                        <span class="info-value">{{ character.model }}</span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Birthday:</span>
                        <span class="info-value">{{ character.birthday }}</span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Released:</span>
                        <span class="info-value">{{ character.release_date }} (v{{ character.version }})</span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Titles:</span>
                        <span class="info-value">{{ character.titles.join(', ') }}</span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Affiliations:</span>
                        <span class="info-value">{{ character.affiliations.join(', ') }}</span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">Special dish:</span>
                        <span class="info-value">
                            <img v-if="character.special_dish" :src="character.special_dish.icon" :alt="character.special_dish.name" class="element-icon" />
                            {{ character.special_dish?.name ?? 'N/A' }}
                        </span>
                    </div>
                </div>

                <div v-if="character.voice_actors && character.voice_actors.length" class="xcol-2">
                    <div class="voice-actors">
                        <h3>Voice Actors</h3>
                        <div v-for="va in character.voice_actors" class="voice-actor"><strong>{{ va.language }}:</strong> {{ va.actor }}</div>
                    </div>
                    <div v-if="character.demo_music" class="demo-music">
                        <h3>Demo Music</h3>
                        <audio preload="metadata" controls :src="character.demo_music.url"></audio>
                        <p>{{ character.demo_music.name }}</p>
                    </div>
                </div>
            </div>
        </div>
    `,
};

const AscensionTab = {
    props: {
        character: Object,
    },
    data() {
        return {
            totalMaterials: new Map(),
        };
    },
    mounted() {
        this.updateTotalMaterials();
    },
    methods: {
        updateTotalMaterials() {
            this.totalMaterials.clear();

            // Get all checked ascension checkboxes
            const checkedBoxes = this.$el.querySelectorAll('.ascension-checkbox:checked');

            checkedBoxes.forEach((checkbox) => {
                const row = checkbox.closest('tr');

                if (row.hasAttribute('data-materials')) {
                    const materials = JSON.parse(row.getAttribute('data-materials'));

                    materials.forEach((material) => {
                        if (this.totalMaterials.has(material.name)) {
                            this.totalMaterials.set(material.name, {
                                value: this.totalMaterials.get(material.name).value + material.value,
                                icon: material.icon,
                            });
                        } else {
                            this.totalMaterials.set(material.name, {
                                value: material.value,
                                icon: material.icon,
                            });
                        }
                    });
                }
            });

            // Force re-render of total materials
            this.$forceUpdate();
        },
    },
    template: html`
        <div id="ascensions">
            <div class="ascension-table">
                <table>
                    <thead>
                        <tr>
                            <th class="checkbox-column"></th>
                            <th>Phase</th>
                            <th>Levels</th>
                            <th>HP</th>
                            <th>ATK</th>
                            <th>DEF</th>
                            <th>{{ character.ascensions_materials_and_stats[0].primary_stat.name }}</th>
                            <th>Materials</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(ascension, index) in character.ascensions_materials_and_stats"
                            :key="'ascension-' + ascension.phase"
                            :data-phase="ascension.phase"
                            :data-materials="ascension.phase > 0 && ascension.cost ? JSON.stringify(ascension.cost.map(m => ({name: m.name, value: m.value, icon: m.icon}))) : ''"
                        >
                            <td class="checkbox-column">
                                <input
                                    v-if="ascension.phase > 0"
                                    type="checkbox"
                                    class="ascension-checkbox"
                                    :data-phase="ascension.phase"
                                    data-type="ascension"
                                    checked
                                    @change="updateTotalMaterials"
                                />
                            </td>
                            <td>{{ ascension.phase }}</td>
                            <td>
                                <div v-for="level in ascension.levels">{{ level.level }}</div>
                            </td>
                            <td>
                                <div v-for="level in ascension.levels">{{ Math.round(level.hp) }}</div>
                            </td>
                            <td>
                                <div v-for="level in ascension.levels">{{ Math.round(level.atk) }}</div>
                            </td>
                            <td>
                                <div v-for="level in ascension.levels">{{ Math.round(level.def) }}</div>
                            </td>
                            <td>{{ ascension.primary_stat.value }}</td>
                            <td v-if="ascension.phase === 0">-</td>
                            <td v-else-if="ascension.cost && ascension.cost.length">
                                <div class="materials-container">
                                    <div v-for="material in ascension.cost" class="material-item" :data-material="material.name">
                                        <img :src="material.icon" :alt="material.name" class="material-icon" />
                                        <span class="material-name">{{ material.name }} x{{ material.value }}</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="total-materials" id="ascension-materials">
                <h3>Total Ascension Materials</h3>
                <div class="total-material-list">
                    <div v-for="[name, material] in totalMaterials" class="total-material-item">
                        <img :src="material.icon" :alt="name" class="material-icon" />
                        <span class="material-name">{{ name }} x{{ material.value }}</span>
                    </div>
                </div>
            </div>
        </div>
    `,
};

const TalentsTab = {
    props: {
        character: Object,
    },
    data() {
        return {
            totalMaterials: new Map(),
        };
    },
    mounted() {
        this.updateTotalMaterials();
    },
    methods: {
        updateTotalMaterials() {
            this.totalMaterials.clear();

            // Get all checked talent checkboxes
            const checkedBoxes = this.$el.querySelectorAll('.talent-checkbox:checked');

            checkedBoxes.forEach((checkbox) => {
                const row = checkbox.closest('tr');

                if (row.hasAttribute('data-materials')) {
                    const materials = JSON.parse(row.getAttribute('data-materials'));

                    materials.forEach((material) => {
                        if (this.totalMaterials.has(material.name)) {
                            this.totalMaterials.set(material.name, {
                                value: this.totalMaterials.get(material.name).value + material.value,
                                icon: material.icon,
                            });
                        } else {
                            this.totalMaterials.set(material.name, {
                                value: material.value,
                                icon: material.icon,
                            });
                        }
                    });
                }
            });

            // Force re-render of total materials
            this.$forceUpdate();
        },
    },
    template: html`
        <div id="talents">
            <div class="talents-info">
                <div v-for="talent in character.talents" class="talent">
                    <div class="talent-header">
                        <img :src="talent.icon" :alt="talent.name" class="talent-icon" />
                        <h3 class="talent-name">{{ talent.name }}</h3>
                        <span class="talent-type">{{ talent.type }}</span>
                    </div>
                    <div class="talent-description">{{ talent.description }}</div>
                </div>
            </div>

            <div class="talent-level-table">
                <h3>Talent Level-Up Materials</h3>
                <table>
                    <thead>
                        <tr>
                            <th class="checkbox-column"></th>
                            <th>Level</th>
                            <th>Materials</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="level in character.talents_materials"
                            :key="'talent-' + level.level"
                            :data-level="level.level"
                            :data-materials="JSON.stringify(level.cost.map(m => ({name: m.name, value: m.value, icon: m.icon})))"
                        >
                            <td class="checkbox-column">
                                <input type="checkbox" class="talent-checkbox" :data-level="level.level" data-type="talent" checked @change="updateTotalMaterials" />
                            </td>
                            <td>Level {{ level.level }}</td>
                            <td>
                                <div class="materials-container">
                                    <div v-for="material in level.cost" class="material-item" :data-material="material.name">
                                        <img :src="material.icon" :alt="material.name" class="material-icon" />
                                        <span class="material-name">{{ material.name }} x{{ material.value }}</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p><em>Note: These materials are for leveling up one talent. For all three talents, multiply by 3.</em></p>
            </div>

            <div class="total-materials" id="talent-materials">
                <h3>Total Talent Level-Up Materials</h3>
                <div class="total-material-list">
                    <div v-for="[name, material] in totalMaterials" class="total-material-item">
                        <img :src="material.icon" :alt="name" class="material-icon" />
                        <span class="material-name">{{ name }} x{{ material.value }}</span>
                    </div>
                </div>
            </div>
        </div>
    `,
};

const ConstellationsTab = {
    props: {
        character: Object,
    },
    template: html`
        <div id="constellations">
            <div class="constellations-info">
                <div v-for="constellation in character.constellations" class="constellation">
                    <div class="constellation-header">
                        <img :src="constellation.icon" :alt="constellation.name" class="constellation-icon" />
                        <h3 class="constellation-name">{{ constellation.name }}</h3>
                        <span class="constellation-level">Level {{ constellation.level }}</span>
                    </div>
                    <div class="constellation-description">{{ constellation.description }}</div>
                </div>
            </div>
        </div>
    `,
};

const BuildTab = {
    props: {
        character: Object,
    },
    template: html`
        <div id="build">
            <img :src="character.build.infographic" />
        </div>
    `,
};

const VoiceOversTab = {
    props: {
        character: Object,
    },
    data() {
        return {
            selectedLanguage: 'en',
            selectedType: 'story',
        };
    },
    computed: {
        filteredVoiceLines() {
            if (!this.character.voice_overs) return [];
            return this.character.voice_overs[this.selectedType]?.[this.selectedLanguage] || [];
        },
    },
    methods: {
        setLanguage(lang) {
            this.selectedLanguage = lang;
        },
        setType(type) {
            this.selectedType = type;
        },
        playAudio(event, audioUrl) {
            const button = event.target;
            const audioContainer = button.closest('.audio-container');

            if (!audioContainer.querySelector('audio')) {
                const audio = document.createElement('audio');
                audio.controls = true;
                audio.src = audioUrl;

                // Replace button with audio element
                audioContainer.innerHTML = '';
                audioContainer.appendChild(audio);

                // Play automatically
                audio.addEventListener('canplaythrough', () => audio.play());
                audio.load();
            } else {
                // Toggle play/pause if audio already exists
                const audio = audioContainer.querySelector('audio');
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
            }
        },
        capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
    },
    template: html`
        <div id="voice-overs">
            <div class="voiceover-container">
                <div class="voiceover-header">
                    <div class="voiceover-filters">
                        <div class="filter-group" name="filter-language">
                            <span class="filter-group-label">Language:</span>
                            <button v-for="lang in ['en', 'ja', 'ko', 'zh']" :key="lang" :class="['filter-btn', { active: selectedLanguage === lang }]" :data-lang="lang" @click="setLanguage(lang)">
                                {{ lang.toUpperCase() }}
                            </button>
                        </div>
                        <div class="filter-group" name="filter-type">
                            <span class="filter-group-label">Type:</span>
                            <button v-for="type in ['story', 'combat']" :key="type" :class="['filter-btn', { active: selectedType === type }]" :data-type="type" @click="setType(type)">
                                {{ capitalize(type) }}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="voicelines-container">
                    <div v-for="voiceLine in filteredVoiceLines" class="voiceline-card">
                        <div class="voiceline-header">
                            <div class="voiceline-title">{{ voiceLine.title }}</div>
                            <div :class="[selectedType + '-badge']">{{ capitalize(selectedType) }}</div>
                        </div>
                        <div class="voiceline-content">
                            <div class="voiceline-text">{{ voiceLine.text }}</div>
                            <div class="audio-container" :data-audio-url="voiceLine.audio">
                                <button class="play-button" @click="playAudio($event, voiceLine.audio)">Play</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
};

const SITES_TOP_DATABASE_CHARACTERS_COMPONENT = {
    VUE_COMPONENT: Vue.createApp({
        components: {
            'character-header': CharacterHeader,
            'ascension-tab': AscensionTab,
            'talents-tab': TalentsTab,
            'constellations-tab': ConstellationsTab,
            'build-tab': BuildTab,
            'voice-overs-tab': VoiceOversTab,
            'loading-spinner': LoadingSpinner,
        },

        template: html`
            <div style="min-height: 250px; position: relative">
                <loading-spinner :isLoading="isLoading" style="border-radius: 50px;" />
                <div class="body p-4">
                    <!-- Header section -->
                    <div class="mb-3 d-flex justify-content-center" name="autocomplete"></div>

                    <img v-if="character" id="banner" style="width: 100%" :src="character.namecard.banner" :alt="character.name" />

                    <!-- Character header component -->
                    <character-header v-if="character" :character="character" />

                    <!-- Tabs Navigation -->
                    <div v-if="character" class="tabs-navigation">
                        <button
                            v-for="(tabName, index) in ['ascensions', 'talents', 'constellations', 'build', 'voice-overs']"
                            :key="tabName"
                            :class="['tab-button', { active: activeTab === tabName }]"
                            :data-tab="tabName"
                            @click="setActiveTab(tabName)"
                        >
                            {{ tabName.charAt(0).toUpperCase() + tabName.slice(1).replace('-', ' ') }}
                        </button>
                    </div>

                    <!-- Tab Content -->
                    <div v-if="character" class="tabs-content">
                        <ascension-tab v-if="character" :character="character" v-show="activeTab === 'ascensions'" />

                        <talents-tab v-if="character" :character="character" v-show="activeTab === 'talents'" />

                        <constellations-tab v-if="character" :character="character" v-show="activeTab === 'constellations'" />

                        <build-tab v-if="character" :character="character" v-show="activeTab === 'build'" />

                        <voice-overs-tab v-if="character" :character="character" v-show="activeTab === 'voice-overs'" />
                    </div>
                </div>
            </div>
        `,

        data() {
            return {
                character: null,
                activeTab: 'ascensions',
                isLoading: true,
                autocomplete: null,
            };
        },

        mounted() {
            document.querySelector(`#${MENU_ITEMS_TOP.database.id}`).addEventListener('click', this.initAutocomplete, { once: true });
        },

        methods: {
            initAutocomplete() {
                const autocompleteContainer = this.$el.querySelector('[name="autocomplete"]');
                this.autocomplete = new Autocomplete(autocompleteContainer, (selectedCharacter) => {
                    this.loadCharacterScript(selectedCharacter);
                });
                this.loadCharacterScript(getRandomCharacter());
            },

            loadRandomCharacter() {
                const randomCharacter = getRandomCharacter();
                this.loadCharacterScript(randomCharacter);
            },

            loadCharacterScript(characterToLoad) {
                this.isLoading = true;
                const characterScript = characterToLoad.name.replace(' ', '_').toUpperCase();
                const scriptSrc = `data/database/characters/${characterScript}.js`;

                if (this.isScriptLoaded(scriptSrc)) {
                    this.displayCharacterInfo(window[characterScript]);
                    return;
                }

                this.loadScript(`data/database/characters/${characterScript}.js`, () => {
                    setTimeout(() => {
                        this.displayCharacterInfo(window[characterScript]);
                    }, 1000);
                });
            },

            displayCharacterInfo(characterData) {
                this.character = characterData;
                this.isLoading = false;
            },

            setActiveTab(tabName) {
                this.activeTab = tabName;
            },

            isScriptLoaded(src) {
                return document.querySelector(`script[src="${src}"]`) !== null;
            },

            loadScript(src, callback) {
                const script = document.createElement('script');
                script.src = src;
                script.onload = callback;
                document.head.appendChild(script);
            },
        },
    }),

    onShow() {
        document.querySelector(`#${DATABASE.characters.id}`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${DATABASE.characters.id}`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_DATABASE_CHARACTERS_COMPONENT.VUE_COMPONENT.mount(`#${MENU_ITEMS_TOP.database.id} #${DATABASE.characters.id}`);
});
