(() => {
    'use strict';

    /**
     * Injects the latest version notification into the modal
     * @param {string} targetElementId - The ID of the element to inject content into
     */
    function renderVersionNotification(modalId = 'versionNotificationModal') {
        const modalElement = document.getElementById(modalId);
        if (!modalElement || !CHANGELOG || CHANGELOG.length === 0) return;

        // Get only the latest version
        const latestVersion = CHANGELOG[0];

        modalElement.querySelector('.version-tag').textContent = `v${latestVersion.version}`;
        modalElement.querySelector('.changelog-date').textContent = `v${latestVersion.date}`;

        let html = '';
        html += generateItemHtml(latestVersion.changes.added, 'added', 'plus-circle-fill');
        html += generateItemHtml(latestVersion.changes.fixed, 'fixed', 'bug-fill');
        html += generateItemHtml(latestVersion.changes.updated, 'updated', 'arrow-repeat');
        modalElement.querySelector('#versionNotificationItems').innerHTML = html;

        var myModal = new bootstrap.Modal(modalElement);
        myModal.show();
    }

    function generateItemHtml(items, type, icon) {
        let html = '';
        if (items.length > 0) {
            html += `
                <div class="change-heading ${type} animate-in delay">
                    <i class="bi bi-${icon}"></i>
                    <span class="capitalize">${type}</span>
                </div>
                <ul>
            `;

            items.forEach(item => {
                html += `<li>${item}</li>`;
            });

            html += `
                </ul>
            `;
        }
        return html
    }

    window.renderVersionNotification = renderVersionNotification;
})();