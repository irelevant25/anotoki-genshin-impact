/**
 * Menu Component
 * Handles menu selection and navigation
 */

/**
 * Initializes the menu functionality
 */
window.initializeMenu = function () {
    // Generate menu items
    const ul = document.createElement('ul');
    document.querySelector("nav").appendChild(ul);
    Object.values(MENU_ITEMS).forEach(menuItem => {
        ul.innerHTML += `
                <li data-id="${menuItem.id}">
                    <div class="help-icon" data-bs-toggle="tooltip" data-bs-placement="${menuItem.helpIconPlacement}" title="${menuItem.modalTitle}">
                        <i class="bi bi-question-circle-fill" data-bs-toggle="modal" data-bs-target="#${menuItem.id}-modal"
                            onclick="event.stopPropagation()"></i>
                    </div>
                    <a>${menuItem.title}</a>
                </li>
            `;
    });

    const menuItems = document.querySelectorAll('nav > ul > li');

    // Add click handler to each menu item
    menuItems.forEach(item => {
        item.addEventListener('click', () => topMenuItemClick(item));
    });

    console.log('Menu initialized with', menuItems.length, 'items');

    // Generate menu items help modals
    const helpModals = document.createElement('div');
    document.body.appendChild(helpModals);
    Object.values(MENU_ITEMS).forEach(menuItem => {
        helpModals.innerHTML += `
                <div class="modal fade" id="${menuItem.id}-modal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="${menuItem.id}-modal-label">${menuItem.modalTitle}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4">${menuItem.modalContent}</div>
                        </div>
                    </div>
                </div>
            `;
    });

    const modalItems = document.querySelectorAll('div > div.modal');
    console.log('Menu items help modals initialized with', modalItems.length, 'items');
}

/**
 * Handles menu item clicks
 * 
 * @param {Object} menuItem - The clicked menu item from MENU_ITEMS dataset
 */
window.topMenuItemClick = function (menuItem) {
    // Skip if no data-id
    if (!menuItem.dataset.id) return;

    // Deactivate other menu items
    document.querySelectorAll("nav > ul > li").forEach(element => {
        if (element !== menuItem) {
            element.classList.remove('active');
        }
    });

    // Toggle active state of clicked item
    menuItem.classList.toggle('active');

    // Get the associated content element
    const content = document.querySelector('#' + menuItem.dataset.id);

    // Hide other content
    document.querySelectorAll("div.container").forEach(element => {
        if (element !== content) {
            element.classList.add('d-none');
        }
    });

    // Toggle this content
    if (content) {
        // d-none
        content.classList.contains('d-none') ? content.classList.remove('d-none') : content.classList.add('d-none');
    }
}