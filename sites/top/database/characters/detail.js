const SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT = {
    VUE_COMPONENT: Vue.createApp({
        components: {
            'character-header': SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT_COMPONENTS.CharacterHeader,
            'ascension-tab': SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT_COMPONENTS.AscensionTab,
            'talents-tab': SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT_COMPONENTS.TalentsTab,
            'constellations-tab': SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT_COMPONENTS.ConstellationsTab,
            'build-tab': SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT_COMPONENTS.BuildTab,
            'voice-overs-tab': SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT_COMPONENTS.VoiceOversTab,
            'loading-spinner': LoadingSpinner,
        },

        template: html`
            <div style="min-height: 250px; position: relative">
                <loading-spinner :isLoading="isLoading" style="border-radius: 50px;" />
                <div class="body p-4">
                    <!-- Header section -->
                    <img v-if="character" id="banner" loading="lazy" class="d-flex mx-auto" :src="character.namecard.banner" :alt="character.name" style="max-width: 100%;" />

                    <!-- Character header component -->
                    <character-header v-if="character" :character="character" />

                    <!-- Tabs Navigation -->
                    <div v-if="character" class="tabs-navigation flex-column-mobile">
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
            };
        },

        mounted() {
            SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT.instance = this;
        },

        methods: {
            loadScript(itemToLoad) {
                this.isLoading = true;
                const script = normalize(itemToLoad.name);

                if (this.isScriptLoaded(script)) {
                    this.displayInfo(window[script]);
                    return;
                }

                this.loadSpecificScript(`data/database/characters/${script}.js`, () => {
                    setTimeout(() => {
                        this.displayInfo(window[script]);
                    }, 1000);
                });
            },

            displayInfo(data) {
                this.character = data;
                this.isLoading = false;
            },

            setActiveTab(tabName) {
                this.activeTab = tabName;
            },

            isScriptLoaded(script) {
                const scriptSrc = `data/database/characters/${script}.js`;
                return document.querySelector(`script[src="${scriptSrc}"]`) !== null;
            },

            loadSpecificScript(src, callback) {
                const script = document.createElement('script');
                script.src = src;
                script.onload = callback;
                document.head.appendChild(script);
            },
        },
    }),

    onShow(route, parameters) {
        document.querySelector(`#${DATABASE.characters.id}-detail`).classList.remove('d-none');
        const character = CHARACTERS.find((character) => normalize(character.name) === parameters.character);
        this.instance.loadScript(character);
    },

    onHide() {
        this.instance.character = null;
        document.querySelector(`#${DATABASE.characters.id}-detail`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT.VUE_COMPONENT.mount(`#${DATABASE.characters.id}-detail`);
});
