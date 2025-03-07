(() => {
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
    function loadBackgrounds(targetElementId = 'backgroundImage') {
        const container = document.getElementById(targetElementId);

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

    // Render the backgrounds on page load
    window.loadBackgrounds = loadBackgrounds;
})();