const SITES_TOP_QUIZZES_COMPONENT = {
    quizzesElement: null,
    quizzesListElement: null,

    getHelpIcon(quizItem) {
        if (!quizItem.helpIcon) return '';
        return `
            <div id="${quizItem.id}-help-icon" class="help-icon right" data-bs-toggle="tooltip" data-bs-placement="left" title="${quizItem.modalTitle}">
                <i class="bi bi-question-circle-fill" data-bs-toggle="modal" data-bs-target="#${quizItem.id}-modal"
                    onclick="event.stopPropagation()"></i>
            </div>
        `;
    },

    defaultState() {
        this.quizzesListElement.classList.remove('d-none');
        this.quizzesElement.querySelectorAll("& > div[id^='site-']").forEach((element) => {
            element.classList.add('d-none');
        });
    },

    itemClick(quizItem) {
        // Skip if no data-id
        if (!quizItem.dataset.id) return;

        this.defaultState();

        // Toggle active state of clicked item
        this.quizzesElement.querySelector(`#${quizItem.dataset.id}`).classList.remove('d-none');
        this.quizzesListElement.classList.add('d-none');
    },

    init() {
        this.quizzesElement = document.querySelector(`#${MENU_ITEMS_TOP.quizzes.id}`);
        this.quizzesListElement = document.querySelector('#quizzes-list');
        document.querySelector(`li[data-id="${MENU_ITEMS_TOP.quizzes.id}"]`).addEventListener('click', () => {
            this.defaultState();
        });

        // Generate list
        let quizzesListHtml = '';
        Object.values(QUIZZES).forEach((quizItem) => {
            quizzesListHtml += `
                <div class="card" data-id="${quizItem.id}" data-link="${quizItem.id}">
                    ${this.getHelpIcon(quizItem)}
                    <img src="${quizItem.cardImage}">
                    <div class="card-body">
                        <h5 class="card-title">${quizItem.title}</h5>
                        <p class="card-text">${quizItem.cardInfo}</p>
                    </div>
                </div>    
            `;
        });
        this.quizzesListElement.innerHTML = quizzesListHtml;

        const items = this.quizzesListElement.querySelectorAll('div.card');
        console.log(
            `${items.length} quizzes initialized: ${Array.from(items)
                .map((item) => item.dataset.id)
                .join(', ')}`
        );

        // Generate menu items help modals
        const helpModals = document.createElement('div');
        document.body.appendChild(helpModals);
        Object.values(QUIZZES).forEach((quizItem) => {
            helpModals.innerHTML += `
                <div class="modal fade" id="${quizItem.id}-modal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="${quizItem.id}-modal-label">${quizItem.modalTitle}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4">${quizItem.modalContent}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    },

    onInit() {
        onPathChange.subscribe((path) => {
            if (path === MENU_ITEMS_TOP.quizzes.id) {
                this.quizzesListElement.classList.remove('d-none');
            } else {
                this.quizzesListElement.classList.add('d-none');
            }
        });
    },

    onShow() {
        this.quizzesElement.classList.remove('d-none');
    },

    onHide() {
        this.quizzesElement.classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_QUIZZES_COMPONENT.init();
});
