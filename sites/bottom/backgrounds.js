const SITES_BOTTOM_BACKGROUND = Vue.createApp({
    template: html`
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Backgrounds</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="mb-4">
                        <h6 class="fw-bold">What is the Background Feature?</h6>
                        <p>Customize your quiz experience by choosing different character-themed wallpapers as the app background.</p>
                    </div>

                    <div class="mb-4">
                        <h6 class="fw-bold">How to Use</h6>
                        <ol>
                            <li>Click on the "Background" menu item to view available wallpapers</li>
                            <li>Browse through the character thumbnails</li>
                            <li>Click on any character thumbnail to set their wallpaper as the background</li>
                            <li>The background will instantly change to your selection</li>
                        </ol>
                    </div>

                    <div>
                        <h6 class="fw-bold">Available Backgrounds</h6>
                        <p>Backgrounds are available for characters that have wallpaper assets. The selection varies depending on the assets included in your installation.</p>
                        <p class="text-muted fst-italic">Note: You can continue playing quizzes with any background of your choice.</p>
                    </div>
                    <div id="site-backgrounds-modal-content" class="backgrounds-grid">
                        <img
                            v-for="background in backgrounds"
                            :key="background.name"
                            :src="background.preview"
                            :alt="background.name"
                            :title="background.name"
                            @click="changeBackground(background.wallpaper)"
                            class="background-thumbnail"
                        />
                    </div>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            backgrounds: BACKGROUNDS,
            currentBackground: null,
        };
    },

    mounted() {
        this.initializeBackground();
    },

    methods: {
        changeBackground(imgUrl) {
            const encodedPath = encodeURI(imgUrl);
            document.body.style.backgroundImage = `url(${encodedPath})`;
            this.currentBackground = imgUrl;
            storageManager.saveBackground(imgUrl);
        },

        initializeBackground() {
            const savedBackground = storageManager.getBackground();
            const defaultBackground = 'assets/wallpaper/Fontaine.avif';
            this.currentBackground = savedBackground || defaultBackground;
            document.body.style.backgroundImage = `url("${this.currentBackground}")`;
        },
    },
});

document.addEventListener('DOMContentLoaded', () => {
    SITES_BOTTOM_BACKGROUND.mount('#site-backgrounds-modal');
});
