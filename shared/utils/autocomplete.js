class Autocomplete {
    constructor(containerElement, itemClickCallback) {
        this.containerElement = containerElement.querySelector('div[name="autocomplete"]') ?? containerElement;
        this.itemClickCallback = itemClickCallback;
        this.renderAutocomplete();

        this.autocompleteInputElement = this.containerElement.querySelector('input');
        this.autocompleteDropdownElement = this.containerElement.querySelector('div.dropdown-menu');

        const _boundMarkActiveItemOfAutocomplete = this.markActiveItemOfAutocomplete.bind(this);
        this.autocompleteDropdownElement?.addEventListener('mouseover', _boundMarkActiveItemOfAutocomplete);
        this.autocompleteInputElement?.addEventListener('keydown', _boundMarkActiveItemOfAutocomplete);

        document.addEventListener('click', (e) => {
            if (!this.autocompleteInputElement?.contains(e.target) &&
                !this.autocompleteDropdownElement?.contains(e.target)) {
                    this.autocompleteDropdownElement?.classList.remove('show');
            }
        });

        this.autocompleteInputElement?.addEventListener('input', () => {
            this.autocompleteFilter();
        });

        this.autocompleteInputElement?.addEventListener('click', () => {
            this.autocompleteFilter();
        });
    }

    renderAutocomplete() {
        this.containerElement.innerHTML = `
            <div class="autocomplete position-relative">
                <input type="text" class="form-control" placeholder="Search...">
                <div class="dropdown-menu autocomplete-dropdown"></div>
            </div>
        `;
    }

    autocompleteFilter() {
        const query = this.autocompleteInputElement?.value.toLowerCase();
        const filteredData = CHARACTERS.filter(character =>
            character.name.toLowerCase().includes(query));

        // Clear existing options
        Array.from(this.autocompleteDropdownElement?.children ?? [])
            .forEach(item => item.remove());

        if (filteredData.length) {
            // Add new options
            filteredData.forEach(character => {
                const option = document.createElement('div');
                option.classList.add('autocomplete-item');
                option.innerHTML = `
                    <img src="${getCharacterIconImageUrl(character.name)}" alt="${character.name}">
                    <span>${character.name}</span>
                `;
                option.addEventListener('click', () => {
                    this.autocompleteDropdownElement.classList.remove('show');
                    this.autocompleteInputElement.value = '';
                    this.itemClickCallback(character);
                });
                this.autocompleteDropdownElement.appendChild(option);
            });

            // Show dropdown and highlight first item
            this.autocompleteDropdownElement.classList.add('show');
            this.autocompleteDropdownElement.children[0].classList.add('active');
        } else {
            this.autocompleteDropdownElement.classList.remove('show');
        }
    }

    markActiveItemOfAutocomplete(event) {
        if (event instanceof MouseEvent) {
            const element = event.target.closest('.autocomplete-item');
            if (!element) return;

            this.containerElement.querySelectorAll('div.dropdown-menu div.autocomplete-item')
                .forEach(item => item.classList.remove('active'));
            element.classList.add('active');
        }
        else if (event instanceof KeyboardEvent) {
            const currentActiveElement = this.autocompleteDropdownElement.querySelector('div.autocomplete-item.active');
            if (!currentActiveElement) return;

            let newActiveElement;
            switch (event.key) {
                case 'ArrowUp':
                    newActiveElement = currentActiveElement.previousElementSibling;
                    break;
                case 'ArrowDown':
                    newActiveElement = currentActiveElement.nextElementSibling;
                    break;
                case 'Enter':
                    currentActiveElement.click();
                    return;
            }

            if (newActiveElement) {
                currentActiveElement.classList.remove('active');
                newActiveElement.classList.add('active');
                newActiveElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}