const SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT_COMPONENTS = {
    CharacterHeader: {
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
                        <div>
                            <span class="info-label">Element:</span>
                            <span class="info-value">
                                <img :src="character.element.icon" :alt="character.element.name" class="element-icon" />
                                {{ character.element.name }}
                            </span>
                        </div>

                        <div>
                            <span class="info-label">Weapon:</span>
                            <span class="info-value">
                                <img :src="character.weapon.icon" :alt="character.weapon.name" class="weapon-icon" />
                                {{ character.weapon.name }}
                            </span>
                        </div>

                        <div v-if="character.region">
                            <span class="info-label">Region:</span>
                            <span class="info-value">
                                <img v-if="character.region.icon" :src="character.region.icon" :alt="character.region.name" class="region-icon" />
                                {{ character.region.name }}
                            </span>
                        </div>

                        <div>
                            <span class="info-label">Model:</span>
                            <span class="info-value">{{ character.model }}</span>
                        </div>

                        <div>
                            <span class="info-label">Birthday:</span>
                            <span class="info-value">{{ character.birthday }}</span>
                        </div>

                        <div>
                            <span class="info-label">Released:</span>
                            <span class="info-value">{{ character.release_date }} (v{{ character.version }})</span>
                        </div>

                        <div>
                            <span class="info-label">Titles:</span>
                            <span class="info-value">{{ character.titles.join(', ') }}</span>
                        </div>

                        <div>
                            <span class="info-label">Affiliations:</span>
                            <span class="info-value">{{ character.affiliations.join(', ') }}</span>
                        </div>

                        <div>
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
    },

    AscensionTab: {
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
                                    quality: material.quality,
                                });
                            } else {
                                this.totalMaterials.set(material.name, {
                                    value: material.value,
                                    icon: material.icon,
                                    quality: material.quality,
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
                                :data-materials="ascension.phase > 0 && ascension.cost ? JSON.stringify(ascension.cost.map(m => ({name: m.name, value: m.value, icon: m.icon, quality: m.quality}))) : ''"
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
                                    <div class="material-list">
                                        <div v-for="material in ascension.cost" class="material-item" :data-material="material.name">
                                            <div class="top-border w-100" :class="'quality-' + material.quality">
                                                <img :src="material.icon" :alt="material.name" :title="material.name" class="material-icon" />
                                            </div>
                                            <div class="name bottom-border w-100 h-100 d-flex justify-content-center">
                                                <span class="my-1 mx-3">x{{ material.value }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="total-materials" id="ascension-materials">
                    <h3>Total Ascension Materials</h3>
                    <div class="material-list">
                        <div v-for="[name, material] in totalMaterials" class="total-material-item" :data-material="material.name">
                            <div class="top-border w-100" :class="'quality-' + material.quality">
                                <img :src="material.icon" :alt="name" class="material-icon" :title="name" />
                            </div>
                            <div class="name bottom-border w-100 h-100 d-flex justify-content-center">
                                <span class="my-1 mx-3">{{ name }} x{{ material.value }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
    },

    TalentsTab: {
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
                                    quality: material.quality,
                                });
                            } else {
                                this.totalMaterials.set(material.name, {
                                    value: material.value,
                                    icon: material.icon,
                                    quality: material.quality,
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
                    <div v-for="talent in character.talents" class="p-3">
                        <div class="talent-header">
                            <img :src="talent.icon" :alt="talent.name" class="talent-icon m-0" />
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
                                :data-materials="JSON.stringify(level.cost.map(m => ({name: m.name, value: m.value, icon: m.icon, quality: m.quality})))"
                            >
                                <td class="checkbox-column">
                                    <input type="checkbox" class="talent-checkbox" :data-level="level.level" data-type="talent" checked @change="updateTotalMaterials" />
                                </td>
                                <td>Level {{ level.level }}</td>
                                <td>
                                    <div class="material-list">
                                        <div v-for="material in level.cost" class="material-item" :data-material="material.name">
                                            <div class="top-border w-100" :class="'quality-' + material.quality">
                                                <img :src="material.icon" :alt="material.name" :title="material.name" class="material-icon" />
                                            </div>
                                            <div class="name bottom-border w-100 h-100 d-flex justify-content-center">
                                                <span class="my-1 mx-3">x{{ material.value }}</span>
                                            </div>
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
                    <div class="material-list">
                        <div v-for="[name, material] in totalMaterials" class="total-material-item" :data-material="material.name">
                            <div class="top-border w-100" :class="'quality-' + material.quality">
                                <img :src="material.icon" :alt="name" :title="name" class="material-icon" />
                            </div>
                            <div class="name bottom-border w-100 h-100 d-flex justify-content-center">
                                <span class="my-1 mx-3">{{ name }} x{{ material.value }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
    },

    ConstellationsTab: {
        props: {
            character: Object,
        },
        template: html`
            <div id="constellations">
                <div class="constellations-info">
                    <div v-for="constellation in character.constellations" class="p-3">
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
    },

    BuildTab: {
        props: {
            character: Object,
        },
        data() {
            return {
                artifacts: this.character.build?.artifacts.map((x) => {
                    const artifact = ARTIFACTS.find((y) => y.name === x.split('pc ').at(-1));
                    return {
                        name: x,
                        icon: artifact?.icon,
                        quality: artifact?.how_to_obtain.at(-1).quality,
                    };
                }),
                talents: this.character.build?.talents.map((x) => {
                    let talent = null;
                    if (x === 'Skill') talent = this.character.talents[1];
                    else if (x === 'Burst') talent = this.character.talents[2];
                    else if (x === 'Normal Attack') talent = this.character.talents[0];

                    if (talent) return { name: talent.name, icon: talent.icon, type: talent.type };
                    return null;
                }),
                main_stats: this.transformStats(this.character.build.main_stats),
                sub_stats: this.transformStats(this.character.build.sub_stats),
            };
        },
        methods: {
            transformStats(stats) {
                const results = stats
                    .join('&')
                    .replaceAll(' / ', '&')
                    .split('&')
                    .join(' &> &')
                    .split(' &')
                    .map((x) => {
                        return {
                            value: x,
                            cssValue: this.simplifyStat(x),
                            isArrow: x === '>',
                        };
                    });
                return results;
            },
            simplifyStat(stat) {
                // if (stat.toLowerCase().includes('atk')) return 'atk';
                // if (stat.toLowerCase().includes('def')) return 'def';
                // if (stat.toLowerCase().includes('hp')) return 'hp';
                // if (stat.toLowerCase().includes('em')) return 'em';
                // if (stat.toLowerCase().includes('er')) return 'er';
                // if (stat.toLowerCase().includes('crit')) return 'crit';
                // if (stat.toLowerCase().includes('crit damage')) return 'cd';
                // if (stat.toLowerCase().includes('healing bonus')) return 'hp';
                if (stat.toLowerCase().includes('geo')) return 'geo-bg';
                if (stat.toLowerCase().includes('electro')) return 'electro-bg';
                if (stat.toLowerCase().includes('pyro')) return 'pyro-bg';
                if (stat.toLowerCase().includes('cryo')) return 'cryo-bg';
                if (stat.toLowerCase().includes('hydro')) return 'hydro-bg';
                if (stat.toLowerCase().includes('anemo')) return 'anemo-bg';
                if (stat.toLowerCase().includes('dendro')) return 'dendro-bg';
                // if (stat.toLowerCase().includes('flat')) return 'flat';
                return 'other';
            },
        },
        template: html`
            <div id="build">
                <div class="section-title">Weapons</div>
                <div class="weapons-grid">
                    <div v-for="(weapon, index) in character.build.weapons" class="weapon-item">
                        <div class="top-border w-100" :class="'quality-' + weapon.quality">
                            <img :src="weapon.icon" :alt="weapon.name" :title="weapon.name" />
                        </div>
                        <div class="name bottom-border w-100 h-100 d-flex justify-content-center">
                            <span class="my-1 mx-3">{{index + 1}}. {{ weapon.name }}</span>
                        </div>
                    </div>
                </div>

                <div class="section-title">Artifact Sets</div>
                <div class="artifacts-grid">
                    <div v-for="(artifact, index) in artifacts" class="artifact-item">
                        <div class="top-border w-100" :class="'quality-' + artifact.quality">
                            <img :src="artifact.icon" :alt="artifact.name" :title="artifact.name" />
                        </div>
                        <div class="name bottom-border w-100 h-100 d-flex justify-content-center">
                            <span class="my-1 mx-3">{{index + 1}}. {{ artifact.name }}</span>
                        </div>
                    </div>
                </div>

                <div class="d-flex mt-4 mb-3">
                    <span class="section-title m-0 p-0">Main Stats:</span>
                    <div class="stats-row ms-3">
                        <span v-for="stat in main_stats" :class="{ 'stat-badge': !stat.isArrow, 'arrow': stat.isArrow, [stat.cssValue]: !stat.isArrow }"> {{ stat.value }} </span>
                    </div>
                </div>

                <div class="d-flex mt-4 mb-3">
                    <span class="section-title m-0 p-0">Sub Stats:</span>
                    <div class="stats-row ms-3">
                        <span v-for="stat in sub_stats" :class="{ 'stat-badge': !stat.isArrow, 'arrow': stat.isArrow, [stat.cssValue]: !stat.isArrow }"> {{ stat.value }} </span>
                    </div>
                </div>

                <div class="section-title">Talent Priority</div>
                <div class="talent-priority">
                    <div v-for="(talent, index) in talents" class="talent-item name">
                        <div class="talent-number" :class="character.element.name.toLowerCase() + '-bg'">{{ index + 1 }}</div>
                        <div class="talent-icon">
                            <img :src="talent.icon" :alt="talent.name" :title="talent.name" />
                        </div>
                        <div class="talent-name">{{ talent.type }}</div>
                    </div>
                </div>

                <!-- TODO: teams -->
            </div>
        `,
    },

    VoiceOversTab: {
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
                                <button
                                    v-for="lang in ['en', 'ja', 'ko', 'zh']"
                                    :key="lang"
                                    :class="['filter-btn', { active: selectedLanguage === lang }]"
                                    :data-lang="lang"
                                    @click="setLanguage(lang)"
                                >
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
    },
};
