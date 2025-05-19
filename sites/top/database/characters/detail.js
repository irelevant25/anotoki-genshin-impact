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
                    <!-- <div class="mb-3 d-flex justify-content-center" name="autocomplete"></div> -->

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
            SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT.instance = this;
            // this.initAutocomplete();
        },

        methods: {
            initAutocomplete() {
                const autocompleteContainer = this.$el.querySelector('[name="autocomplete"]');
                this.autocomplete = new Autocomplete(autocompleteContainer, (selectedCharacter) => {
                    this.character = null;
                    this.loadCharacterScript(selectedCharacter);
                });
            },

            loadCharacterScript(characterToLoad) {
                this.isLoading = true;
                const characterScript = characterToLoad.name.replace(' ', '_').toUpperCase();

                if (this.isScriptLoaded(characterScript)) {
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

            isScriptLoaded(characterScript) {
                const scriptSrc = `data/database/characters/${characterScript}.js`;
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
        this.instance.character = null;
        document.querySelector(`#${DATABASE.characters.id}-detail`).classList.remove('d-none');
        const character = CHARACTERS.find((character) => character.name.replace(' ', '_').toLowerCase() === parameters.character.toLowerCase());
        this.instance.loadCharacterScript(character);
    },

    onHide() {
        document.querySelector(`#${DATABASE.characters.id}-detail`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_DATABASE_CHARACTERS_DETAIL_COMPONENT.VUE_COMPONENT.mount(`#${DATABASE.characters.id}-detail`);
});
