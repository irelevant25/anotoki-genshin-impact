const TOP_MENU = Vue.createApp({
    template: html`
        <ul>
            <li v-for="menuItem in menuItems" :data-id="menuItem.id" :data-link="'/' + menuItem.id" ref="menuItemElement">
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
            <div v-for="menuItem in menuItems" class="modal fade" :id="menuItem.id + '-modal'" tabindex="-1">
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
        </Teleport>
    `,

    data() {
        onPathChange.subscribe((path) => {
            const activeMenuItem = this.$refs.menuItemElement.find((element) => element.dataset.id === path.split('/')[0]);
            this.$refs.menuItemElement.forEach((element) => {
                element.classList.remove('active');
            });
            activeMenuItem?.classList.add('active');
        });

        return {
            menuItems: Object.values(MENU_ITEMS_TOP),
        };
    },
});

document.addEventListener('DOMContentLoaded', () => {
    TOP_MENU.mount('#top-menu');
});
