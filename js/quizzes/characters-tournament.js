/**
 * Characters Tournament Quiz Implementation
 * Initializes and configures the tournament quiz
 */

(() => {
    'use strict';

    const TOURNAMENT_TYPES = {
        SingleElimination: 'Single elimination',
        DoubleElimination: 'Double elimination',
        RoundRobin: 'Round robin (all play all)'
    };

    const TOURNAMENT_SIZES = {
        Size8: 8,
        Size16: 16,
        Size32: 32,
        Size64: 64
    };

    let tournamentSetupElement;
    let matchesCurrentElement;
    let matchesMaxElement;
    let tournamentTypeElement;
    let tournamentSizeElement;
    let startTournamentButtonElement;
    let matchElement;
    let resultElement;
    let menuItemElement;
    let backToSetupElement;

    let rounds = 0;
    let currentRound = 0;
    let matches = 0;
    let currentMatch = 1;
    let tournamentSize = TOURNAMENT_SIZES.Size8;
    let tournamentType = TOURNAMENT_TYPES.SingleElimination;

    let competitors = [];
    let roundMatches = [];
    let winners = [];
    let losers = [];
    let history = [];

    function resetValues() {
        currentRound = 0;
        currentMatch = 1;
        competitors = [];
        roundMatches = [];
        winners = [];
        losers = [];
        history = [];
    }

    function calculateTournamentLength() {
        resetValues();
        if (tournamentType === TOURNAMENT_TYPES.SingleElimination) {
            matches = tournamentSize - 1;
            rounds = Math.ceil(Math.log2(tournamentSize));
        }
        else if (tournamentType === TOURNAMENT_TYPES.DoubleElimination) {
            matches = tournamentSize * 2 - 2;
            rounds = Math.ceil(Math.log2(tournamentSize)) + 2;
        }
        else if (tournamentType === TOURNAMENT_TYPES.RoundRobin) {
            matches = tournamentSize * (tournamentSize - 1) / 2;
            rounds = matches;
        }
    }

    function generateRoundMatches(characters) {
        if (characters.length === 1) return;
        for (let i = 0; i < characters.length; i += 2) {
            roundMatches.push([characters[i], characters[i + 1]]);
        }
        currentRound++;
    }

    function incrementCurrentMatch() {
        if (currentMatch < matches) currentMatch++;
        matchesCurrentElement.textContent = currentMatch;
    }

    function renderMatch(matchCharacters, clickCallback) {
        const controller = new AbortController();
        const { signal } = controller;

        matchCharacters.forEach(character => {
            const imageContainer = document.createElement("div");
            const image = document.createElement("img");
            image.src = character.icon;
            image.alt = character.name;
            image.title = character.name;
            image.addEventListener('click', () => {
                const winnerCharacter = character;
                const loserCharacter = matchCharacters.find(c => c.name !== character.name);
                const winnerElement = matchElement.querySelector('img[alt="' + winnerCharacter.name + '"]');
                const loserElement = matchElement.querySelector('img[alt="' + loserCharacter.name + '"]');
                winnerElement.parentNode.classList.add('winner');
                loserElement.parentNode.classList.add('loser');
                setTimeout(() => {
                    matchElement.innerHTML = '';
                    incrementCurrentMatch();
                    clickCallback(winnerCharacter, loserCharacter);
                }, 500);
                controller.abort();
            }, { signal });
            imageContainer.appendChild(image);
            matchElement.appendChild(imageContainer);
        });
    }

    function renderPodiumHtml(winners, winsCount) {
        let html = '<div class="podium">';
        const places = ['second', 'first', 'third'];
        const medals = ['Silver', 'Gold', 'Bronze'];
        winners.forEach((character, index) => {
            const placeClass = places[index];
            const medal = medals[index];
            const placeString = capitalize(placeClass);
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
    }

    function singleEliminationNext() {
        if (currentRound === 0) {
            competitors = getRandomCharacters(tournamentSize);
            generateRoundMatches(competitors);
        }
        if (competitors.length === 0) return;

        if (roundMatches.length > 0) {
            const [player1, player2] = roundMatches.pop();
            renderMatch([player1, player2], (winner, loser) => {
                winners.push(winner);
                losers.push(loser);
                history.push({ round: currentRound, match: currentMatch, player1: player1, player2: player2, winner: winner });
                singleEliminationNext();
            });
        }
        else if (winners.length % 2 === 0) {
            generateRoundMatches(winners);
            winners = [];
            currentRound++;
            singleEliminationNext();
        }
        else {
            const winner = winners.pop();
            const image = document.createElement("img");
            image.name = 'answer-success';
            image.src = winner.wish;
            image.alt = winner.name;
            image.title = winner.name;
            resultElement.appendChild(image);
        }
    }

    function doubleEliminationManager(isUpperBracket = true) {
        if (currentRound === 0) {
            competitors = getRandomCharacters(tournamentSize);
            generateRoundMatches(competitors);
        }
        if (competitors.length === 0) return;

        if (roundMatches.length > 0) {
            const [player1, player2] = roundMatches.pop();
            renderMatch([player1, player2], (winner, loser) => {
                if (isUpperBracket) {
                    winners.push(winner);
                    losers.push(loser);
                }
                else {
                    losers.push(winner);
                }
                history.push({ round: currentRound, match: currentMatch, isUpperBracket: isUpperBracket, player1: player1, player2: player2, winner: winner, loser: loser });
                doubleEliminationManager(isUpperBracket);
            });
        }
        else if (winners.length % 2 === 0 || losers.length % 2 === 0) {
            if (isUpperBracket || losers.length === 2 && winners.length === 2) {
                generateRoundMatches(losers);
                losers = [];
                doubleEliminationManager(false);
            }
            else {
                generateRoundMatches(winners);
                winners = [];
                doubleEliminationManager(true);
            }
            currentRound++;
        }
        else if (!isUpperBracket && winners.length === 1 && losers.length === 1) {
            generateRoundMatches(winners.concat(losers));
            winners = [];
            losers = [];
            doubleEliminationManager(true);
        }
        else {
            const first = history[history.length - 1].winner;
            const second = history[history.length - 1].loser;
            const third = history[history.length - 2].loser;
            resultElement.innerHTML = renderPodiumHtml([second, first, third]);
        }
    }

    function roundRobinManager() {
        if (currentRound === 0) {
            competitors = getRandomCharacters(tournamentSize);
            generateRoundMatches(combinations(competitors, 2).flat());
        }
        if (competitors.length === 0) return;

        if (roundMatches.length > 0) {
            const [player1, player2] = roundMatches.pop();
            renderMatch([player1, player2], (winner, loser) => {
                winners.push(winner);
                losers.push(loser);
                history.push({ round: currentRound, match: currentMatch, player1: player1, player2: player2, winner: winner, loser: loser });
                roundRobinManager();
            });
        }
        else {
            const winsCount = winners.reduce((acc, obj) => {
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
            resultElement.innerHTML = renderPodiumHtml([second.obj, first.obj, third.obj], [second.count, first.count, third.count]);
        }
    }

    function defaultState() {
        tournamentSetupElement.classList.remove('d-none');
        backToSetupElement.classList.add('d-none');
        matchElement.innerHTML = '';
        resultElement.innerHTML = '';
        matchesCurrentElement.textContent = 0;
        resetValues();
    }

    /**
     * Initializes the tournament quiz
     */
    window.initializeTournamentQuiz = function () {
        const config = APP_CONFIG.quizzes.charactersTournament;

        calculateTournamentLength();

        tournamentSetupElement = document.querySelector(`#${config.id} div[name="tournament-setup"]`);
        matchesCurrentElement = document.querySelector(`#${config.id} p[name="matches-current"]`);
        matchElement = document.querySelector(`#${config.id} div[name="match"]`);
        resultElement = document.querySelector(`#${config.id} div[name="result"]`);

        backToSetupElement = document.querySelector(`#${config.id} button.next-button`);
        backToSetupElement.addEventListener('click', () => {
            defaultState();
        });

        menuItemElement = document.querySelector(`nav > ul > li[data-id="${config.id}"]`);
        menuItemElement.addEventListener('click', () => {
            defaultState();
        });

        matchesMaxElement = document.querySelector(`#${config.id} p[name="matches-max"]`);
        matchesMaxElement.textContent = matches;

        tournamentTypeElement = document.querySelector(`#${config.id} select[name="tournament-type"]`);
        Object.values(TOURNAMENT_TYPES).forEach(tournamentType => {
            const opt = document.createElement('option');
            opt.value = tournamentType;
            opt.innerHTML = tournamentType;
            tournamentTypeElement.appendChild(opt);
        });
        tournamentTypeElement.value = tournamentType;
        tournamentTypeElement.addEventListener('change', (event) => {
            tournamentType = event.target.value;
            calculateTournamentLength();
            matchesMaxElement.textContent = matches;
        });

        tournamentSizeElement = document.querySelector(`#${config.id} select[name="character-count"]`);
        Object.values(TOURNAMENT_SIZES).forEach(tournamentSize => {
            const opt = document.createElement('option');
            opt.value = tournamentSize;
            opt.innerHTML = tournamentSize;
            tournamentSizeElement.appendChild(opt);
        })
        tournamentSizeElement.value = tournamentSize;
        tournamentSizeElement.addEventListener('change', (event) => {
            tournamentSize = Number(event.target.value);
            calculateTournamentLength();
            matchesMaxElement.textContent = matches;
        });

        startTournamentButtonElement = document.querySelector(`#${config.id} button[name="start-tournament"]`);
        startTournamentButtonElement.addEventListener('click', () => {
            tournamentSetupElement.classList.contains('d-none') ? tournamentSetupElement.classList.remove('d-none') : tournamentSetupElement.classList.add('d-none');
            backToSetupElement.classList.remove('d-none');
            matchesCurrentElement.textContent = 1;

            if (tournamentType === TOURNAMENT_TYPES.SingleElimination) {
                singleEliminationNext();
            }
            else if (tournamentType === TOURNAMENT_TYPES.DoubleElimination) {
                doubleEliminationManager();
            }
            else if (tournamentType === TOURNAMENT_TYPES.RoundRobin) {
                roundRobinManager();
            }
        });

        console.log('Tournament quiz initialized');
    }
})();