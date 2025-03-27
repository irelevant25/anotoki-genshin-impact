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

/**
 * Converts a numerical difficulty level to its corresponding string representation.
 *
 * @param {number} number - The numerical difficulty level (1, 2, or 3).
 * @returns {string} The string representation of the difficulty ('easy', 'medium', or 'hard').
 */
function difficultyFromNumberToString(number) {
    const strings = ['easy', 'medium', 'hard'];
    return strings[Number(number) - 1];
}

/**
 * Converts a string representation of a difficulty level to its corresponding numerical value.
 *
 * @param {string} string - The string representation of the difficulty ('1', '2', or '3').
 * @returns {number} The numerical difficulty level (1, 2, or 3).
 */
function difficultyFromStringToNumber(string) {
    const numbers = ['1', '2', '3'];
    return numbers.indexOf(string) + 1;
}

/**
 * Returns today's date as a string in the format 'YYYY-MM-DD'.
 *
 * @returns {string} Today's date as a string in the format 'YYYY-MM-DD'.
 */
function getTodayString() {
    return new Date().toJSON().slice(0, 10);
}

/**
 * Gets the URL of the icon image for a character.
 *
 * @param {string} characterName - The name of the character.
 * @returns {string} The URL of the icon image, or undefined if the character is not found.
 */
function getCharacterIconImageUrl(characterName) {
    return CHARACTERS.find(character => character.name === characterName)?.icon;
}

/**
 * Capitalizes the first character of a string.
 *
 * @param {string} s - The string to be capitalized.
 * @returns {string} The input string with the first character converted to uppercase.
 */

function capitalize(s) {
    return s && String(s[0]).toUpperCase() + String(s).slice(1);
}


/**
 * Gets a random character from the given array or from the full list of characters
 * if no filter is provided.
 *
 * @param {Function} [filterFn] - Optional filter function to filter the characters
 * @returns {Object} A random character object from the filtered array
 * @throws {Error} If no characters match the filter criteria
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

/**
 * Gets a specified number of random characters from the full list of characters.
 *
 * @param {number} count - The number of characters to return
 * @returns {Array} An array of random character objects
 */
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

/**
 * Loads a JavaScript script from a given URL
 * 
 * @param {string} src - URL of the script to load
 * @param {Function} callback - Function to call when the script has been loaded
 */
function loadScript(src, callback) {
    if (isScriptLoaded(src)) {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => callback();
    document.head.appendChild(script);
}

/**
 * Checks if a script with the specified source URL is already loaded in the document.
 * 
 * @param {string} src - The source URL of the script to check.
 * @returns {boolean} True if the script is loaded, false otherwise.
 */
function isScriptLoaded(src) {
    return !!document.querySelector(`script[src="${src}"]`);
}