const SITES_TOP_DATABASE_CHARACTERS_FILTER_COMPONENT = {
    VUE_COMPONENT: {
        template: html`
            <div class="px-5 py-2">
                <div class="d-flex flex-wrap gap-2 justify-content-between py-3">
                    <div class="filter gap-2">
                        <img
                            v-for="element in elements"
                            :src="element.icon"
                            :class="[element.name.toLowerCase() + '-bg', 
                                    selectedElement === element.name ? 'selected' : '']"
                            :title="element.name"
                            @click="toggleElementFilter(element.name)"
                        />
                    </div>
                    <div class="filter gap-2">
                        <img v-for="weapon in weapons" :src="weapon.icon" :class="selectedWeapon === weapon.name ? 'selected' : ''" :title="weapon.name" @click="toggleWeaponFilter(weapon.name)" />
                    </div>
                    <div class="filter">
                        <select type="select" class="form-select" @change="filterCharacters" ref="region">
                            <option value="" selected>Region</option>
                            <option v-for="region in regions" :value="region?.name ?? 'none'">{{ region?.name ?? 'none' }}</option>
                        </select>
                    </div>
                    <div class="filter">
                        <select type="select" class="form-select" @change="filterCharacters" ref="version">
                            <option value="" selected>Version</option>
                            <option v-for="version in versions" :value="version">{{ version }}</option>
                        </select>
                    </div>
                    <div class="filter">
                        <input type="text" class="form-control" placeholder="Character name" @input="filterCharacters" ref="name" />
                    </div>
                    <div class="filter">
                        <button class="btn btn-secondary" @click="resetFilters">Reset</button>
                    </div>
                </div>

                <div class="d-flex flex-row flex-wrap gap-2 justify-content-center py-3">
                    <div v-for="character in characters" :data-link="character.name.replaceAll(' ', '_')" class="character-card-container">
                        <div class="d-flex flex-column character-card">
                            <img :src="character.icon" class="top-border" :class="character.element.name.toLowerCase() + '-bg'" :alt="character.card_icon" :title="character.name" />
                            <div class="name text-center bottom-border py-1">{{ character.name }}</div>
                        </div>
                    </div>
                </div>
            </div>
        `,

        data() {
            const elements_map = new Map();
            CHARACTERS.forEach((character) => {
                elements_map.set(character.element.name, character.element);
            });
            const weapons_map = new Map();
            CHARACTERS.forEach((character) => {
                weapons_map.set(character.weapon.name, character.weapon);
            });
            const regions_map = new Map();
            CHARACTERS.forEach((character) => {
                regions_map.set(character.region?.name, character.region);
            });
            const versions_map = new Set();
            CHARACTERS.forEach((character) => {
                versions_map.add(character.version);
            });
            return {
                characters: CHARACTERS,
                elements: Array.from(elements_map.values()).sort(),
                weapons: Array.from(weapons_map.values()).sort(),
                regions: Array.from(regions_map.values()).sort(),
                versions: Array.from(versions_map.values()).sort(),
                selectedElement: null,
                selectedWeapon: null,
            };
        },

        methods: {
            toggleElementFilter(elementName) {
                // If selected, deselect it
                if (this.selectedElement === elementName) {
                    this.selectedElement = null;
                } else {
                    this.selectedElement = elementName;
                }
                this.filterCharacters();
            },

            toggleWeaponFilter(weaponName) {
                // If selected, deselect it
                if (this.selectedWeapon === weaponName) {
                    this.selectedWeapon = null;
                } else {
                    this.selectedWeapon = weaponName;
                }
                this.filterCharacters();
            },

            resetFilters() {
                // Reset all filters
                this.selectedElement = null;
                this.selectedWeapon = null;
                if (this.$refs.region) this.$refs.region.value = '';
                if (this.$refs.version) this.$refs.version.value = '';
                if (this.$refs.name) this.$refs.name.value = '';

                // Reset the characters to show all
                this.characters = CHARACTERS;
            },

            filterCharacters() {
                this.characters = CHARACTERS.filter((character) => {
                    const element_match = this.selectedElement ? character.element.name === this.selectedElement : true;
                    const weapon_match = this.selectedWeapon ? character.weapon.name === this.selectedWeapon : true;
                    const region_value = this.$refs.region?.value;
                    const region_match = region_value && region_value !== '' ? character.region?.name === (region_value === 'none' ? undefined : region_value) : true;
                    const version_match = this.$refs.version?.value && this.$refs.version?.value !== '' ? character.version === this.$refs.version?.value : true;
                    const name_match = this.$refs.name?.value ? character.name.toLowerCase().includes(this.$refs.name?.value.toLowerCase()) : true;
                    return element_match && weapon_match && region_match && version_match && name_match;
                });
            },
        },
    },

    onShow() {
        document.querySelector(`#${DATABASE.characters.id}-filter`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${DATABASE.characters.id}-filter`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const database = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_DATABASE_CHARACTERS_FILTER_COMPONENT.VUE_COMPONENT, {}),
        },
        template: html` <base-component></base-component> `,
    });
    database.mount(`#${DATABASE.characters.id}-filter`);
});
