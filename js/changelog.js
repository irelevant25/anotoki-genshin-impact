(() => {
    // Function to format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Function to render the changelog
    function loadChangelog(providedChangelog, targetElementId = 'changelogContent') {
        const container = document.getElementById(targetElementId);

        if (container.children.length > 0) return;

        (providedChangelog ?? CHANGELOG).forEach((entry, index) => {
            const versionCard = document.createElement('div');
            versionCard.className = 'version-card';
            if (index === 0) versionCard.classList.add('highlight');

            // Version header
            const versionHeader = document.createElement('div');
            versionHeader.className = 'version-header';

            const versionNumber = document.createElement('div');
            versionNumber.className = 'version-number';
            versionNumber.innerHTML = `v${entry.version}`;

            if (index === 0) {
                const latestBadge = document.createElement('span');
                latestBadge.textContent = 'Latest';
                versionNumber.appendChild(latestBadge);
            }

            const versionDate = document.createElement('div');
            versionDate.className = 'version-date';
            versionDate.textContent = formatDate(entry.date);

            versionHeader.appendChild(versionNumber);
            versionHeader.appendChild(versionDate);
            versionCard.appendChild(versionHeader);

            // Added changes
            if (entry.changes.added && entry.changes.added.length > 0) {
                const addedSection = document.createElement('div');
                addedSection.className = 'changes-section';

                const addedTitle = document.createElement('div');
                addedTitle.className = 'section-title added';
                addedTitle.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1V15M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Added
            `;
                addedSection.appendChild(addedTitle);

                const addedList = document.createElement('ul');
                addedList.className = 'changes-list added';

                entry.changes.added.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = item;

                    if (index === 0) {
                        const newBadge = document.createElement('span');
                        newBadge.className = 'badge new';
                        newBadge.textContent = 'new';
                        listItem.appendChild(newBadge);
                    }

                    addedList.appendChild(listItem);
                });

                addedSection.appendChild(addedList);
                versionCard.appendChild(addedSection);
            }

            // Fixed changes
            if (entry.changes.fixed && entry.changes.fixed.length > 0) {
                const fixedSection = document.createElement('div');
                fixedSection.className = 'changes-section';

                const fixedTitle = document.createElement('div');
                fixedTitle.className = 'section-title fixed';
                fixedTitle.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 5.5L8 11.5L2 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Fixed
            `;
                fixedSection.appendChild(fixedTitle);

                const fixedList = document.createElement('ul');
                fixedList.className = 'changes-list fixed';

                entry.changes.fixed.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = item;
                    fixedList.appendChild(listItem);
                });

                fixedSection.appendChild(fixedList);
                versionCard.appendChild(fixedSection);
            } else if (entry.changes.fixed && entry.changes.fixed.length === 0) {
                const fixedSection = document.createElement('div');
                fixedSection.className = 'changes-section';

                const fixedTitle = document.createElement('div');
                fixedTitle.className = 'section-title fixed';
                fixedTitle.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 5.5L8 11.5L2 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Fixed
            `;
                fixedSection.appendChild(fixedTitle);

                const emptyNotice = document.createElement('div');
                emptyNotice.className = 'empty-notice';
                emptyNotice.textContent = 'No fixes in this version';
                fixedSection.appendChild(emptyNotice);

                versionCard.appendChild(fixedSection);
            }

            // Updated changes
            if (entry.changes.updated && entry.changes.updated.length > 0) {
                const updatedSection = document.createElement('div');
                updatedSection.className = 'changes-section';

                const updatedTitle = document.createElement('div');
                updatedTitle.className = 'section-title updated';
                updatedTitle.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 4V8L11 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Updated
            `;
                updatedSection.appendChild(updatedTitle);

                const updatedList = document.createElement('ul');
                updatedList.className = 'changes-list updated';

                entry.changes.updated.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = item;
                    updatedList.appendChild(listItem);
                });

                updatedSection.appendChild(updatedList);
                versionCard.appendChild(updatedSection);
            }

            container.appendChild(versionCard);
        });
    }

    // Render the changelog on page load
    window.loadChangelog = loadChangelog;
})();