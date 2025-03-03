/**
 * Changelog Manager
 * Handles rendering of changelog entries
 */

/**
 * Renders the changelog in the modal
 */
window.renderChangelog = function () {
    const container = document.getElementById("changelogContent");
    if (!container || !changelog) return;

    // Clear existing content
    container.innerHTML = "";

    // Process each changelog entry
    changelog.forEach(log => {
        // Create version container
        const versionContainer = createElement('div', {
            className: 'mb-5'
        });

        // Add header with version and date
        const headerDiv = createElement('div', {
            className: 'd-flex align-items-baseline mb-4'
        });

        const versionTag = createElement('h2', {
            className: 'version-tag me-3'
        }, log.version);

        const dateSpan = createElement('span', {
            className: 'changelog-date'
        }, log.date);

        headerDiv.appendChild(versionTag);
        headerDiv.appendChild(dateSpan);
        versionContainer.appendChild(headerDiv);

        // Create entries container
        const entriesContainer = createElement('div', {
            className: 'bg-white shadow-sm rounded'
        });

        // Process each change category in a fixed order
        const changeTypes = ["added", "fixed", "updated"];
        changeTypes.forEach(type => {
            const changesForType = log.changes[type];
            if (changesForType.length === 0) return;

            // Create change entry
            const changeEntry = createElement('div', {
                className: 'changelog-entry position-relative p-4'
            });

            // Add type indicator
            const changeTypeIndicator = createElement('div', {
                className: `change-type ${type}`
            });
            changeEntry.appendChild(changeTypeIndicator);

            // Add text container
            const textContainer = createElement('div', {
                className: 'ms-3'
            });

            // Add title
            const titleEl = createElement('h6', {
                className: 'fw-bold mb-3'
            }, type.charAt(0).toUpperCase() + type.slice(1));
            textContainer.appendChild(titleEl);

            // Add list of changes
            const listEl = createElement('ul');
            changesForType.forEach(change => {
                const descriptionEl = createElement('li', {
                    className: 'text-muted mb-0'
                }, change);
                listEl.appendChild(descriptionEl);
            });

            textContainer.appendChild(listEl);
            changeEntry.appendChild(textContainer);
            entriesContainer.appendChild(changeEntry);
        });

        versionContainer.appendChild(entriesContainer);
        container.appendChild(versionContainer);
    });
}