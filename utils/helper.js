/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

/**
 * Gets a random integer between min and max (inclusive)
 * 
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function getRandomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

/**
 * Shuffles array elements randomly
 * 
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

/**
 * Generates all unique combinations of a specified size from an array.
 *
 * @param {Array} arr - The array of elements to combine.
 * @param {number} k - The number of elements each combination should have.
 * @returns {Array} - An array of combinations, where each combination is an array.
 */
function combinations(arr, k) {
    const result = [];

    /**
     * Recursive helper function to build combinations.
     *
     * @param {number} start - The starting index in the array for the current recursion.
     * @param {Array} combo - The current combination being constructed.
     */
    function helper(start, combo) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            helper(i + 1, combo);
            combo.pop();
        }
    }

    helper(0, []);
    return result;
}

function capitalize(s) {
    return s && String(s[0]).toUpperCase() + String(s).slice(1);
}

/**
 * Gets a random character from the characters array
 * 
 * @returns {Object} Random character object
 */
function getRandomCharacter(filterFn) {
    // Determine which array to choose from
    const pool = (typeof filterFn === 'function')
        ? CHARACTERS.filter(filterFn)
        : CHARACTERS;

    // Handle the case where no items match the filter
    if (pool.length === 0) {
        throw new Error("No characters found matching the filter criteria.");
    }

    // Return a random element from the chosen pool
    return pool[getRandomInt(0, pool.length - 1)];
}

function getRandomCharacters(count) {
    return shuffleArray(CHARACTERS).slice(0, count);
}

/**
 * Debounces a function to limit how often it can be called
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Creates an element with attributes and children
 * 
 * @param {string} tag - Element tag name
 * @param {Object} attributes - Element attributes
 * @param {Array|string|Node} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'classList' && Array.isArray(value)) {
            value.forEach(cls => element.classList.add(cls));
        } else if (key === 'events' && typeof value === 'object') {
            Object.entries(value).forEach(([event, handler]) => {
                element.addEventListener(event, handler);
            });
        } else {
            element.setAttribute(key, value);
        }
    });

    if (children) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (child instanceof Node) {
                    element.appendChild(child);
                } else {
                    element.appendChild(document.createTextNode(child));
                }
            });
        } else if (children instanceof Node) {
            element.appendChild(children);
        } else {
            element.textContent = children;
        }
    }

    return element;
}

/**
 * Gets a URL for a character image
 * 
 * @param {string} characterName - Name of the character
 * @param {string} type - Type of image (icon, wish, ingame, etc.)
 * @returns {string} URL of the character image
 */
function getCharacterImageUrl(characterName, type = 'icon') {
    return `assets/character/${type}/${characterName}.png`;
}