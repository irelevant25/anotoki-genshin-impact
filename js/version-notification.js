(() => {
    'use strict';

    /**
     * Injects the latest version notification into the modal
     * @param {string} targetElementId - The ID of the element to inject content into
     */
    function renderVersionNotification(modalId = 'versionNotificationModal') {
        initializeChangelog([CHANGELOG[0]], 'versionNotificationContent');
        const modalElement = document.getElementById(modalId);

        var myModal = new bootstrap.Modal(modalElement);
        myModal.show();
    }

    window.renderVersionNotification = renderVersionNotification;
})();