const SITES_TOP_GAMES_TOURNAMENT_COMPONENT = {
    VUE_COMPONENT: Vue.createApp({
        template: html`
            <div class="container quiz-container">
                <div name="tournament-setup" class="col-4 mx-auto pt-3" v-show="showSetup">
                    <div class="">
                        <label class="form-label">Tournament type</label>
                        <select name="tournament-type" class="form-select" v-model="tournamentType">
                            <option v-for="type in TOURNAMENT_TYPES" :value="type" :key="type">{{ type }}</option>
                        </select>
                        <div class="form-text">Select tournament type.</div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Characters</label>
                        <select name="character-count" class="form-select" v-model="tournamentSize">
                            <option v-for="size in Object.values(TOURNAMENT_SIZES)" :value="size" :key="size">{{ size }}</option>
                        </select>
                        <div class="form-text">Select character count.</div>
                    </div>
                    <div class="text-center">
                        <button name="start-tournament" class="btn btn-primary" @click="startTournament">Start Tournament</button>
                    </div>
                </div>
                <div name="match" class="mx-auto character-grid pt-2">
                    <div v-for="(character, index) in currentMatchCharacters" :key="index" :class="{'winner': character.isWinner, 'loser': character.isLoser}">
                        <img :src="character.icon" :alt="character.name" :title="character.name" @click="selectWinner(character)" />
                    </div>
                </div>
                <div class="d-flex justify-content-center tries-score my-2">
                    Matches:
                    <p name="matches-current">{{ currentMatch }}</p>
                    /
                    <p name="matches-max">{{ matches }}</p>
                </div>
                <div name="result" class="d-block mx-auto" v-html="resultHtml">
                    <!-- Tournament result will be dynamically injected here -->
                </div>
                <button class="btn btn-primary next-button" v-show="!showSetup" @click="resetTournament">Back to setup</button>
            </div>
        `,

        data() {
            return {
                TOURNAMENT_TYPES: {
                    SingleElimination: 'Single elimination',
                    DoubleElimination: 'Double elimination',
                    RoundRobin: 'Round robin (all play all)',
                },
                TOURNAMENT_SIZES: {
                    Size8: 8,
                    Size16: 16,
                    Size32: 32,
                    Size64: 64,
                },
                tournamentType: 'Single elimination',
                tournamentSize: 8,
                showSetup: true,
                rounds: 0,
                currentRound: 0,
                matches: 0,
                currentMatch: 0,
                competitors: [],
                roundMatches: [],
                winners: [],
                losers: [],
                history: [],
                currentMatchCharacters: [],
                resultHtml: '',
                tournamentInProgress: false,
            };
        },

        computed: {},

        mounted() {
            this.calculateTournamentLength();
        },

        watch: {
            tournamentType() {
                this.calculateTournamentLength();
            },
            tournamentSize() {
                this.calculateTournamentLength();
            },
        },

        methods: {
            resetValues() {
                this.currentRound = 0;
                this.currentMatch = 0;
                this.competitors = [];
                this.roundMatches = [];
                this.winners = [];
                this.losers = [];
                this.history = [];
                this.currentMatchCharacters = [];
                this.resultHtml = '';
                this.tournamentInProgress = false;
            },

            calculateTournamentLength() {
                this.resetValues();
                if (this.tournamentType === this.TOURNAMENT_TYPES.SingleElimination) {
                    this.matches = this.tournamentSize - 1;
                    this.rounds = Math.ceil(Math.log2(this.tournamentSize));
                } else if (this.tournamentType === this.TOURNAMENT_TYPES.DoubleElimination) {
                    this.matches = this.tournamentSize * 2 - 2;
                    this.rounds = Math.ceil(Math.log2(this.tournamentSize)) + 2;
                } else if (this.tournamentType === this.TOURNAMENT_TYPES.RoundRobin) {
                    this.matches = (this.tournamentSize * (this.tournamentSize - 1)) / 2;
                    this.rounds = this.matches;
                }
            },

            generateRoundMatches(characters) {
                if (characters.length === 1) return;
                for (let i = 0; i < characters.length; i += 2) {
                    this.roundMatches.push([characters[i], characters[i + 1]]);
                }
                this.currentRound++;
            },

            incrementCurrentMatch() {
                if (this.currentMatch < this.matches) this.currentMatch++;
            },

            startTournament() {
                this.showSetup = false;
                this.currentMatch = 1;
                this.tournamentInProgress = true;

                if (this.tournamentType === this.TOURNAMENT_TYPES.SingleElimination) {
                    this.singleEliminationNext();
                } else if (this.tournamentType === this.TOURNAMENT_TYPES.DoubleElimination) {
                    this.doubleEliminationManager();
                } else if (this.tournamentType === this.TOURNAMENT_TYPES.RoundRobin) {
                    this.roundRobinManager();
                }
            },

            selectWinner(winner) {
                if (!this.tournamentInProgress) return;

                const loser = this.currentMatchCharacters.find((c) => c.name !== winner.name);

                // Mark winner and loser for visual indication
                this.currentMatchCharacters.forEach((char) => {
                    if (char.name === winner.name) {
                        char.isWinner = true;
                    } else {
                        char.isLoser = true;
                    }
                });

                // Process after a short delay for animation
                setTimeout(() => {
                    this.processMatchResult(winner, loser);
                }, 500);
            },

            processMatchResult(winner, loser) {
                this.incrementCurrentMatch();

                if (this.tournamentType === this.TOURNAMENT_TYPES.SingleElimination) {
                    this.winners.push(winner);
                    this.losers.push(loser);
                    this.history.push({
                        round: this.currentRound,
                        match: this.currentMatch,
                        player1: this.currentMatchCharacters[0],
                        player2: this.currentMatchCharacters[1],
                        winner: winner,
                    });
                    this.currentMatchCharacters = [];
                    this.singleEliminationNext();
                } else if (this.tournamentType === this.TOURNAMENT_TYPES.DoubleElimination) {
                    if (this.currentIsUpperBracket) {
                        this.winners.push(winner);
                        this.losers.push(loser);
                    } else {
                        this.losers.push(winner);
                    }

                    this.history.push({
                        round: this.currentRound,
                        match: this.currentMatch,
                        isUpperBracket: this.currentIsUpperBracket,
                        player1: this.currentMatchCharacters[0],
                        player2: this.currentMatchCharacters[1],
                        winner: winner,
                        loser: loser,
                    });

                    this.currentMatchCharacters = [];
                    this.doubleEliminationManager(this.currentIsUpperBracket);
                } else if (this.tournamentType === this.TOURNAMENT_TYPES.RoundRobin) {
                    this.winners.push(winner);
                    this.losers.push(loser);
                    this.history.push({
                        round: this.currentRound,
                        match: this.currentMatch,
                        player1: this.currentMatchCharacters[0],
                        player2: this.currentMatchCharacters[1],
                        winner: winner,
                        loser: loser,
                    });

                    this.currentMatchCharacters = [];
                    this.roundRobinManager();
                }
            },

            singleEliminationNext() {
                if (this.currentRound === 0) {
                    this.competitors = getRandomCharacters(this.tournamentSize);
                    this.generateRoundMatches(this.competitors);
                }

                if (this.competitors.length === 0) return;

                if (this.roundMatches.length > 0) {
                    const [player1, player2] = this.roundMatches.pop();
                    this.currentMatchCharacters = [
                        { ...player1, isWinner: false, isLoser: false },
                        { ...player2, isWinner: false, isLoser: false },
                    ];
                } else if (this.winners.length % 2 === 0 && this.winners.length > 1) {
                    this.generateRoundMatches(this.winners);
                    this.winners = [];
                    this.singleEliminationNext();
                } else if (this.winners.length === 1) {
                    const winner = this.winners[0];
                    this.resultHtml = `<img name="answer-success" src="${winner.wish}" alt="${winner.name}" title="${winner.name}">`;
                    this.tournamentInProgress = false;
                }
            },

            doubleEliminationManager(isUpperBracket = true) {
                this.currentIsUpperBracket = isUpperBracket;

                if (this.currentRound === 0) {
                    this.competitors = getRandomCharacters(this.tournamentSize);
                    this.generateRoundMatches(this.competitors);
                }

                if (this.competitors.length === 0) return;

                if (this.roundMatches.length > 0) {
                    const [player1, player2] = this.roundMatches.pop();
                    this.currentMatchCharacters = [
                        { ...player1, isWinner: false, isLoser: false },
                        { ...player2, isWinner: false, isLoser: false },
                    ];
                } else if (this.winners.length % 2 === 0 || this.losers.length % 2 === 0) {
                    if (isUpperBracket || (this.losers.length === 2 && this.winners.length === 2)) {
                        this.generateRoundMatches(this.losers);
                        this.losers = [];
                        this.doubleEliminationManager(false);
                    } else {
                        this.generateRoundMatches(this.winners);
                        this.winners = [];
                        this.doubleEliminationManager(true);
                    }
                    this.currentRound++;
                } else if (!isUpperBracket && this.winners.length === 1 && this.losers.length === 1) {
                    this.generateRoundMatches(this.winners.concat(this.losers));
                    this.winners = [];
                    this.losers = [];
                    this.doubleEliminationManager(true);
                } else {
                    const first = this.history[this.history.length - 1].winner;
                    const second = this.history[this.history.length - 1].loser;
                    const third = this.history[this.history.length - 2].loser;
                    this.resultHtml = this.renderPodiumHtml([second, first, third]);
                    this.tournamentInProgress = false;
                }
            },

            roundRobinManager() {
                if (this.currentRound === 0) {
                    this.competitors = getRandomCharacters(this.tournamentSize);
                    this.generateRoundMatches(this.combinations(this.competitors, 2).flat());
                    this.roundMatches = this.shuffleArray(this.roundMatches);
                }

                if (this.competitors.length === 0) return;

                if (this.roundMatches.length > 0) {
                    const [player1, player2] = this.roundMatches.pop();
                    this.currentMatchCharacters = [
                        { ...player1, isWinner: false, isLoser: false },
                        { ...player2, isWinner: false, isLoser: false },
                    ];
                } else {
                    const winsCount = this.winners.reduce((acc, obj) => {
                        const key = obj.name;
                        if (acc[key]) {
                            acc[key].count++;
                        } else {
                            acc[key] = { obj, count: 1 };
                        }
                        return acc;
                    }, {});

                    const resultTable = Object.values(winsCount).sort((a, b) => b.count - a.count);
                    const first = resultTable[0];
                    const second = resultTable[1];
                    const third = resultTable[2];
                    this.resultHtml = this.renderPodiumHtml([second.obj, first.obj, third.obj], [second.count, first.count, third.count]);
                    this.tournamentInProgress = false;
                }
            },

            renderPodiumHtml(winners, winsCount) {
                let html = '<div class="podium">';
                const places = ['second', 'first', 'third'];
                const medals = ['Silver', 'Gold', 'Bronze'];
                winners.forEach((character, index) => {
                    const placeClass = places[index];
                    const medal = medals[index];
                    const placeString = this.capitalize(placeClass);
                    html += `
                 <div class="podium-place ${placeClass}-place">
                     <div style="position: relative;">
                         <img src="${character.wish}" alt="${placeString} Place" class="podium-image">
                         <div class="medal">${index + 1}</div>
                     </div>
                     <div class="podium-block">${placeString} Place${winsCount ? ' (' + winsCount[index] + ' wins)' : ''}</div>
                     <div class="place-label">${medal}</div>
                 </div>`;
                });
                html += '</div>';
                return html;
            },

            resetTournament() {
                this.showSetup = true;
                this.resetValues();
            },

            combinations(arr, k) {
                const result = [];

                function backtrack(start, current) {
                    if (current.length === k) {
                        result.push([...current]);
                        return;
                    }

                    for (let i = start; i < arr.length; i++) {
                        current.push(arr[i]);
                        backtrack(i + 1, current);
                        current.pop();
                    }
                }

                backtrack(0, []);
                return result;
            },

            shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            },

            capitalize(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            },
        },
    }),

    onShow() {
        document.querySelector(`#${GAMES.tournament.id}`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${GAMES.tournament.id}`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SITES_TOP_GAMES_TOURNAMENT_COMPONENT.VUE_COMPONENT.mount(`#${GAMES.tournament.id}`);
});
