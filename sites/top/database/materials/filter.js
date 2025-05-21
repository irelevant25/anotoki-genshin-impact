const SITES_TOP_DATABASE_MATERIALS_FILTER_COMPONENT = {
    VUE_COMPONENT: {
        template: html`
            <div class="px-5 py-2">
                <div class="d-flex flex-wrap gap-2 justify-content-between py-3">
                    <div class="filter gap-2">
                        <div v-for="quality in qualities" :class="['quality-' + (quality ?? '0'), selectedQuality === quality ? 'selected' : '']" @click="toggleQualityFilter(quality)">
                            {{ quality === '0' ? '-' : quality }}
                        </div>
                    </div>
                    <div class="filter">
                        <select type="select" class="form-select" @change="filterMaterials" ref="category">
                            <option value="" selected>Category</option>
                            <option v-for="category in categories" :value="category ?? 'none'">{{ category ?? 'none' }}</option>
                        </select>
                    </div>
                    <div class="filter">
                        <select type="select" class="form-select" @change="filterMaterials" ref="region">
                            <option value="" selected>Region</option>
                            <option v-for="region in regions" :value="region ?? 'none'">{{ region ?? 'none' }}</option>
                        </select>
                    </div>
                    <div class="filter">
                        <select type="select" class="form-select" @change="filterMaterials" ref="version">
                            <option value="" selected>Version</option>
                            <option v-for="version in versions" :value="version ?? 'none'">{{ version ?? 'none' }}</option>
                        </select>
                    </div>
                    <div class="filter">
                        <input type="text" class="form-control" placeholder="Material name" @input="filterMaterials" ref="name" />
                    </div>
                    <div class="filter">
                        <button class="btn btn-secondary" @click="resetFilters">Reset</button>
                    </div>
                </div>

                <div class="d-flex flex-row flex-wrap gap-2 justify-content-center py-3">
                    <div v-for="material in materials" :data-link="material.name.replaceAll(' ', '_')" class="material-card-container">
                        <div class="d-flex flex-column material-card">
                            <img :src="material.icon" class="top-border" :class="'quality-' + (material.quality ?? '0')" :alt="material.icon" :title="material.name" />
                            <div class="name text-center bottom-border py-1">{{ material.name }}</div>
                        </div>
                    </div>
                </div>
            </div>
        `,

        data() {
            const qualities_map = new Set();
            MATERIALS.forEach((material) => {
                qualities_map.add(material.quality ?? '0');
            });
            const categories_map = new Set();
            MATERIALS.forEach((material) => {
                categories_map.add(material.category);
            });
            const regions_map = new Set();
            MATERIALS.forEach((material) => {
                regions_map.add(material.region);
            });
            const versions_map = new Set();
            MATERIALS.forEach((material) => {
                versions_map.add(material.version);
            });
            return {
                materials: MATERIALS,
                qualities: Array.from(qualities_map.values()).sort(),
                categories: Array.from(categories_map.values()).sort(),
                regions: Array.from(regions_map.values()).sort(),
                versions: Array.from(versions_map.values()).sort(),
                selectedQuality: null,
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
                this.filterMaterials();
            },

            resetFilters() {
                // Reset all filters
                this.selectedQuality = null;
                if (this.$refs.category) this.$refs.category.value = '';
                if (this.$refs.region) this.$refs.region.value = '';
                if (this.$refs.version) this.$refs.version.value = '';
                if (this.$refs.name) this.$refs.name.value = '';

                // Reset the materials to show all
                this.materials = MATERIALS;
            },

            filterMaterials() {
                this.materials = MATERIALS.filter((material) => {
                    const quality_match = this.selectedQuality ? material.quality === (this.selectedQuality === '0' ? undefined : this.selectedQuality) : true;
                    const category_value = this.$refs.category?.value;
                    const category_match = category_value && category_value !== '' ? material.category === (category_value === 'none' ? undefined : category_value) : true;
                    const region_value = this.$refs.region?.value;
                    const region_match = region_value && region_value !== '' ? material.region === (region_value === 'none' ? undefined : region_value) : true;
                    const version_value = this.$refs.version?.value;
                    const version_match = version_value && version_value !== '' ? material.version === (version_value === 'none' ? undefined : version_value) : true;
                    const name_match = this.$refs.name?.value ? material.name.toLowerCase().includes(this.$refs.name?.value.toLowerCase()) : true;
                    return quality_match && category_match && region_match && version_match && name_match;
                });
            },
        },
    },

    onShow() {
        document.querySelector(`#${DATABASE.materials.id}-filter`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${DATABASE.materials.id}-filter`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const database = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_DATABASE_MATERIALS_FILTER_COMPONENT.VUE_COMPONENT, {}),
        },
        template: html` <base-component></base-component> `,
    });
    database.mount(`#${DATABASE.materials.id}-filter`);
});
