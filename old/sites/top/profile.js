const SITES_TOP_PROFILE_COMPONENT = {
    VUE_COMPONENT: Vue.createApp({
        template: html`
            <div class="py-4" id="profile-stats">
                <!-- Profile Header -->
                <div class="profile-header text-center">
                    <h1><i class="bi bi-person-circle"></i> Player Profile</h1>
                    <p class="lead">Your Genshin Impact Gaming Statistics</p>
                </div>

                <!-- Overall Stats Summary -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">
                        <div class="card stat-card h-100">
                            <div class="card-body text-center">
                                <i class="bi bi-trophy-fill display-4 mb-2"></i>
                                <h5>Total Games</h5>
                                <h3>{{ totalGamesPlayed }}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card stat-card h-100">
                            <div class="card-body text-center">
                                <i class="bi bi-check-circle-fill display-4 mb-2"></i>
                                <h5>Overall Win Rate</h5>
                                <h3>{{ overallWinRate }}%</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card stat-card h-100">
                            <div class="card-body text-center">
                                <i class="bi bi-star-fill display-4 mb-2"></i>
                                <h5>Best Character</h5>
                                <h3>{{ bestCharacter }}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card stat-card h-100">
                            <div class="card-body text-center">
                                <i class="bi bi-gem display-4 mb-2"></i>
                                <h5>Minesweeper Best</h5>
                                <h3>{{ bestMinesweeperScore }}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabs Navigation -->
                <ul class="nav nav-tabs mb-4" id="statsTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="quizzes-tab" data-bs-toggle="tab" data-bs-target="#quizzes" type="button" role="tab">
                            <i class="bi bi-question-circle"></i> Quizzes & Games
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="tournament-tab" data-bs-toggle="tab" data-bs-target="#tournament" type="button" role="tab"><i class="bi bi-trophy"></i> Tournament</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="minesweeper-tab" data-bs-toggle="tab" data-bs-target="#minesweeper" type="button" role="tab">
                            <i class="bi bi-grid-3x3-gap"></i> Minesweeper
                        </button>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content" id="statsTabContent">
                    <!-- Quizzes & Games Tab -->
                    <div class="tab-pane fade show active" id="quizzes" role="tabpanel">
                        <h3 class="section-title"><i class="bi bi-award"></i> Top 10 Characters</h3>
                        <div class="row">
                            <div v-for="(character, index) in top10Characters" :key="character.name" class="col-lg-6 mb-4">
                                <div class="card character-card position-relative">
                                    <div class="rank-badge">{{ index + 1 }}</div>
                                    <div class="card-header d-flex align-items-center">
                                        <div class="character-avatar me-3">{{ character.name.substring(0, 2).toUpperCase() }}</div>
                                        <div>
                                            <h5 class="mb-0">{{ character.name }}</h5>
                                            <small>Win Rate: {{ character.overallWinRate }}% | {{ character.totalGames }} games</small>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div v-for="(gameData, gameType) in character.games" :key="gameType" class="col-6 mb-2">
                                                <div class="game-stat">
                                                    <strong>{{ formatGameType(gameType) }}</strong>
                                                    <div class="small">
                                                        <span class="badge bg-success difficulty-badge">E: {{ gameData.easy.wins }}/{{ gameData.easy.total }}</span>
                                                        <span class="badge bg-warning difficulty-badge">M: {{ gameData.medium.wins }}/{{ gameData.medium.total }}</span>
                                                        <span class="badge bg-danger difficulty-badge">H: {{ gameData.hard.wins }}/{{ gameData.hard.total }}</span>
                                                    </div>
                                                    <div class="win-rate-bar mt-1">
                                                        <div class="win-rate-fill" :style="{width: gameData.winRate + '%'}"></div>
                                                    </div>
                                                    <div class="small">{{ gameData.winRate }}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h4 class="mt-4 mb-3"><i class="bi bi-people"></i> Other Characters</h4>
                        <div class="row">
                            <div v-for="character in otherCharacters" :key="character.name" class="col-md-6 col-lg-4 mb-3">
                                <div class="card character-mini-card h-100" @click="showCharacterDetails(character)">
                                    <div class="card-body d-flex align-items-center">
                                        <div class="character-avatar me-3">{{ character.name.substring(0, 2).toUpperCase() }}</div>
                                        <div>
                                            <h6 class="mb-1">{{ character.name }}</h6>
                                            <small>{{ character.overallWinRate }}% WR | {{ character.totalGames }} games</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tournament Tab -->
                    <div class="tab-pane fade" id="tournament" role="tabpanel">
                        <h3 class="section-title"><i class="bi bi-trophy"></i> Tournament Rankings</h3>

                        <!-- Tournament Overall Stats -->
                        <div class="row mb-4">
                            <div class="col-md-4 mb-3">
                                <div class="card tournament-card">
                                    <div class="card-body text-center">
                                        <i class="bi bi-calendar-event display-4 mb-2"></i>
                                        <h5>Tournaments Played</h5>
                                        <h3>{{ tournamentStats.totalTournaments }}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="card tournament-card">
                                    <div class="card-body text-center">
                                        <i class="bi bi-percent display-4 mb-2"></i>
                                        <h5>Match Win Rate</h5>
                                        <h3>{{ tournamentStats.overallWinRate }}%</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="card tournament-card">
                                    <div class="card-body text-center">
                                        <i class="bi bi-star display-4 mb-2"></i>
                                        <h5>Average Position</h5>
                                        <h3>{{ tournamentStats.averagePosition }}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Top 10 Tournament Characters -->
                        <h4><i class="bi bi-award-fill"></i> Top 10 Tournament Performers</h4>
                        <div class="text-center mb-4">
                            <div v-for="(character, index) in top10TournamentCharacters" :key="character.name" class="d-inline-block position-relative m-2">
                                <div
                                    :class="['character-avatar', index < 3 ? 'tournament-rank-large character-avatar-large' : 'tournament-rank-small']"
                                    :style="getCharacterAvatarStyle(character.name)"
                                >
                                    {{ character.name.substring(0, 2).toUpperCase() }}
                                </div>
                                <div class="rank-badge" :style="getRankBadgeStyle(index)">{{ index + 1 }}</div>
                                <div class="small mt-2">
                                    <strong>{{ character.name }}</strong><br />
                                    {{ character.tournament.winRate }}% WR<br />
                                    Avg: {{ character.tournament.avgPlace }}
                                </div>
                            </div>
                        </div>

                        <!-- Other Tournament Characters -->
                        <h5><i class="bi bi-people"></i> Other Tournament Characters</h5>
                        <div class="row">
                            <div v-for="character in otherTournamentCharacters" :key="character.name" class="col-md-4 col-lg-3 mb-3">
                                <div class="card character-mini-card">
                                    <div class="card-body text-center">
                                        <div class="character-avatar mx-auto mb-2">{{ character.name.substring(0, 2).toUpperCase() }}</div>
                                        <h6>{{ character.name }}</h6>
                                        <small>
                                            Rank: {{ character.tournamentRank }}<br />
                                            {{ character.tournament.winRate }}% WR | Avg: {{ character.tournament.avgPlace }}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Minesweeper Tab -->
                    <div class="tab-pane fade" id="minesweeper" role="tabpanel">
                        <h3 class="section-title"><i class="bi bi-grid-3x3-gap-fill"></i> Minesweeper Statistics</h3>

                        <div class="row">
                            <div class="col-lg-4 mb-3">
                                <div class="card minesweeper-card">
                                    <div class="card-body text-center">
                                        <i class="bi bi-trophy display-4 mb-2"></i>
                                        <h5>Best Score</h5>
                                        <h3>{{ bestMinesweeperScore }}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4 mb-3">
                                <div class="card minesweeper-card">
                                    <div class="card-body text-center">
                                        <i class="bi bi-calendar-check display-4 mb-2"></i>
                                        <h5>Games Played</h5>
                                        <h3>{{ minesweeperStats.totalGames }}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4 mb-3">
                                <div class="card minesweeper-card">
                                    <div class="card-body text-center">
                                        <i class="bi bi-percent display-4 mb-2"></i>
                                        <h5>Win Rate</h5>
                                        <h3>{{ minesweeperStats.winRate }}%</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Minesweeper Detailed Stats -->
                        <div class="card minesweeper-card mb-4">
                            <div class="card-header">
                                <h5><i class="bi bi-bar-chart"></i> Minesweeper Breakdown</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-4">
                                        <h6>By Difficulty</h6>
                                        <div v-for="(data, difficulty) in minesweeperStats.byDifficulty" :key="difficulty">
                                            <div class="d-flex justify-content-between">
                                                <span>{{ formatDifficulty(difficulty) }}:</span>
                                                <span>{{ data.wins }}/{{ data.total }} ({{ data.winRate }}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <h6>Favorite Elements</h6>
                                        <div>
                                            <div v-for="element in minesweeperStats.favoriteElements" :key="element.element">
                                                <span :class="'element-badge ' + element.element">{{ element.element.charAt(0).toUpperCase() }}</span>
                                                <span class="ms-2">{{ element.count }} times</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <h6>Recent Activity</h6>
                                        <div class="small">
                                            <div v-for="game in minesweeperStats.recentGames" :key="game.date">{{ game.date }}: {{ game.result }} ({{ game.score }} pts)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Character Details Modal -->
                <div class="modal fade" id="characterModal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title"><i class="bi bi-person-badge"></i> {{ selectedCharacter?.name }} - Detailed Stats</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body" v-if="selectedCharacter">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <div class="card bg-info text-white">
                                            <div class="card-body text-center">
                                                <h6>Overall Win Rate</h6>
                                                <h4>{{ selectedCharacter.overallWinRate }}%</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card bg-success text-white">
                                            <div class="card-body text-center">
                                                <h6>Total Games</h6>
                                                <h4>{{ selectedCharacter.totalGames }}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div v-for="(gameData, gameType) in selectedCharacter?.games" :key="gameType" class="col-md-6 mb-3">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6>{{ formatGameType(gameType) }}</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-2">
                                                    <small class="text-muted">Easy:</small> {{ gameData.easy.wins }}/{{ gameData.easy.total }}
                                                    <div class="progress progress-sm">
                                                        <div class="progress-bar bg-success" :style="{width: (gameData.easy.total > 0 ? (gameData.easy.wins/gameData.easy.total)*100 : 0) + '%'}"></div>
                                                    </div>
                                                </div>
                                                <div class="mb-2">
                                                    <small class="text-muted">Medium:</small> {{ gameData.medium.wins }}/{{ gameData.medium.total }}
                                                    <div class="progress progress-sm">
                                                        <div
                                                            class="progress-bar bg-warning"
                                                            :style="{width: (gameData.medium.total > 0 ? (gameData.medium.wins/gameData.medium.total)*100 : 0) + '%'}"
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div class="mb-2">
                                                    <small class="text-muted">Hard:</small> {{ gameData.hard.wins }}/{{ gameData.hard.total }}
                                                    <div class="progress progress-sm">
                                                        <div class="progress-bar bg-danger" :style="{width: (gameData.hard.total > 0 ? (gameData.hard.wins/gameData.hard.total)*100 : 0) + '%'}"></div>
                                                    </div>
                                                </div>
                                                <div class="text-center mt-2">
                                                    <strong>Overall: {{ gameData.winRate }}%</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="selectedCharacter?.tournament.totalMatches > 0" class="card mt-3">
                                    <div class="card-header">
                                        <h6><i class="bi bi-trophy"></i> Tournament Performance</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-6"><strong>Match Record:</strong> {{ selectedCharacter.tournament.wins }}-{{ selectedCharacter.tournament.losses }}</div>
                                            <div class="col-6"><strong>Win Rate:</strong> {{ selectedCharacter.tournament.winRate }}%</div>
                                            <div class="col-6"><strong>Average Place:</strong> {{ selectedCharacter.tournament.avgPlace }}</div>
                                            <div class="col-6"><strong>Tournaments:</strong> {{ selectedCharacter.tournament.places.length }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,

        data() {
            // Mock data structure for demonstration
            const mockStats = {
                characters: [
                    {
                        name: 'Zhongli',
                        banners: { 1: [2, 8], 2: [5, 5], 3: [7, 3], c: 10 },
                        pixelate: { 1: [1, 9], 2: [3, 7], 3: [4, 6], c: 10 },
                        mismatch: { 1: [0, 10], 2: [2, 8], 3: [5, 5], c: 10 },
                        music: { 1: [1, 9], 2: [2, 8], 3: [3, 7], c: 10 },
                        dish: { 1: [0, 10], 2: [1, 9], 3: [2, 8], c: 10 },
                        voice: { 1: [2, 8], 2: [3, 7], 3: [4, 6], c: 10 },
                        tournament: { wl: [5, 15], places: [1, 3, 2, 4, 1, 2] },
                    },
                    {
                        name: 'Raiden',
                        banners: { 1: [1, 9], 2: [2, 8], 3: [3, 7], c: 10 },
                        pixelate: { 1: [0, 10], 2: [1, 9], 3: [2, 8], c: 10 },
                        mismatch: { 1: [1, 9], 2: [2, 8], 3: [4, 6], c: 10 },
                        music: { 1: [0, 10], 2: [1, 9], 3: [2, 8], c: 10 },
                        dish: { 1: [1, 9], 2: [2, 8], 3: [3, 7], c: 10 },
                        voice: { 1: [0, 10], 2: [1, 9], 3: [2, 8], c: 10 },
                        tournament: { wl: [8, 12], places: [2, 4, 3, 1, 2, 3] },
                    },
                    {
                        name: 'Venti',
                        banners: { 1: [3, 7], 2: [4, 6], 3: [6, 4], c: 10 },
                        pixelate: { 1: [2, 8], 2: [3, 7], 3: [5, 5], c: 10 },
                        mismatch: { 1: [1, 9], 2: [3, 7], 3: [4, 6], c: 10 },
                        music: { 1: [2, 8], 2: [3, 7], 3: [4, 6], c: 10 },
                        dish: { 1: [1, 9], 2: [2, 8], 3: [3, 7], c: 10 },
                        voice: { 1: [3, 7], 2: [4, 6], 3: [5, 5], c: 10 },
                        tournament: { wl: [10, 10], places: [3, 2, 4, 3, 2, 1] },
                    },
                    // Add more characters for testing...
                    {
                        name: 'Diluc',
                        banners: { 1: [4, 6], 2: [5, 5], 3: [6, 4], c: 10 },
                        pixelate: { 1: [3, 7], 2: [4, 6], 3: [5, 5], c: 10 },
                        mismatch: { 1: [2, 8], 2: [3, 7], 3: [4, 6], c: 10 },
                        music: { 1: [1, 9], 2: [2, 8], 3: [3, 7], c: 10 },
                        dish: { 1: [2, 8], 2: [3, 7], 3: [4, 6], c: 10 },
                        voice: { 1: [1, 9], 2: [2, 8], 3: [3, 7], c: 10 },
                        tournament: { wl: [15, 5], places: [4, 3, 4, 5, 3, 2] },
                    },
                ],
                minesweeper: [
                    ['+2024-01-15', ['e', 'c', 'a'], 1, 150],
                    ['-2024-01-16', ['h', 'p', 'd'], 2, 0],
                    ['+2024-01-17', ['g', 'e', 'c'], 3, 300],
                    ['+2024-01-18', ['a', 'h', 'p'], 1, 120],
                    ['-2024-01-19', ['d', 'g', 'e'], 2, 0],
                ],
            };
            return {
                stats: mockStats,
                selectedCharacter: null,
            };
        },

        computed: {
            characterStats() {
                return this.stats.characters
                    .map((char) => {
                        const games = {};
                        const gameTypes = ['banners', 'pixelate', 'mismatch', 'music', 'dish', 'voice'];

                        gameTypes.forEach((gameType) => {
                            const data = char[gameType];
                            const easy = { wins: data[1][1], losses: data[1][0], total: data[1][0] + data[1][1] };
                            const medium = { wins: data[2][1], losses: data[2][0], total: data[2][0] + data[2][1] };
                            const hard = { wins: data[3][1], losses: data[3][0], total: data[3][0] + data[3][1] };

                            const totalWins = easy.wins + medium.wins + hard.wins;
                            const totalGames = easy.total + medium.total + hard.total;

                            games[gameType] = {
                                easy,
                                medium,
                                hard,
                                winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
                            };
                        });

                        const tournament = {
                            wins: char.tournament.wl[1],
                            losses: char.tournament.wl[0],
                            totalMatches: char.tournament.wl[0] + char.tournament.wl[1],
                            places: char.tournament.places,
                            avgPlace: char.tournament.places.length > 0 ? Math.round((char.tournament.places.reduce((a, b) => a + b, 0) / char.tournament.places.length) * 10) / 10 : 0,
                            winRate: char.tournament.wl[0] + char.tournament.wl[1] > 0 ? Math.round((char.tournament.wl[1] / (char.tournament.wl[0] + char.tournament.wl[1])) * 100) : 0,
                        };

                        const quizGames = Object.values(games).reduce((sum, game) => sum + game.easy.total + game.medium.total + game.hard.total, 0);
                        const quizWins = Object.values(games).reduce((sum, game) => sum + game.easy.wins + game.medium.wins + game.hard.wins, 0);
                        const overallWinRate = quizGames > 0 ? Math.round((quizWins / quizGames) * 100) : 0;

                        return {
                            name: char.name,
                            games,
                            tournament,
                            totalGames: quizGames,
                            overallWinRate,
                        };
                    })
                    .sort((a, b) => b.overallWinRate - a.overallWinRate);
            },

            top10Characters() {
                return this.characterStats.slice(0, 10);
            },

            otherCharacters() {
                return this.characterStats.slice(10);
            },

            tournamentCharacterStats() {
                return this.characterStats
                    .filter((char) => char.tournament.totalMatches > 0)
                    .map((char, index) => ({
                        ...char,
                        tournamentRank: index + 1,
                    }))
                    .sort((a, b) => {
                        // Sort by win rate first, then by average place (lower is better)
                        if (b.tournament.winRate !== a.tournament.winRate) {
                            return b.tournament.winRate - a.tournament.winRate;
                        }
                        return a.tournament.avgPlace - b.tournament.avgPlace;
                    });
            },

            top10TournamentCharacters() {
                return this.tournamentCharacterStats.slice(0, 10);
            },

            otherTournamentCharacters() {
                return this.tournamentCharacterStats.slice(10);
            },

            tournamentStats() {
                const allTournaments = this.characterStats.filter((char) => char.tournament.totalMatches > 0);
                const totalMatches = allTournaments.reduce((sum, char) => sum + char.tournament.totalMatches, 0);
                const totalWins = allTournaments.reduce((sum, char) => sum + char.tournament.wins, 0);
                const allPlaces = allTournaments.flatMap((char) => char.tournament.places);

                return {
                    totalTournaments: allPlaces.length,
                    overallWinRate: totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0,
                    averagePosition: allPlaces.length > 0 ? Math.round((allPlaces.reduce((a, b) => a + b, 0) / allPlaces.length) * 10) / 10 : 0,
                };
            },

            minesweeperStats() {
                const games = this.stats.minesweeper;
                const wins = games.filter((game) => game[0].startsWith('+')).length;
                const totalGames = games.length;
                const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

                const byDifficulty = { 1: { wins: 0, total: 0 }, 2: { wins: 0, total: 0 }, 3: { wins: 0, total: 0 } };
                const elementCount = {};

                games.forEach((game) => {
                    const difficulty = game[2];
                    const isWin = game[0].startsWith('+');

                    byDifficulty[difficulty].total++;
                    if (isWin) byDifficulty[difficulty].wins++;

                    game[1].forEach((element) => {
                        elementCount[element] = (elementCount[element] || 0) + 1;
                    });
                });

                Object.keys(byDifficulty).forEach((diff) => {
                    const data = byDifficulty[diff];
                    data.winRate = data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0;
                });

                const favoriteElements = Object.entries(elementCount)
                    .map(([element, count]) => ({ element: this.getElementName(element), count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                const recentGames = games
                    .slice(-5)
                    .map((game) => ({
                        date: game[0].substring(1),
                        result: game[0].startsWith('+') ? 'Win' : 'Loss',
                        score: game[3],
                    }))
                    .reverse();

                return {
                    totalGames,
                    wins,
                    winRate,
                    byDifficulty,
                    favoriteElements,
                    recentGames,
                };
            },

            totalGamesPlayed() {
                const characterGames = this.characterStats.reduce((sum, char) => sum + char.totalGames, 0);
                return characterGames + this.minesweeperStats.totalGames;
            },

            overallWinRate() {
                let totalWins = 0;
                let totalGames = 0;

                this.characterStats.forEach((char) => {
                    Object.values(char.games).forEach((game) => {
                        totalWins += game.easy.wins + game.medium.wins + game.hard.wins;
                        totalGames += game.easy.total + game.medium.total + game.hard.total;
                    });
                });

                totalWins += this.minesweeperStats.wins;
                totalGames += this.minesweeperStats.totalGames;

                return totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
            },

            bestCharacter() {
                if (this.characterStats.length === 0) return 'None';
                return this.characterStats[0].name;
            },

            bestMinesweeperScore() {
                const scores = this.stats.minesweeper.map((game) => game[3]);
                return scores.length > 0 ? Math.max(...scores) : 0;
            },
        },

        methods: {
            formatGameType(gameType) {
                const names = {
                    banners: 'Banners',
                    pixelate: 'Pixelate',
                    mismatch: 'Mismatch',
                    music: 'Music',
                    dish: 'Dish',
                    voice: 'Voice',
                };
                return names[gameType] || gameType;
            },

            formatDifficulty(diff) {
                const names = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
                return names[diff] || diff;
            },

            getElementName(element) {
                const names = {
                    e: 'electro',
                    c: 'cryo',
                    a: 'anemo',
                    h: 'hydro',
                    p: 'pyro',
                    d: 'dendro',
                    g: 'geo',
                };
                return names[element] || element;
            },

            getCharacterAvatarStyle(characterName) {
                // Generate consistent colors based on character name
                const colors = [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    'linear-gradient(135deg, #ff8a80 0%, #ea6100 100%)',
                ];
                const index = characterName.length % colors.length;
                return { background: colors[index] };
            },

            getRankBadgeStyle(index) {
                if (index === 0) return { background: '#FFD700', color: '#333' }; // Gold
                if (index === 1) return { background: '#C0C0C0', color: '#333' }; // Silver
                if (index === 2) return { background: '#CD7F32', color: '#fff' }; // Bronze
                return { background: '#667eea', color: '#fff' }; // Default
            },

            showCharacterDetails(character) {
                this.selectedCharacter = character;
                const modal = new bootstrap.Modal(document.getElementById('characterModal'));
                modal.show();
            },

            loadStatsFromStorage() {
                // In your real implementation, load from localStorage
                const stored = localStorage.getItem('genshinStats');
                if (stored) {
                    this.stats = JSON.parse(stored);
                }
            },
        },

        mounted() {
            this.loadStatsFromStorage();
        },
    }),

    onShow() {
        document.querySelector(`#${MENU_ITEMS_TOP.profile.id}`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${MENU_ITEMS_TOP.profile.id}`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_PROFILE_COMPONENT.VUE_COMPONENT.mount(`#${MENU_ITEMS_TOP.profile.id}`);
});
