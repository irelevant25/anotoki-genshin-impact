const SITES_TOP_GAMES_COMPONENT = {
    gamesElement: null,
    gamesListElement: null,

    getHelpIcon(gameItem) {
        if (!gameItem.helpIcon) return '';
        return `
            <div id="${gameItem.id}-help-icon" class="help-icon right" data-bs-toggle="tooltip" data-bs-placement="left" title="${gameItem.modalTitle}">
                <i class="bi bi-question-circle-fill" data-bs-toggle="modal" data-bs-target="#${gameItem.id}-modal"
                    onclick="event.stopPropagation()"></i>
            </div>
        `;
    },

    defaultState() {
        this.gamesListElement.classList.remove('d-none');
        this.gamesElement.querySelectorAll("& > div[id^='site-']").forEach((element) => {
            element.classList.add('d-none');
        });
    },

    itemClick(gameItem) {
        // Skip if no data-id
        if (!gameItem.dataset.id) return;

        this.defaultState();

        // Toggle active state of clicked item
        this.gamesElement.querySelector(`#${gameItem.dataset.id}`).classList.remove('d-none');
        this.gamesListElement.classList.add('d-none');
    },

    init() {
        this.gamesElement = document.querySelector(`#${MENU_ITEMS_TOP.games.id}`);
        this.gamesListElement = document.querySelector('#games-list');
        document.querySelector(`li[data-id="${MENU_ITEMS_TOP.games.id}"]`).addEventListener('click', () => {
            this.defaultState();
        });

        // Generate list
        let gamesListHtml = '';
        Object.values(GAMES).forEach((gameItem) => {
            gamesListHtml += `
                <div class="card" data-id="${gameItem.id}" data-link="${gameItem.id}">
                    ${this.getHelpIcon(gameItem)}
                    <img src="${gameItem.cardImage}">
                    <div class="card-body">
                        <h5 class="card-title">${gameItem.title}</h5>
                        <p class="card-text">${gameItem.cardInfo}</p>
                    </div>
                </div>    
            `;
        });
        this.gamesListElement.innerHTML = gamesListHtml;

        const items = this.gamesListElement.querySelectorAll('div.card');
        console.log(
            `${items.length} games initialized: ${Array.from(items)
                .map((item) => item.dataset.id)
                .join(', ')}`
        );

        // Generate menu items help modals
        const helpModals = document.createElement('div');
        document.body.appendChild(helpModals);
        Object.values(GAMES).forEach((gameItem) => {
            helpModals.innerHTML += `
                <div class="modal fade" id="${gameItem.id}-modal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="${gameItem.id}-modal-label">${gameItem.modalTitle}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4">${gameItem.modalContent}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    },

    onInit() {
        onPathChange.subscribe((path) => {
            if (path === MENU_ITEMS_TOP.games.id) {
                this.gamesListElement.classList.remove('d-none');
            } else {
                this.gamesListElement.classList.add('d-none');
            }
        });
    },

    onShow() {
        this.gamesElement.classList.remove('d-none');
    },

    onHide() {
        this.gamesElement.classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_GAMES_COMPONENT.init();
});
