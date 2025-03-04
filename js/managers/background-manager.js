/**
 * Background Manager
 * Handles background image selection and display
 */

class BackgroundManager {
    /**
     * Creates a new BackgroundManager instance
     * 
     * @param {string} idSelector - ID of the background container
     */
    constructor(idSelector) {
        if (!idSelector) {
            throw new Error('idSelector is required');
        }
        this.idSelector = idSelector;

        // Default properties
        this.max_choices = null;
        this.random = false;
        this.previewType = QuizManager.PREVIEW_TYPES.Wish;
        this.alreadyRendered = false;
    }

    /**
     * Initializes the background manager
     * 
     * @param {Object} options - Initialization options
     */
    init({ max_choices = this.max_choices, random = this.random, previewType = this.previewType } = {}) {
        this.max_choices = max_choices;
        this.random = random;
        this.previewType = previewType;

        this.containerElement = document.querySelector(`#${this.idSelector}`);
        this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);

        // Remove existing listeners to prevent duplicates
        this.menuItemElement.removeEventListener('click', this.renderList);

        // Bind and add the event listener
        this.menuItemElement.addEventListener('click', this.renderList.bind(this));
    }

    /**
     * Resets the container to its default state
     */
    defaultState() {
        if (this.containerElement) {
            this.containerElement.innerHTML = '';
        }
    }

    /**
     * Renders the list of available backgrounds
     * 
     * @param {Event} menuItem - The click event
     */
    renderList(menuItem) {
        if (this.alreadyRendered || menuItem && !menuItem.currentTarget.classList.contains('active')) return;
        else this.defaultState();
        this.alreadyRendered = true;

        BACKGROUNDS.forEach(background => {
            const imgElement = createElement('img', {
                src: background.wallpaper,
                alt: background.name,
                title: background.name,
                events: {
                    click: () => this.changeBackground(background.wallpaper),
                }
            });
            this.containerElement.appendChild(imgElement);
        });
    }

    /**
     * Changes the background to the specified image
     * 
     * @param {string} imgUrl - URL of the background image
     */
    changeBackground(imgUrl) {
        const encodedPath = encodeURI(imgUrl);
        document.body.style.backgroundImage = `url(${encodedPath})`;
        storageManager.saveBackground(imgUrl);
    }
}