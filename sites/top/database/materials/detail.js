const SITES_TOP_DATABASE_MATERIALS_DETAIL_COMPONENT = {
    VUE_COMPONENT: Vue.createApp({
        template: html`
            <div style="min-height: 250px; position: relative">
                <!-- <loading-spinner :isLoading="isLoading" style="border-radius: 50px;" /> -->

                <div v-if="material" class="p-4 d-flex flex-row gap-3">
                    <div class="d-flex flex-column flex-1 text-center-mobile gap-3 left-bar">
                        <h3 class="text-center">{{ material.name }}</h3>
                        <img :src="material.icon" :alt="material.name" class="border-full mx-auto" :class="'quality-' + (material.quality ?? '0')" />
                        <div class="d-flex flex-column gap-2 info">
                            <div>
                                <span class="d-flex fw-bold">Version:</span>
                                <span class="d-flex text-start">{{ material.version }}</span>
                            </div>
                            <div>
                                <span class="d-flex fw-bold">Quality:</span>
                                <span class="d-flex text-start rarity-stars" v-if="material.quality">{{ '★'.repeat(parseInt(material.quality)) }}</span>
                                <span class="d-flex text-start" v-else>N/A</span>
                            </div>
                            <div>
                                <span class="d-flex fw-bold">Type:</span>
                                <span class="d-flex text-start"> {{ material.type }} </span>
                            </div>
                            <div>
                                <span class="d-flex fw-bold">Category:</span>
                                <span class="d-flex text-start"> {{ material.category }} </span>
                            </div>
                            <div>
                                <span class="d-flex fw-bold">Group:</span>
                                <span class="d-flex text-start"> {{ material.group }} </span>
                            </div>
                            <div>
                                <span class="d-flex fw-bold">Region:</span>
                                <span class="d-flex text-start"> {{ material.region ?? 'N/A' }} </span>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex flex-column gap-3 w-100">
                        <h3>Description</h3>
                        <span>{{ material.description }}</span>
                        <h3>Need for</h3>
                        <div class="d-flex flex-row flex-wrap gap-3">
                            <span class="fw-bold w-100">Characters:</span>
                            <div class="d-flex flex-column card-container" v-if="characters.length === 0">None</div>
                            <div
                                v-for="item in characters"
                                class="d-flex flex-column card-container hover"
                                :data-link="['/' + MENU_ITEMS_TOP.database.id, DATABASE.characters.id, item.name.replaceAll(' ', '_')]"
                            >
                                <img :src="item.icon" :alt="item.name" class="top-border" :class="'quality-' + (item.quality ?? '0')" />
                                <div class="name text-center bottom-border py-1">{{ item.name }}</div>
                            </div>
                        </div>
                        <div class="d-flex flex-row flex-wrap gap-3">
                            <span class="fw-bold w-100">Weapons:</span>
                            <div class="d-flex flex-column card-container" v-if="weapons.length === 0">None</div>
                            <div
                                v-for="item in weapons"
                                class="d-flex flex-column card-container hover"
                                :data-link="['/' + MENU_ITEMS_TOP.database.id, DATABASE.weapons.id, item.name.replaceAll(' ', '_')]"
                            >
                                <img :src="item.icon" :alt="item.name" class="top-border" :class="'quality-' + (item.quality ?? '0')" />
                                <div class="name text-center bottom-border py-1">{{ item.name }}</div>
                            </div>
                        </div>
                        <div class="d-flex flex-row flex-wrap gap-3">
                            <span class="fw-bold w-100">Foods:</span>
                            <div class="d-flex flex-column card-container" v-if="foods.length === 0">None</div>
                            <div v-for="item in foods" class="d-flex flex-column card-container">
                                <img :src="item.icon" :alt="item.name" class="top-border" :class="'quality-' + (item.quality ?? '0')" />
                                <div class="name text-center bottom-border py-1">{{ item.name }}</div>
                            </div>
                        </div>
                        <h3>How to obtain</h3>
                        <ul class="d-flex flex-column gap-2">
                            <li v-for="obtain in material.howToObtain">{{ obtain }}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `,

        data() {
            return {
                material: null,
                isLoading: true,
                characters: [],
                weapons: [],
                foods: [],
                MENU_ITEMS_TOP: MENU_ITEMS_TOP,
                DATABASE: DATABASE,
            };
        },

        mounted() {
            SITES_TOP_DATABASE_MATERIALS_DETAIL_COMPONENT.instance = this;
        },

        methods: {
            displayMaterialInfo(materialData) {
                this.material = materialData;
                this.characters = CHARACTERS.filter(
                    (character) => this.material.need_for.characters.talents.includes(character.name) || this.material.need_for.characters.ascensions.includes(character.name)
                );
                this.weapons = WEAPONS.filter((weapons) => this.material.need_for.weapons.includes(weapons.name));
                this.foods = FOODS.filter((food) => this.material.need_for.foods.includes(food.name));
                this.isLoading = false;
            },

            setActiveTab(tabName) {
                this.activeTab = tabName;
            },

            isScriptLoaded(script) {
                const scriptSrc = `data/database/materials/${script}.js`;
                return document.querySelector(`script[src="${scriptSrc}"]`) !== null;
            },

            loadScript(src, callback) {
                const script = document.createElement('script');
                script.src = src;
                script.onload = callback;
                document.head.appendChild(script);
            },
        },
    }),

    onShow(route, parameters) {
        document.querySelector(`#${DATABASE.materials.id}-detail`).classList.remove('d-none');
        const material = MATERIALS.find((material) => material.name.replaceAll(' ', '_').toLowerCase() === parameters.material.toLowerCase());
        this.instance.displayMaterialInfo(material);
    },

    onHide() {
        document.querySelector(`#${DATABASE.materials.id}-detail`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_DATABASE_MATERIALS_DETAIL_COMPONENT.VUE_COMPONENT.mount(`#${DATABASE.materials.id}-detail`);
});
