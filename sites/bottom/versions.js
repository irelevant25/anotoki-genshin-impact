const SITES_BOTTOM_VERSION = Vue.createApp({
    template: html`
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="site-versions-modal-label">Changelog</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body changelog-container p-4">
                    <div v-for="(entry, index) in changelog" :key="entry.version" :class="['version-card', { highlight: index === 0 }]">
                        <!-- Version header -->
                        <div class="version-header">
                            <div class="version-number">
                                v{{ entry.version }}
                                <span v-if="index === 0">Latest</span>
                            </div>
                            <div class="version-date">{{ formatDate(entry.date) }}</div>
                        </div>

                        <!-- Added changes -->
                        <div class="changes-section" v-if="entry.changes.added && entry.changes.added.length > 0">
                            <div class="section-title added">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 1V15M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Added
                            </div>
                            <ul class="changes-list added">
                                <li v-for="item in entry.changes.added" :key="item">
                                    {{ item }}
                                    <span v-if="index === 0" class="badge new">new</span>
                                </li>
                            </ul>
                        </div>

                        <!-- Fixed changes -->
                        <div class="changes-section" v-if="entry.changes.fixed !== undefined">
                            <div class="section-title fixed">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 5.5L8 11.5L2 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Fixed
                            </div>
                            <ul class="changes-list fixed" v-if="entry.changes.fixed && entry.changes.fixed.length > 0">
                                <li v-for="item in entry.changes.fixed" :key="item">{{ item }}</li>
                            </ul>
                            <div class="empty-notice" v-else>No fixes in this version</div>
                        </div>

                        <!-- Updated changes -->
                        <div class="changes-section" v-if="entry.changes.updated && entry.changes.updated.length > 0">
                            <div class="section-title updated">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8Z"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path d="M8 4V8L11 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Updated
                            </div>
                            <ul class="changes-list updated">
                                <li v-for="item in entry.changes.updated" :key="item">{{ item }}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            changelog: CHANGELOG,
        };
    },

    mounted() {
        this.updateVersionDisplay();
    },

    methods: {
        formatDate(dateString) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        },

        updateVersionDisplay() {
            if (this.changelog && this.changelog.length > 0) {
                const versionElement = document.querySelector(`#${MENU_ITEMS_BOTTOM.versions.id}`);
                if (versionElement) {
                    versionElement.textContent = `v${this.changelog[0].version}`;
                }
            }
        },
    },
});

document.addEventListener('DOMContentLoaded', () => {
    SITES_BOTTOM_VERSION.mount('#site-versions-modal');
});
