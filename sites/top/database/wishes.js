const SITES_TOP_DATABASE_WISHES_COMPONENT = {
    VUE_COMPONENT: {
        template: html`
            <div class="px-5 py-2">
                <div class="d-flex flex-wrap gap-2 justify-content-center py-3">
                    <div class="filter">
                        <select type="select" class="form-select" @change="filterWishes" ref="version">
                            <option value="" selected>Version</option>
                            <option v-for="version in versions" :value="version ?? 'none'">{{ version ?? 'none' }}</option>
                        </select>
                    </div>
                    <div class="filter">
                        <input type="text" class="form-control" placeholder="Character name" @input="filterWishes" ref="characterName" />
                    </div>
                    <div class="filter">
                        <button class="btn btn-secondary" @click="resetFilters">Reset</button>
                    </div>
                </div>

                <div class="d-flex flex-column gap-2 py-3">
                    <div v-for="version_wrapper in wishes" class="wish-card-container-wrapper flex-column">
                        <div v-for="wish in version_wrapper.wishes" class="wish-card-container flex-row">
                            <div class="align-content-center" style="width: 25px; min-width: 25px;">{{ version_wrapper.version }}</div>
                            <div class="align-content-center" style="width: 150px; min-width: 150px;">{{ wish.duration }}</div>
                            <img :src="wish.image" :alt="wish.name" :title="wish.name" class="my-auto" style="width: 355px; min-width: 355px;" />
                            <div class="d-flex flex-row flex-wrap gap-2">
                                <div v-for="item in wish.characters.concat(wish.weapons)" :data-link="item.name.replaceAll(' ', '_')" class="card-container">
                                    <div class="d-flex flex-column item-card">
                                        <img :src="item.icon" class="top-border" :class="'quality-' + (item.quality ?? '0')" :alt="item.icon" :title="item.name" />
                                        <div class="name text-center bottom-border py-1">{{ item.name }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,

        data() {
            const versions_map = new Set();
            this.filterTBA(WISHES).forEach((wish) => {
                versions_map.add(wish.version);
            });
            return {
                wishes: this.filterTBA(WISHES),
                versions: Array.from(versions_map.values()).sort(),
            };
        },

        methods: {
            resetFilters() {
                // Reset all filters
                if (this.$refs.version) this.$refs.version.value = '';
                if (this.$refs.characterName) this.$refs.characterName.value = '';

                // Reset the wishes to show all
                this.wishes = this.filterTBA(WISHES);
            },

            filterTBA(wishes) {
                return wishes.filter((version) => !version.wishes.some((wish) => wish.duration.includes('TBA')));
            },

            filterWishes() {
                this.wishes = this.filterTBA(WISHES).filter((version_wrapper) => {
                    const version_value = this.$refs.version?.value;
                    const version_match = version_value && version_value !== '' ? version_wrapper.version === (version_value === 'none' ? undefined : version_value) : true;
                    const name_match = this.$refs.characterName?.value
                        ? version_wrapper.wishes.some((wish) => wish.characters.some((character) => character.name.toLowerCase().includes(this.$refs.characterName.value.toLowerCase())))
                        : true;
                    return version_match && name_match;
                });
            },
        },
    },

    onShow() {
        document.querySelector(`#${DATABASE.wishes.id}`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${DATABASE.wishes.id}`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const database = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_DATABASE_WISHES_COMPONENT.VUE_COMPONENT, {}),
        },
        template: html` <base-component></base-component> `,
    });
    database.mount(`#${DATABASE.wishes.id}`);
});
