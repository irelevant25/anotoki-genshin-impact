const DIFFICULTIES = [
    {
        id: 1,
        name: 'easy',
        numer: 'I',
        icon: '✦',
        title: 'Adventurer',
        subtitle: 'Every journey has its beginning.',
        description: 'Perfect for new travelers to Teyvat who are still learning about the world. Focuses on fundamental knowledge.',
        quizzes: [
            {
                title: 'Banners',
                description: 'Test your knowledge of character\'s banner namecard.',
                difficulties: [
                    'Total tries: 5',
                    '1. You will see only left 50% of the namecard.',
                    '2-5. You will see whole original namecard.',
                ]
            },
            {
                title: 'Pixelate',
                description: 'Test your knowledge of characters\'s icon.',
                difficulties: [
                    'Total tries: 5',
                    '1. 7x7 - 49 pixels.',
                    '2. 12x12 - 144 pixels.',
                    '3. 17x17 - 289 pixels.',
                    '4. 22x22 - 484 pixels.',
                    '5. 27.27 - 729 pixels.'
                ]
            },
            {
                title: 'Mismatch',
                description: 'Test your knowledge of character\'s elements, regions and weapon types.',
                difficulties: [
                    'Total tries: 1',
                    '1. 3 choices amount.'
                ]
            },
            {
                title: 'Music',
                description: 'Test your knowledge of character\'s demo music.',
                difficulties: [
                    'Total tries: 5',
                    '1. 5 seconds long.',
                    '2. 10 seconds long.',
                    '3. 15 seconds long.',
                    '4. 20 seconds long.',
                    '5. No length limit.'
                ]
            },
            {
                title: 'Dish',
                description: 'Test your knowledge of character\'s dish.',
                difficulties: [
                    'Total tries: 5',
                    '1. You will see only left 50% of the dish.',
                    '2-5. You will see whole original dish.',
                ]
            },
            {
                title: 'Voice',
                description: 'Test your knowledge of character\'s voice.',
                difficulties: [
                    'Total tries: 5',
                    '1. Half voice line length. No voice over.',
                    '2. Full voice line length. No voice over.',
                    '3. Full voice line length. Half voice over length,',
                    '4-5. Full voice line length. Full voice over length.'
                ]
            }
        ]
    },
    {
        id: 2,
        name: 'medium',
        numer: 'II',
        icon: '✦✦',
        title: 'Seeker',
        subtitle: 'Knowledge is a stepping stone to greater heights.',
        description: 'Designed for regular adventurers who have explored much of Teyvat. Tests deeper knowledge of the world.',
        quizzes: [
            {
                title: 'Banners',
                description: 'Test your knowledge of character\'s banner namecard.',
                difficulties: [
                    'Total tries: 4',
                    '1. Only left 50% of the namecard, grayscale and blur effects.',
                    '2. Grayscale and blur effects.',
                    '3-4. You will see whole original namecard.',
                ]
            },
            {
                title: 'Pixelate',
                description: 'Test your knowledge of characters\'s icon.',
                difficulties: [
                    'Total tries: 4',
                    '1. 6x6 - 36 pixels.',
                    '2. 11x11 - 121 pixels.',
                    '3. 16x16 - 256 pixels.',
                    '4. 21x21 - 441 pixels.',
                ]
            },
            {
                title: 'Mismatch',
                description: 'Test your knowledge of character\'s elements, regions and weapon types.',
                difficulties: [
                    'Total tries: 1',
                    '1. 4 choices amount.'
                ]
            },
            {
                title: 'Music',
                description: 'Test your knowledge of character\'s demo music.',
                difficulties: [
                    'Total tries: 4',
                    '1. 5 seconds long.',
                    '2. 10 seconds long.',
                    '3. 15 seconds long.',
                    '4. 20 seconds long.'
                ]
            },
            {
                title: 'Dish',
                description: 'Test your knowledge of character\'s dish.',
                difficulties: [
                    'Total tries: 4',
                    '1. Only left 50% of the dish, grayscale and blur effects.',
                    '2. Grayscale and blur effects.',
                    '3-4. You will see whole original dish.',
                ]
            },
            {
                title: 'Voice',
                description: 'Test your knowledge of character\'s voice.',
                difficulties: [
                    'Total tries: 4',
                    '1. Half voice line length. No voice over.',
                    '2. Full voice line length. No voice over.',
                    '3. Full voice line length. Half voice over length,',
                    '4. Full voice line length. Full voice over length.'
                ]
            }
        ]
    },
    {
        id: 3,
        name: 'hard',
        numer: 'III',
        icon: '✦✦✦',
        title: 'Scholar',
        subtitle: 'Only those who have walked far can see the full picture.',
        description: 'Created for the most dedicated Genshin Impact players. Delves into obscure lore and hidden connections.',
        quizzes: [
            {
                title: 'Banners',
                description: 'Test your knowledge of character\'s banner namecard.',
                difficulties: [
                    'Total tries: 3',
                    '1. Only left 50% of the namecard, grayscale and blurred effects.',
                    '2. Grayscale and blur effects.',
                    '3. Grayscale effect only.',
                ]
            },
            {
                title: 'Pixelate',
                description: 'Test your knowledge of characters\'s icon.',
                difficulties: [
                    'Total tries: 3',
                    '1. 5x5 - 25 pixels.',
                    '2. 10x10 - 100 pixels.',
                    '3. 15x15 - 225 pixels.',
                ]
            },
            {
                title: 'Mismatch',
                description: 'Test your knowledge of character\'s elements, regions and weapon types.',
                difficulties: [
                    'Total tries: 1',
                    '1. Only 5 choices amount.'
                ]
            },
            {
                title: 'Music',
                description: 'Test your knowledge of character\'s demo music.',
                difficulties: [
                    'Total tries: 3',
                    '1. 5 seconds long.',
                    '2. 10 seconds long.',
                    '3. 15 seconds long.'
                ]
            },
            {
                title: 'Dish',
                description: 'Test your knowledge of character\'s dish.',
                difficulties: [
                    'Total tries: 3',
                    '1. Only left 50% of the dish, grayscale and blurred effects.',
                    '2. Grayscale and blur effects.',
                    '3. Grayscale effect only.',
                ]
            },
            {
                title: 'Voice',
                description: 'Test your knowledge of character\'s voice.',
                difficulties: [
                    'Total tries: 3',
                    '1. Half voice line length. No voice over.',
                    '2. Full voice line length. No voice over.',
                    '3. Full voice line length. Half voice over length,'
                ]
            }
        ]
    }
];