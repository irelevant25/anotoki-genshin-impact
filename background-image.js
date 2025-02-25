class BackgroundManager {
    // Static properties
    static PreviewTypeEnum = {
        Wish: 'wish',
        InGame: 'ingame',
        Card: 'card',
        Icon: 'icon',
    };

    // Instance properties
    max_choices = null;
    random = false;
    previewType = BackgroundManager.PreviewTypeEnum.Wish;
    alreadyRendered = false;

    constructor(idSelector) {
        if (!idSelector) {
            throw new Error('idSelector is required');
        }
        this.idSelector = idSelector;
    }

    init({ max_choices = this.max_choices, random = this.random, previewType = this.previewType } = {}) {
        this.max_choices = max_choices;
        this.random = random;
        this.previewType = previewType;

        this.containerElement = document.querySelector(`#${this.idSelector}`);
        this.menuItemElement = document.querySelector(`nav > ul > li[data-id="${this.idSelector}"]`);

        this.menuItemElement.removeEventListener('click', this.renderList);

        this.menuItemElement.addEventListener('click', this.renderList.bind(this));
    }

    defaultState() {
        this.containerElement.innerHTML = '';
    }

    renderList(menuItem) {
        if (this.alreadyRendered || menuItem && !menuItem.currentTarget.classList.contains('active')) return;
        else this.defaultState();
        this.alreadyRendered = true;

        const charactersWithWallpaper = [];
        const imagePromises = characters.map(character => {
            return new Promise(resolve => {
                const preloader = new Image();
                preloader.onload = () => {
                    charactersWithWallpaper.push(character);
                    resolve();
                };
                preloader.onerror = () => {
                    console.warn(`Image not found: ${this.getCharacterWallpaperImageUrl(character.name)}`);
                    resolve();
                };
                preloader.src = this.getCharacterWallpaperImageUrl(character.name);
            });
        });
        Promise.all(imagePromises).then(() => {
            charactersWithWallpaper.sort((a, b) => a.name.localeCompare(b.name)).forEach(character => {
                const imgElement = document.createElement('img');
                imgElement.src = this.getCharacterImageUrl(character.name);
                this.containerElement.appendChild(imgElement);
                imgElement.addEventListener('click', () => {
                    this.changeBackground(this.getCharacterWallpaperImageUrl(character.name))
                });
            });
        });
    }

    getCharacterImageUrl(characterName) {
        return `assets/character/${this.previewType}/${characterName}.png`;
    }

    getCharacterWallpaperImageUrl(characterName) {
        return `assets/character/wallpaper/${characterName}.png`;
    }

    changeBackground(imgUrl) {
        const encodedPath = encodeURI(imgUrl);
        document.body.style.backgroundImage = `url(${encodedPath})`;
    }
}