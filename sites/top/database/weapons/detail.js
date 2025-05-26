const SITES_TOP_DATABASE_WEAPONS_DETAIL_COMPONENT = {
    VUE_COMPONENT: Vue.createApp({
        template: html`
            <div style="min-height: 250px; position: relative">
                <!-- <loading-spinner :isLoading="isLoading" style="border-radius: 50px;" /> -->

                <div v-if="weapon" class="p-4 d-flex flex-row gap-3">
                    <div class="d-flex flex-column flex-1 text-center-mobile gap-3 left-bar">
                        <h3 class="text-center">{{ weapon.name }}</h3>
                        <img :src="weapon.icon" :alt="weapon.name" class="border-full mx-auto" :class="'quality-' + (weapon.quality ?? '0')" />
                        <div class="d-flex flex-column gap-2 info">
                            <div>
                                <span class="d-flex fw-bold">Type:</span>
                                <span class="d-flex text-start"> {{ weapon.type }} </span>
                            </div>
                            <div>
                                <span class="d-flex fw-bold">Release date:</span>
                                <span class="d-flex text-start"> {{ weapon.release_date }} </span>
                            </div>
                            <div>
                                <span class="d-flex fw-bold">Secondary attribute type:</span>
                                <span class="d-flex text-start"> {{ weapon.secondary_stat }} </span>
                            </div>
                            <div>
                                <span class="d-flex fw-bold">Released:</span>
                                <span class="d-flex text-start">{{ weapon.version }}</span>
                            </div>
                            <div>
                                <span class="d-flex fw-bold">Effects:</span>
                                <span class="d-flex text-start" v-for="effect in weapon.effects">{{ effect }}</span>
                            </div>
                        </div>
                        <div class="d-flex flex-column gap-2 info">
                            <h3>Refinements</h3>
                            <div class="text-center">
                                <button
                                    v-for="(refinement, index) in weapon.refinements"
                                    @click="selectedRefinementIndex = index; selectedRefinement = refinement"
                                    class="btn number-btn"
                                    :class="{'btn-primary': selectedRefinementIndex === index, 'btn-outline-primary': selectedRefinementIndex !== index}"
                                >
                                    {{ index + 1 }}
                                </button>
                            </div>
                            <div class="text-display">
                                <transition name="fade" mode="out-in">
                                    <div class="text-content">
                                        <p class="mb-0">{{ selectedRefinement.description }}</p>
                                    </div>
                                </transition>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex flex-column gap-3 w-100">
                        <h3>Ascensions</h3>
                        <div class="w-100" style="overflow-x: auto">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th style="width: 80px;">Phase</th>
                                        <th style="width: 100px;">Level</th>
                                        <th style="width: 80px;">Atk</th>
                                        <th style="width: 140px;">{{ weapon.secondary_stat }}</th>
                                        <th>Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="ascension in weapon.ascensions_materials_and_stats">
                                        <td>{{ ascension.phase }}</td>
                                        <td>
                                            <div v-for="level in ascension.levels">{{ level.level }}</div>
                                        </td>
                                        <td>
                                            <div v-for="level in ascension.levels">{{ level.atk }}</div>
                                        </td>
                                        <td>
                                            <div v-for="level in ascension.levels">{{ level[weapon.secondary_stat] }}</div>
                                        </td>
                                        <td v-if="ascension.cost.length === 0"></td>
                                        <td class="d-flex flex-row flex-nowrap gap-2" v-if="ascension.cost.length > 0">
                                            <div
                                                v-for="item in ascension.cost"
                                                class="d-flex flex-column card-container hover"
                                                :data-link="['/' + MENU_ITEMS_TOP.database.id, DATABASE.materials.id, item.name.replaceAll(' ', '_')]"
                                            >
                                                <img :src="item.icon" :alt="item.name" class="top-border" :class="'quality-' + (item.quality ?? '0')" />
                                                <div class="name text-center bottom-border py-1">{{ item.name }}</div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `,

        data() {
            const sampleData = [
                { id: 1, text: "Welcome to the first section! This is where you'll find introductory information about our services and what we offer to our clients." },
                { id: 2, text: 'Our second section covers detailed specifications and technical requirements. Here we dive deep into the functionality and capabilities.' },
                { id: 3, text: 'The third section is all about pricing and packages. We offer flexible solutions to meet different budget requirements and business needs.' },
                { id: 4, text: "Section four focuses on customer support and service guarantees. We're committed to providing excellent support throughout your journey with us." },
                { id: 5, text: "Finally, our fifth section contains contact information and next steps. Ready to get started? Here's how you can reach out to our team." },
                { id: 6, text: 'This is an additional section showing how the component scales with more items. You can easily add or remove items from the data array.' },
            ];
            return {
                weapon: null,
                isLoading: true,
                MENU_ITEMS_TOP: MENU_ITEMS_TOP,
                DATABASE: DATABASE,
                selectedRefinement: null,
                selectedRefinementIndex: 0,
            };
        },

        mounted() {
            SITES_TOP_DATABASE_WEAPONS_DETAIL_COMPONENT.instance = this;
        },

        methods: {
            displayWeaponInfo(weaponData) {
                this.weapon = weaponData;
                this.selectedRefinement = weaponData.refinements[0];
                this.isLoading = false;
                setTimeout(() => {
                    const images = this.$el.querySelectorAll('img');
                    images.forEach((image) => {
                        image.onerror = () => {
                            image.setAttribute('data-img-loading-error', '');
                            image.setAttribute('alt', 'Error');
                        };
                    });
                }, 50);
            },

            setActiveTab(tabName) {
                this.activeTab = tabName;
            },

            isScriptLoaded(script) {
                const scriptSrc = `data/database/weapons/${script}.js`;
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
        document.querySelector(`#${DATABASE.weapons.id}-detail`).classList.remove('d-none');
        const weapon = WEAPONS.find((weapon) => weapon.name.replaceAll(' ', '_').toLowerCase() === parameters.weapon.toLowerCase());
        this.instance.displayWeaponInfo(weapon);
    },

    onHide() {
        document.querySelector(`#${DATABASE.weapons.id}-detail`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_DATABASE_WEAPONS_DETAIL_COMPONENT.VUE_COMPONENT.mount(`#${DATABASE.weapons.id}-detail`);
});
