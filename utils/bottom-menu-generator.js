(() => {
    'use strict';

    let topMenuElement;

    function initializeMenu() {
        // Generate menu items
        Object.values(MENU_ITEMS_BOTTOM).forEach(menuItem => {
            topMenuElement.innerHTML += `
                <div id="${menuItem.id}" class="item" data-bs-toggle="modal" data-bs-target="#${menuItem.id}-modal">
                    ${menuItem.title}
                </div>
            `;
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        topMenuElement = document.querySelector("#bottom-menu");
        initializeMenu();
    });
})();