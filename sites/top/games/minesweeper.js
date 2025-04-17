const SITES_TOP_GAMES_MINESWEEPER = Vue.createApp({
    template: html`
        <div class="container game-container">
            <div class="game-info mt-3">
                <div class="reactions-container">
                    <div class="reaction" v-for="reaction in dangerousReactions">{{ reaction.name }} ({{ reaction.elements.join(' + ') }})</div>
                </div>
            </div>

            <div class="game-over-message" :class="gameOver" v-show="gameOver">
                <span v-show="gameOver === 'win'">You Win! All safe cells revealed!</span>
                <span v-show="gameOver === 'lose'">Game Over! You hit a bomb!</span>
            </div>

            <div class="grid">
                <div class="cell" :class="cellClasses(cell)" v-for="cell in grid.flat()" @click="handleCellClick(cell)" ref="cellElement">
                    <span v-if="cell.revealed && cell.element !== 'empty'">{{ cellContent(cell) }}</span>
                </div>
            </div>

            <div class="game-stats">
                <div>Cells Revealed: <span>{{ revealedCount }}</span> / <span>{{ gridSize * gridSize }}</span></div>
            </div>

            <div class="controls">
                <button @click="startGame">New Game</button>
            </div>

            <div class="legend mb-3">
                <div class="legend-item" v-for="element in elements">
                    <div class="legend-color" :class="'color-' + element"></div>
                    <span>{{ element }}</span>
                </div>
            </div>
        </div>
    `,

    data() {
        const siteId = 'minesweeper';
        const config = APP_CONFIG.topMenu[siteId];
        const state = storageManager.getTopMenuMinesweeperState();
        const difficulty = state?.difficulty || storageManager.getDifficulty() || 1;
        const elements = ['pyro', 'hydro', 'anemo', 'electro', 'dendro', 'cryo', 'geo'];
        const allReactions = [
            { name: 'Vaporize', elements: ['pyro', 'hydro'] },
            { name: 'Melt', elements: ['pyro', 'cryo'] },
            { name: 'Overloaded', elements: ['pyro', 'electro'] },
            { name: 'Burning', elements: ['pyro', 'dendro'] },
            { name: 'Freeze', elements: ['hydro', 'cryo'] },
            { name: 'Electro-Charged', elements: ['hydro', 'electro'] },
            { name: 'Bloom', elements: ['hydro', 'dendro'] },
            { name: 'Swirl', elements: ['anemo', 'pyro'] },
            { name: 'Swirl', elements: ['anemo', 'hydro'] },
            { name: 'Swirl', elements: ['anemo', 'electro'] },
            { name: 'Swirl', elements: ['anemo', 'cryo'] },
            { name: 'Superconduct', elements: ['electro', 'cryo'] },
            { name: 'Quicken', elements: ['electro', 'dendro'] },
            { name: 'Crystallize', elements: ['geo', 'pyro'] },
            { name: 'Crystallize', elements: ['geo', 'hydro'] },
            { name: 'Crystallize', elements: ['geo', 'electro'] },
            { name: 'Crystallize', elements: ['geo', 'cryo'] },
        ];
        const gridSize = 9;
        let grid = [];
        let gameOver = false;
        let dangerousReactions = [];
        let initialized = false;

        for (let row = 0; row < gridSize; row++) {
            const gridRow = [];
            for (let col = 0; col < gridSize; col++) {
                const cell = {
                    element: null,
                    htmlElement: null,
                    row,
                    col,
                    revealed: false,
                    isBomb: false,
                    hidden: true,
                };
                gridRow.push(cell);
            }
            grid.push(gridRow);
        }

        return {
            siteId,
            config,
            isComplete: state?.isComplete || false,
            difficulty,
            elements,
            allReactions,
            gridSize,
            grid,
            gameOver,
            dangerousReactions,
            initialized,
        };
    },

    computed: {
        revealedCount() {
            return this.grid.reduce((acc, row) => acc + row.filter((cell) => cell.revealed).length, 0);
        },
        cellContent() {
            return (cell) => {
                return cell.isBomb ? '💣' : cell.element.charAt(0).toUpperCase();
            };
        },
        cellClasses() {
            return (cell) => ({
                init: this.initialized,
                bomb: cell.revealed && cell.isBomb,
                revealed: cell.revealed,
                hidden: this.initialized && cell.hidden,
                [`color-${cell.element}`]: cell.revealed && cell.element,
            });
        },
    },

    mounted() {
        this.grid.forEach((row) => {
            row.forEach((cell) => {
                cell.htmlElement = this.$refs.cellElement[cell.row * this.gridSize + cell.col];
            });
        });
        this.startGame();
    },

    methods: {
        startGame() {
            // Reset game state
            this.gameOver = null;
            this.initialized = false;

            // Select 1 random reaction
            const shuffledReactions = [...this.allReactions].sort(() => Math.random() - 0.5);
            this.dangerousReactions = [shuffledReactions[0]]; // Take one reaction

            this.grid.forEach((row) => {
                row.forEach((cell) => {
                    cell.element = null;
                    cell.revealed = false;
                    cell.isBomb = false;
                    cell.hidden = true;
                });
            });
        },

        initBoard(cell) {
            this.createStartingArea(cell);
            this.refreshVisibleCells();
            this.initialized = true;
        },

        refreshVisibleCells() {
            this.grid.forEach((row) => {
                row.forEach((cell) => {
                    if (cell.revealed) return;
                    const neighbors = this.getNeighbors(cell.row, cell.col, true).filter((neighbor) => neighbor.revealed && !neighbor.isBomb && this.elements.includes(neighbor.element));
                    if (neighbors.length >= 2) {
                        const isBomb = neighbors.map((x) => x.element).includesAll(this.dangerousReactions[0].elements);
                        if (isBomb) {
                            cell.isBomb = true;
                            cell.element = null;
                        } else this.generateElement(cell);
                        cell.hidden = false;
                    }
                });
            });
        },

        generateElement(cell) {
            const dangerousElements = this.dangerousReactions[0].elements;
            const nonDangerousElements = this.elements.filter((element) => !dangerousElements.includes(element));
            const baseChance = dangerousElements.length / this.elements.length; // 1/7 - 14%
            const generateDangerousElement = Math.random() < baseChance * 2; // chance of generating a dangerous element
            if (generateDangerousElement) {
                const randomIndex = Math.floor(Math.random() * dangerousElements.length);
                cell.element = dangerousElements[randomIndex];
            } else {
                const randomIndex = Math.floor(Math.random() * nonDangerousElements.length);
                cell.element = nonDangerousElements[randomIndex];
            }
        },

        handleCellClick(cell) {
            if (this.initialized === false) {
                this.initBoard(cell);
                return;
            }
            if (cell.revealed || this.gameOver) return;

            cell.revealed = true;
            if (cell.isBomb) {
                this.gameOver = 'lose';
            } else if (this.grid.every((row) => row.every((cell) => cell.revealed || cell.isBomb || cell.element === null))) {
                this.gameOver = 'win';
            } else {
                this.refreshVisibleCells();
            }
        },

        createStartingArea(cell, minAreaSize = 9, maxAreaSize = 16) {
            // Keep track of revealed cells and cells to process
            const revealed = new Set();
            const queue = [];

            // Start with the clicked cell
            queue.push([cell.row, cell.col]);

            // Random size for the starting area
            const targetSize = Math.floor(Math.random() * (maxAreaSize - minAreaSize + 1)) + minAreaSize;

            // Process cells until we've revealed enough or run out of candidates
            while (revealed.size < targetSize && queue.length > 0) {
                // Choose a random cell from the queue for more organic growth
                const randomIndex = Math.floor(Math.random() * queue.length);
                const [row, col] = queue[randomIndex];

                // Remove the processed cell from the queue
                queue.splice(randomIndex, 1);

                // If already revealed, skip
                const cellKey = `${row},${col}`;
                if (revealed.has(cellKey)) continue;

                // Mark as revealed
                revealed.add(cellKey);
                const cell = this.grid[row][col];
                cell.revealed = true;
                cell.isBomb = false;
                cell.element = 'empty';
                cell.hidden = false;

                // Add neighboring cells to the queue
                const neighbors = this.getNeighbors(row, col, true);
                for (const neighbor of neighbors) {
                    const neighborKey = `${neighbor.row},${neighbor.col}`;

                    // Only add unprocessed neighbors
                    if (!revealed.has(neighborKey)) {
                        queue.push([neighbor.row, neighbor.col]);
                    }
                }
            }

            // Reveal bordered cells
            this.grid.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    // If the cell is a nighbor of a revealed cell from left, right, top, bottom with dangerous elements => reveal
                    const neighbors = this.getNeighbors(rowIndex, colIndex, false);
                    neighbors.forEach((neighbor) => {
                        const neighborCell = this.grid[neighbor.row][neighbor.col];
                        if (neighborCell.revealed && neighborCell.element === 'empty' && !cell.revealed) {
                            this.generateElement(cell);
                            cell.revealed = true;
                            cell.hidden = false;
                        }
                    });
                });
            });
        },

        getImpactArea(row, col) {
            const impactArea = [];
            for (let r = Math.max(0, row - 1); r <= Math.min(gridSize - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(gridSize - 1, col + 1); c++) {
                    impactArea.push({ row: r, col: c });
                }
            }
            return impactArea;
        },

        getNeighbors(row, col, all = false) {
            const neighbors = [];
            for (let r = Math.max(0, row - 1); r <= Math.min(this.gridSize - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(this.gridSize - 1, col + 1); c++) {
                    // Skip the cell itself
                    if (r === row && c === col) continue;
                    // skip diagonal cells
                    if (!all && r !== row && c !== col) continue;
                    neighbors.push(this.grid[r][c]);
                }
            }
            return neighbors;
        },
    },
});

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_GAMES_MINESWEEPER.mount('#site-minesweeper');
});
