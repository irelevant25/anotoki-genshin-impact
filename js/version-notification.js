(() => {
    'use strict';

    /**
     * Injects the latest version notification into the modal
     * @param {string} targetElementId - The ID of the element to inject content into
     */
    function loadWhatsNew(targetElementId = 'whatsNewContent') {
        loadChangelog([CHANGELOG[0]], targetElementId);
    }

    window.loadWhatsNew = loadWhatsNew;
})();