const SITES_TOP_DATABASE_COMPONENT = {
    databaseElement: null,
    databaseListElement: null,

    getHelpIcon(databaseItem) {
        if (!databaseItem.helpIcon) return '';
        return `
            <div id="${databaseItem.id}-help-icon" class="help-icon right" data-bs-toggle="tooltip" data-bs-placement="left" title="${databaseItem.modalTitle}">
                <i class="bi bi-question-circle-fill" data-bs-toggle="modal" data-bs-target="#${databaseItem.id}-modal"
                    onclick="event.stopPropagation()"></i>
            </div>
        `;
    },

    defaultState() {
        this.databaseListElement.classList.remove('d-none');
        this.databaseElement.querySelectorAll("& > div[id^='site-']").forEach((element) => {
            element.classList.add('d-none');
        });
    },

    itemClick(databaseItem) {
        // Skip if no data-id
        if (!databaseItem.dataset.id) return;

        this.defaultState();

        // Toggle active state of clicked item
        this.databaseElement.querySelector(`#${databaseItem.dataset.id}`).classList.remove('d-none');
        this.databaseListElement.classList.add('d-none');
    },

    init() {
        this.databaseElement = document.querySelector(`#${MENU_ITEMS_TOP.database.id}`);
        this.databaseListElement = document.querySelector('#database-list');
        document.querySelector(`li[data-id="${MENU_ITEMS_TOP.database.id}"]`).addEventListener('click', () => {
            this.defaultState();
        });

        // Generate list
        let databaseListHtml = '';
        Object.values(DATABASE).forEach((databaseItem) => {
            databaseListHtml += `
                <div class="card" data-id="${databaseItem.id}" data-link="${databaseItem.id}">
                    ${this.getHelpIcon(databaseItem)}
                    <img src="${databaseItem.cardImage}">
                    <div class="card-body">
                        <h5 class="card-title">${databaseItem.title}</h5>
                        <p class="card-text">${databaseItem.cardInfo}</p>
                    </div>
                </div>    
            `;
        });
        this.databaseListElement.innerHTML = databaseListHtml;

        const items = this.databaseListElement.querySelectorAll('div.card');
        console.log(
            `${items.length} databases initialized: ${Array.from(items)
                .map((item) => item.dataset.id)
                .join(', ')}`
        );

        // Generate menu items help modals
        const helpModals = document.createElement('div');
        document.body.appendChild(helpModals);
        Object.values(DATABASE).forEach((databaseItem) => {
            helpModals.innerHTML += `
                <div class="modal fade" id="${databaseItem.id}-modal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="${databaseItem.id}-modal-label">${databaseItem.modalTitle}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4">${databaseItem.modalContent}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    },

    onInit() {
        onPathChange.subscribe((path) => {
            if (path === MENU_ITEMS_TOP.database.id) {
                this.databaseListElement.classList.remove('d-none');
            } else {
                this.databaseListElement.classList.add('d-none');
            }
        });
    },

    onShow() {
        this.databaseElement.classList.remove('d-none');
    },

    onHide() {
        this.databaseElement.classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_DATABASE_COMPONENT.init();
});
