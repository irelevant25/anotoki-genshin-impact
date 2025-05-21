const SITES_TOP_DATABASE_WEAPONS_FILTER_COMPONENT = {
    VUE_COMPONENT: {
        template: html`
            <div class="px-5 py-2">
                <div class="d-flex flex-wrap gap-2 justify-content-between py-3">
                    <div class="filter gap-2">
                        <div v-for="quality in qualities" :class="['quality-' + (quality ?? '0'), selectedQuality === quality ? 'selected' : '']" @click="toggleQualityFilter(quality)">
                            {{ quality === '0' ? '-' : quality }}
                        </div>
                    </div>
                    <div class="filter gap-2">
                        <img v-for="type in types" :src="type.icon" :class="selectedType === type.name ? 'selected' : ''" :title="type.name" @click="toggleTypeFilter(type.name)" />
                    </div>
                    <div class="filter">
                        <select type="select" class="form-select" @change="filterWeapons" ref="version">
                            <option value="" selected>Version</option>
                            <option v-for="version in versions" :value="version ?? 'none'">{{ version ?? 'none' }}</option>
                        </select>
                    </div>
                    <div class="filter">
                        <input type="text" class="form-control" placeholder="Weapon name" @input="filterWeapons" ref="name" />
                    </div>
                    <div class="filter">
                        <button class="btn btn-secondary" @click="resetFilters">Reset</button>
                    </div>
                </div>

                <div class="d-flex flex-row flex-wrap gap-2 justify-content-center py-3">
                    <div v-for="weapon in weapons" :data-link="weapon.name.replaceAll(' ', '_')" class="weapon-card-container">
                        <div class="d-flex flex-column weapon-card">
                            <img :src="weapon.icon" class="top-border" :class="'quality-' + (weapon.quality ?? '0')" :alt="weapon.icon" :title="weapon.name" />
                            <div class="name text-center bottom-border py-1">{{ weapon.name }}</div>
                        </div>
                    </div>
                </div>
            </div>
        `,

        data() {
            const qualities_map = new Set();
            WEAPONS.forEach((weapon) => {
                qualities_map.add(weapon.quality ?? '0');
            });
            const types_map = new Map();
            CHARACTERS.forEach((character) => {
                types_map.set(character.weapon.name, character.weapon);
            });
            const versions_map = new Set();
            WEAPONS.forEach((weapon) => {
                versions_map.add(weapon.version);
            });
            return {
                weapons: WEAPONS,
                qualities: Array.from(qualities_map.values()).sort(),
                types: Array.from(types_map.values()).sort(),
                versions: Array.from(versions_map.values()).sort(),
                selectedQuality: null,
                selectedType: null,
            };
        },

        methods: {
            toggleQualityFilter(quality) {
                // If selected, deselect it
                if (this.selectedQuality === quality) {
                    this.selectedQuality = null;
                } else {
                    this.selectedQuality = quality;
                }
                this.filterWeapons();
            },

            toggleTypeFilter(typeName) {
                // If selected, deselect it
                if (this.selectedType === typeName) {
                    this.selectedType = null;
                } else {
                    this.selectedType = typeName;
                }
                this.filterWeapons();
            },

            resetFilters() {
                // Reset all filters
                this.selectedQuality = null;
                this.selectedType = null;
                if (this.$refs.version) this.$refs.version.value = '';
                if (this.$refs.name) this.$refs.name.value = '';

                // Reset the weapons to show all
                this.weapons = WEAPONS;
            },

            filterWeapons() {
                this.weapons = WEAPONS.filter((weapon) => {
                    const quality_match = this.selectedQuality ? weapon.quality === (this.selectedQuality === '0' ? undefined : this.selectedQuality) : true;
                    const type_match = this.selectedType ? weapon.type === this.selectedType : true;
                    const version_value = this.$refs.version?.value;
                    const version_match = version_value && version_value !== '' ? weapon.version === (version_value === 'none' ? undefined : version_value) : true;
                    const name_match = this.$refs.name?.value ? weapon.name.toLowerCase().includes(this.$refs.name?.value.toLowerCase()) : true;
                    return quality_match && type_match && version_match && name_match;
                });
            },
        },
    },

    onShow() {
        document.querySelector(`#${DATABASE.weapons.id}-filter`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${DATABASE.weapons.id}-filter`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const database = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_DATABASE_WEAPONS_FILTER_COMPONENT.VUE_COMPONENT, {}),
        },
        template: html` <base-component></base-component> `,
    });
    database.mount(`#${DATABASE.weapons.id}-filter`);
});
