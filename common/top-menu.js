const COMPONENT_TOP_MENU = Vue.createApp({
    template: html`
        <ul>
            <li v-for="menuItem in menuItems" :data-id="menuItem.id" @click="menuItemClick($event)" ref="menuItemElement">
                <div v-if="menuItem.badgeIcon" :id="menuItem.id + '-badge-icon'" class="left">
                    <div class="badge-daily rounded-pill bg-danger visible" style="width: 20px; height: 20px;">?</div>
                </div>
                <div v-if="menuItem.helpIcon" :id="menuItem.id + '-help-icon'" class="help-icon right" data-bs-toggle="tooltip" data-bs-placement="left" :title="menuItem.modalTitle">
                    <i class="bi bi-question-circle-fill" data-bs-toggle="modal" :data-bs-target="'#' + menuItem.id + '-modal'" onclick="event.stopPropagation()"></i>
                </div>
                <a>{{menuItem.title}}</a>
            </li>
        </ul>
        <!-- Modals -->
        <Teleport to="body">
            <div v-for="menuItem in menuItems" :id="menuItem.id + '-modal'">
                <div class="modal fade" :id="menuItem.id + '-modal'" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" :id="menuItem.id + '-modal-label'">{{ menuItem.modalTitle }}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4" v-html="menuItem.modalContent"></div>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    `,

    data: () => ({
        menuItems: Object.values(MENU_ITEMS_TOP),
    }),

    methods: {
        menuItemClick(event) {
            const menuItem = event.currentTarget || event.srcElement;
            if (!menuItem.dataset.id) return;

            // Toggle active state and handle content visibility
            this.toggleActiveMenuItem(menuItem);
            this.toggleContentVisibility(menuItem.dataset.id);
        },

        toggleActiveMenuItem(clickedItem) {
            // Deactivate all other menu items
            this.$refs.menuItemElement.forEach((element) => {
                if (element !== clickedItem) element.classList.remove('active');
            });

            // Toggle the clicked item
            clickedItem.classList.toggle('active');
        },

        toggleContentVisibility(itemId) {
            const content = document.querySelector('#' + itemId);
            if (!content) return;

            // Hide all other content elements
            Object.values(MENU_ITEMS_TOP).forEach((item) => {
                const el = document.querySelector(`#${item.id}`);
                if (el && el !== content) el.classList.add('d-none');
            });

            // Toggle this content's visibility
            content.classList.toggle('d-none');
        },
    },

    mounted() {
        const modalCount = document.querySelectorAll('div > div.modal').length;
        console.log(`Menu items help modals initialized with ${modalCount} items`);
    },
});

document.addEventListener('DOMContentLoaded', () => {
    COMPONENT_TOP_MENU.mount('#top-menu');
});
