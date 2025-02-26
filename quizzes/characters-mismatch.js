document.addEventListener('DOMContentLoaded', () => {
    const triesDisplayMethod = QuizManager.TriesDisplayMethodEnum.None;
    const quizManager = new QuizManager('quiz-characters-mismatch');
    quizManager.questionCallback = () => {
        quizManager.questionElement.innerHTML = "";
        const quizSet = getRandomQuizSet(4);
        quizSet.options.forEach(character => {
            const image = document.createElement("img");
            image.src = character.icon;
            image.addEventListener('click', () => {
                quizManager.triesDisplay(character);
            });
            quizManager.questionElement.appendChild(image);
        })
        console.log("Quiz Options:", quizSet.options);
        console.log("Odd One Out (Answer):", quizSet.answer);
        console.log("Quiz based on property:", quizSet.quizProperty, "with common value:", quizSet.commonValue);
        return quizSet.answer;
    };
    quizManager.init({ triesMax: 1, triesDisplayMethod });
});

// Helper: Generate all combinations of elements taken `count` at a time.
function getCombinations(array, count) {
    const results = [];
    function combine(start, combo) {
        if (combo.length === count) {
            results.push(combo.slice());
            return;
        }
        for (let i = start; i < array.length; i++) {
            combo.push(array[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }
    combine(0, []);
    return results;
}

// Helper: Build a frequency map for a given property in an array of objects.
function frequency(arr, prop) {
    const freq = {};
    for (const obj of arr) {
        freq[obj[prop]] = (freq[obj[prop]] || 0) + 1;
    }
    return freq;
}

// Non-deterministic quiz set builder for count = 4.
function getRandomQuizSet(count = 4) {
    const properties = ["element", "weapon_type", "rarity", "region"];
    // Shuffle properties to randomize the order in which we try them.
    const shuffledProperties = shuffleArray([...properties]);

    // Iterate over each property as a potential quiz property.
    for (const p of shuffledProperties) {
        // Get distinct values for property p in random order.
        const distinctValues = shuffleArray([...new Set(characters.map(c => c[p]))]);
        for (const v of distinctValues) {
            // For property p, we need at least (count - 1) characters with value v.
            const majorityCandidates = characters.filter(c => c[p] === v);
            if (majorityCandidates.length < count - 1) continue;

            // Generate all combinations of (count - 1) characters from the majority candidates.
            const triples = getCombinations(majorityCandidates, count - 1);
            // Shuffle the list of triples.
            const shuffledTriples = shuffleArray([...triples]);

            for (const triple of shuffledTriples) {
                // Find odd candidates: those not in the triple and whose p value is not v.
                const oddCandidates = characters.filter(c => c[p] !== v);
                // Shuffle odd candidates to vary selection.
                const shuffledOddCandidates = shuffleArray([...oddCandidates]);
                for (const odd of shuffledOddCandidates) {
                    const candidateSet = [...triple, odd];

                    // For every other property, require that the set has at least 2 distinct values and
                    // no single value appears 3 or more times.
                    let valid = true;
                    for (const q of properties) {
                        if (q === p) continue;
                        const freqQ = frequency(candidateSet, q);
                        const maxFreq = Math.max(...Object.values(freqQ));
                        if (maxFreq >= count - 1) { // Here count is 4, so maxFreq >= 3 is not allowed.
                            valid = false;
                            break;
                        }
                    }

                    if (valid) {
                        // Shuffle the final candidate set to randomize option order.
                        const options = shuffleArray(candidateSet);
                        return {
                            options,         // Array of quiz option characters.
                            answer: odd,     // The odd one out.
                            quizProperty: p, // The property used for the quiz.
                            commonValue: v   // The common value for the majority.
                        };
                    }
                }
            }
        }
    }

    console.warn("No valid random quiz set found.");
    return null;
}