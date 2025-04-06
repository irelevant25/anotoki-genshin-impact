(() => {
    'use strict';

    let container;

    function initializeMenu() {
        // Generate menu items
        Object.values(MENU_ITEMS_BOTTOM).forEach(menuItem => {
            container.innerHTML += `
                <div id="${menuItem.id}" class="item" data-bs-toggle="modal" data-bs-target="#${menuItem.id}-modal">
                    ${menuItem.title}
                </div>
            `;
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        container = document.querySelector("#bottom-menu");
        initializeMenu();
    });
})();