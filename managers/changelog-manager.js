function renderChangelog() {
    const container = document.getElementById("changelogContent");
    container.innerHTML = ""; // Clear existing content

    changelog.forEach(log => {
        // Outer container for this version
        const versionContainer = document.createElement("div");
        versionContainer.className = "mb-5";

        // Header with version and date
        const headerDiv = document.createElement("div");
        headerDiv.className = "d-flex align-items-baseline mb-4";

        const versionTag = document.createElement("h2");
        versionTag.className = "version-tag me-3";
        versionTag.textContent = log.version;
        headerDiv.appendChild(versionTag);

        const dateSpan = document.createElement("span");
        dateSpan.className = "changelog-date";
        dateSpan.textContent = log.date;
        headerDiv.appendChild(dateSpan);

        versionContainer.appendChild(headerDiv);

        // Container for the list of changes
        const entriesContainer = document.createElement("div");
        entriesContainer.className = "bg-white shadow-sm rounded";

        // Process each change category in a fixed order
        const changeTypes = ["added", "fixed", "updated"];
        changeTypes.forEach(type => {
            const changesForType = log.changes[type];
            if (changesForType.length === 0) return;
            const changeEntry = document.createElement("div");
            changeEntry.className = "changelog-entry position-relative p-4";

            // Indicator for change type
            const changeTypeIndicator = document.createElement("div");
            changeTypeIndicator.className = "change-type " + type;
            changeEntry.appendChild(changeTypeIndicator);

            // Text container
            const textContainer = document.createElement("div");
            textContainer.className = "ms-3";

            const titleEl = document.createElement("h6");
            titleEl.className = "fw-bold mb-3";
            // Capitalize the first letter
            titleEl.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            textContainer.appendChild(titleEl);
            
            const listEl = document.createElement("ul");
            changesForType.forEach(change => {
                const descriptionEl = document.createElement("li");
                descriptionEl.className = "text-muted mb-0";
                descriptionEl.textContent = change;
                listEl.appendChild(descriptionEl);
            });
            changeEntry.appendChild(textContainer);
            textContainer.appendChild(listEl);
            entriesContainer.appendChild(changeEntry);
        });

        versionContainer.appendChild(entriesContainer);
        container.appendChild(versionContainer);
    });
}