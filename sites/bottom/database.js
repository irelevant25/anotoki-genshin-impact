(() => {
    'use strict';

    let character;
    let containerElement;

    // Main function to display character info
    function displayCharacterInfo() {
        // Create header section
        createCharacterHeader();

        // Setup tabs
        setupTabs();

        // Create content for each tab
        createAscensionsTab();
        createTalentsTab();
        createConstellationsTab();
    }

    // Create the character header section
    function createCharacterHeader() {
        const headerElement = containerElement.querySelector('#character-header');

        // Create character image and basic info sections
        const headerHTML = `
        <img src="${character.card}" alt="${character.name}" class="character-image">
        
        <div class="character-basics">
            <h1 class="character-name ${character.element.toLowerCase()}">
                ${character.name}
                <span class="rarity-stars">${'★'.repeat(parseInt(character.rarity))}</span>
            </h1>
            
            ${character.titles && character.titles.length ? `<div class="character-title">${character.titles[0]}</div>` : ''}
            
            <div class="character-info">
                <div class="info-item">
                    <span class="info-label">Element:</span>
                    <span class="info-value">
                        <img src="${character.element_icon}" alt="${character.element}" class="element-icon">
                        ${character.element}
                    </span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Weapon:</span>
                    <span class="info-value">
                        <img src="${character.weapont_type_icon}" alt="${character.weapon_type}" class="weapon-icon">
                        ${character.weapon_type}
                    </span>
                </div>
                
                ${character.region ? `
                <div class="info-item">
                    <span class="info-label">Region:</span>
                    <span class="info-value">
                        ${character.region_icon ? `<img src="${character.region_icon}" alt="${character.region}" class="region-icon">` : ''}
                        ${character.region}
                    </span>
                </div>
                ` : ''}
                
                <div class="info-item">
                    <span class="info-label">Model:</span>
                    <span class="info-value">${character.model_type}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Birthday:</span>
                    <span class="info-value">${character.birthday}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Released:</span>
                    <span class="info-value">${character.release_date} (v${character.version})</span>
                </div>
            </div>
            
            ${character.voice_actors && character.voice_actors.length ? `
            <div class="voice-actors">
                <h3>Voice Actors</h3>
                ${character.voice_actors.map(va => `
                    <div class="voice-actor">
                        <strong>${va.language}:</strong> ${va.actor}
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
    `;

        headerElement.innerHTML = headerHTML;
    }

    // Setup tab functionality
    function setupTabs() {
        const tabButtons = containerElement.querySelectorAll('.tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and content
                tabButtons.forEach(btn => btn.classList.remove('active'));
                containerElement.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                containerElement.querySelector(`#${button.dataset.tab}`).classList.add('active');
            });
        });
    }

    // Create Ascensions tab content
    function createAscensionsTab() {
        const ascensionTableElement = containerElement.querySelector('.ascension-table');

        // Create ascension table
        let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th class="checkbox-column"></th>
                    <th>Phase</th>
                    <th>Levels</th>
                    <th>HP</th>
                    <th>ATK</th>
                    <th>DEF</th>
                    <th>${character.ascensions_materials_and_stats[0].primary_stat.name}</th>
                    <th>Materials</th>
                </tr>
            </thead>
            <tbody>
    `;

        // Add rows for each ascension phase
        character.ascensions_materials_and_stats.forEach(ascension => {
            const phaseNumber = ascension.phase;

            if (phaseNumber === 0) {
                // Base stats, no materials needed
                tableHTML += `
                <tr>
                    <td class="checkbox-column"></td>
                    <td>${phaseNumber}</td>
                    <td>
                        ${ascension.levels.map(level => `<div>${level.level}</div>`).join('')}
                    </td>
                    <td>
                        ${ascension.levels.map(level => `<div>${Math.round(level.hp)}</div>`).join('')}
                    </td>
                    <td>
                        ${ascension.levels.map(level => `<div>${Math.round(level.atk)}</div>`).join('')}
                    </td>
                    <td>
                        ${ascension.levels.map(level => `<div>${Math.round(level.def)}</div>`).join('')}
                    </td>
                    <td>
                        ${ascension.primary_stat.value}
                    </td>
                    <td>-</td>
                </tr>
            `;
            } else {
                // Ascension phase with materials
                let materialsHTML = '';

                if (ascension.cost && ascension.cost.length) {
                    materialsHTML = `
                        <div class="materials-container">
                            ${ascension.cost.map(material => `
                                <div class="material-item" data-material="${material.name}">
                                    <img src="${material.icon}" alt="${material.name}" class="material-icon">
                                    <span class="material-name">${material.name} x${material.value}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                tableHTML += `
                    <tr data-phase="${phaseNumber}">
                        <td class="checkbox-column">
                            <input type="checkbox" class="ascension-checkbox" data-phase="${phaseNumber}" data-type="ascension" checked>
                        </td>
                        <td>${phaseNumber}</td>
                        <td>
                            ${ascension.levels.map(level => `<div>${level.level}</div>`).join('')}
                        </td>
                        <td>
                            ${ascension.levels.map(level => `<div>${Math.round(level.hp)}</div>`).join('')}
                        </td>
                        <td>
                            ${ascension.levels.map(level => `<div>${Math.round(level.atk)}</div>`).join('')}
                        </td>
                        <td>
                            ${ascension.levels.map(level => `<div>${Math.round(level.def)}</div>`).join('')}
                        </td>
                        <td>
                            ${ascension.primary_stat.value}
                        </td>
                        <td>${materialsHTML}</td>
                    </tr>
                `;
            }
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        ascensionTableElement.innerHTML = tableHTML;
        // Adding ascension data to the element programatically instead of manual to avoid json parsing error
        ascensionTableElement.querySelectorAll('tbody > tr').forEach((row, index) => {
            const ascension = character.ascensions_materials_and_stats[index];
            let materialsJSON = '';

            if (ascension?.cost && ascension?.cost.length) {
                // Create JSON representation of materials for data attribute
                materialsJSON = JSON.stringify(ascension.cost.map(material => ({
                    name: material.name,
                    value: material.value,
                    icon: material.icon
                })));
                row.dataset.materials = materialsJSON;
            }
        });

        // Add event listeners to checkboxes
        const checkboxes = ascensionTableElement.querySelectorAll('.ascension-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateTotalMaterials('ascension');
            });
        });

        // Initial calculation of total materials
        updateTotalMaterials('ascension');
    }

    // Create Talents tab content
    function createTalentsTab() {
        const talentsInfoElement = containerElement.querySelector('.talents-info');
        const talentTableElement = containerElement.querySelector('.talent-level-table');

        // Display talents information
        let talentsHTML = '';
        character.talents.forEach(talent => {
            talentsHTML += `
            <div class="talent">
                <div class="talent-header">
                    <img src="${talent.icon}" alt="${talent.name}" class="talent-icon">
                    <h3 class="talent-name">${talent.name}</h3>
                    <span class="talent-type">${talent.type}</span>
                </div>
                <div class="talent-description">${talent.description}</div>
            </div>
        `;
        });

        talentsInfoElement.innerHTML = talentsHTML;

        // Create talent level-up materials table
        let tableHTML = `
        <h3>Talent Level-Up Materials</h3>
        <table>
            <thead>
                <tr>
                    <th class="checkbox-column"></th>
                    <th>Level</th>
                    <th>Materials</th>
                </tr>
            </thead>
            <tbody>
    `;

        // Add rows for each talent level
        character.talents_materials.forEach(level => {
            tableHTML += `
            <tr data-level="${level.level}">
                <td class="checkbox-column">
                    <input type="checkbox" class="talent-checkbox" data-level="${level.level}" data-type="talent" checked>
                </td>
                <td>Level ${level.level}</td>
                <td>
                    <div class="materials-container">
                    ${level.cost.map(material => `
                        <div class="material-item" data-material="${material.name}">
                            <img src="${material.icon}" alt="${material.name}" class="material-icon">
                            <span class="material-name">${material.name} x${material.value}</span>
                        </div>
                    `).join('')}
                    </div>
                </td>
            </tr>
        `;
        });

        tableHTML += `
            </tbody>
        </table>
        <p><em>Note: These materials are for leveling up one talent. For all three talents, multiply by 3.</em></p>
    `;

        talentTableElement.innerHTML = tableHTML;
        // Adding level data to the element programatically instead of manual to avoid json parsing error
        talentTableElement.querySelectorAll('tbody > tr').forEach((row, index) => {
            const level = character.talents_materials[index];
            let materialsJSON = '';

            if (level?.cost && level?.cost?.length) {
                // Create JSON representation of materials for data attribute
                materialsJSON = JSON.stringify(level.cost.map(material => ({
                    name: material.name,
                    value: material.value,
                    icon: material.icon
                })));
                row.dataset.materials = materialsJSON;
            }
        });

        // Add event listeners to checkboxes
        const checkboxes = talentTableElement.querySelectorAll('.talent-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateTotalMaterials('talent');
            });
        });

        // Initial calculation of total materials
        updateTotalMaterials('talent');
    }

    // Create Constellations tab content
    function createConstellationsTab() {
        const constellationsElement = containerElement.querySelector('.constellations-info');

        // Display constellations information
        let constellationsHTML = '';
        character.constellations.forEach(constellation => {
            constellationsHTML += `
            <div class="constellation">
                <div class="constellation-header">
                    <img src="${constellation.icon}" alt="${constellation.name}" class="constellation-icon">
                    <h3 class="constellation-name">${constellation.name}</h3>
                    <span class="constellation-level">Level ${constellation.level}</span>
                </div>
                <div class="constellation-description">${constellation.description}</div>
            </div>
        `;
        });

        constellationsElement.innerHTML = constellationsHTML;
    }

    // Update total materials calculation
    function updateTotalMaterials(type) {
        const materialsTotalElement = containerElement.querySelector(`#${type}-materials`);
        const totalMaterials = new Map();

        if (type === 'ascension') {
            // Get all checked ascension checkboxes
            const checkedRows = containerElement.querySelectorAll(`.ascension-checkbox[data-type="${type}"]:checked`);

            // Calculate total materials based on checked rows
            checkedRows.forEach(checkbox => {
                const row = checkbox.closest('tr');

                if (row.hasAttribute('data-materials')) {
                    const materials = JSON.parse(row.getAttribute('data-materials'));

                    materials.forEach(material => {
                        if (totalMaterials.has(material.name)) {
                            totalMaterials.set(material.name, {
                                value: totalMaterials.get(material.name).value + material.value,
                                icon: material.icon
                            });
                        } else {
                            totalMaterials.set(material.name, {
                                value: material.value,
                                icon: material.icon
                            });
                        }
                    });
                }
            });
        } else if (type === 'talent') {
            // Get all checked talent checkboxes
            const checkedRows = containerElement.querySelectorAll(`.talent-checkbox[data-type="${type}"]:checked`);

            // Calculate total materials based on checked rows
            checkedRows.forEach(checkbox => {
                const row = checkbox.closest('tr');

                if (row.hasAttribute('data-materials')) {
                    const materials = JSON.parse(row.getAttribute('data-materials'));

                    materials.forEach(material => {
                        if (totalMaterials.has(material.name)) {
                            totalMaterials.set(material.name, {
                                value: totalMaterials.get(material.name).value + material.value,
                                icon: material.icon
                            });
                        } else {
                            totalMaterials.set(material.name, {
                                value: material.value,
                                icon: material.icon
                            });
                        }
                    });
                }
            });
        }

        // Create the HTML for total materials
        let totalHTML = `
            <h3>Total ${type === 'ascension' ? 'Ascension' : 'Talent Level-Up'} Materials</h3>
            <div class="total-material-list">
        `;

        // Add each material to the total
        totalMaterials.forEach((material, name) => {
            totalHTML += `
            <div class="total-material-item">
                <img src="${material.icon}" alt="${name}" class="material-icon">
                <span class="material-name">${name} x${material.value}</span>
            </div>
            `;
        });

        totalHTML += `
            </div>
        `;
        materialsTotalElement.innerHTML = totalHTML;
    }

    // Process data when page loads
    document.addEventListener('DOMContentLoaded', () => {
        containerElement = document.querySelector(`#${MENU_ITEMS_BOTTOM.database.id}-modal`);
        character = getRandomCharacter();
        displayCharacterInfo();
        new Autocomplete(containerElement, (selectedCharacter) => {
            character = selectedCharacter;
            displayCharacterInfo();
        });
    });
})();