(() => {
    'use strict';

    let quizzesElement;
    let quizzesListElement;

    function getHelpIcon(quizItem) {
        if (!quizItem.helpIcon) return '';
        return `
            <div id="${quizItem.id}-help-icon" class="help-icon right" data-bs-toggle="tooltip" data-bs-placement="left" title="${quizItem.modalTitle}">
                <i class="bi bi-question-circle-fill" data-bs-toggle="modal" data-bs-target="#${quizItem.id}-modal"
                    onclick="event.stopPropagation()"></i>
            </div>
        `;
    }

    function init() {
        // Generate list
        let quizzesListHtml = '';
        Object.values(QUIZZES).forEach(quizItem => {
            quizzesListHtml += `
                <div class="card" data-id="${quizItem.id}">
                    ${getHelpIcon(quizItem)}
                    <img src="${quizItem.cardImage}">
                    <div class="card-body">
                        <h5 class="card-title">${quizItem.title}</h5>
                        <p class="card-text">${quizItem.cardInfo}</p>
                    </div>
                </div>    
            `;
        });
        quizzesListElement.innerHTML = quizzesListHtml;

        const items = quizzesListElement.querySelectorAll('div.card');

        // Add click handler to each menu item
        items.forEach(item => {
            item.addEventListener('click', () => itemClick(item));
        });

        console.log(`${items.length} quizzes initialized.`);

        // Generate menu items help modals
        const helpModals = document.createElement('div');
        document.body.appendChild(helpModals);
        Object.values(QUIZZES).forEach(quizItem => {
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

        const modalItems = document.querySelectorAll('div.modal');
        console.log('Menu items help modals initialized with', modalItems.length, 'items');
    }

    function defaultState() {
        quizzesListElement.classList.remove('d-none');
        quizzesElement.querySelectorAll("& > div[id^='site-']").forEach(element => {
            element.classList.add('d-none');
        });
    }

    function itemClick(quizItem) {
        // Skip if no data-id
        if (!quizItem.dataset.id) return;

        defaultState();

        // Toggle active state of clicked item
        quizzesElement.querySelector(`#${quizItem.dataset.id}`).classList.remove('d-none');
        quizzesListElement.classList.add('d-none');
    }

    document.addEventListener('DOMContentLoaded', () => {
        quizzesElement = document.querySelector(`#${MENU_ITEMS_TOP.quizzes.id}`);
        quizzesListElement = document.querySelector("#quizzes-list");
        document.querySelector(`li[data-id="${MENU_ITEMS_TOP.quizzes.id}"]`).addEventListener('click', () => {
            defaultState();
        });
        init();
    });
})();