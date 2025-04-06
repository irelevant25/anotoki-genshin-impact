(() => {
    'use strict';

    /**
     * Changes the background to the specified image
     * 
     * @param {string} imgUrl - URL of the background image
     */
    function changeBackground(imgUrl) {
        const encodedPath = encodeURI(imgUrl);
        document.body.style.backgroundImage = `url(${encodedPath})`;
        storageManager.saveBackground(imgUrl);
    }

    // Function to render the backgrounds
    function init() {
        const container = document.querySelector(`#${MENU_ITEMS_BOTTOM.backgrounds.id}-modal-content`);

        if (container.children.length > 0) return;

        BACKGROUNDS.forEach(background => {
            const imgElement = createElement('img', {
                src: background.preview,
                alt: background.name,
                title: background.name,
                events: {
                    click: () => changeBackground(background.wallpaper),
                }
            });
            container.appendChild(imgElement);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {        
        // Initialize data from storage
        document.body.style.backgroundImage = `url("${storageManager.getBackground() ?? 'assets/wallpaper/Fontaine.avif'}")`;
        document.querySelector(`#${MENU_ITEMS_BOTTOM.backgrounds.id}`).addEventListener('click', init, { once: true });
    });
})();