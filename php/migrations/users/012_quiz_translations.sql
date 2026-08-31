-----------------------------------------------------------
-- QUIZ STRINGS
--
-- The five quizzes ported from the old site need words the banners quiz never
-- did: an audio transport for music and voice, a difficulty badge that every
-- quiz shows, and the prompt and verdict for mismatch, which asks a different
-- question from the rest.
--
-- quiz.difficulty.* is reached through a key built at runtime
-- ('quiz.difficulty.' + easy|medium|hard), so all three have to exist for any
-- of them to work.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('quiz.play', 'Audio transport button in the music and voice quizzes', 'genshin_impact'),
    ('quiz.pause', 'Audio transport button in the music and voice quizzes', 'genshin_impact'),
    ('quiz.restart', 'Audio transport button - back to the start of the clip', 'genshin_impact'),
    ('quiz.difficulty.easy', 'Difficulty badge above every quiz question', 'genshin_impact'),
    ('quiz.difficulty.medium', 'Difficulty badge above every quiz question', 'genshin_impact'),
    ('quiz.difficulty.hard', 'Difficulty badge above every quiz question', 'genshin_impact'),
    ('quiz.mismatch.prompt', 'Instruction above the mismatch grid', 'genshin_impact'),
    ('quiz.mismatch.right', 'Shown after a correct pick, followed by what the others shared', 'genshin_impact'),
    ('quiz.mismatch.wrong', 'Shown after a wrong pick, followed by what the others shared', 'genshin_impact'),
    ('quiz.mismatch.noSet', 'Shown when no set with a single answer could be drawn', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('quiz.play', 'Play'),
    ('quiz.pause', 'Pause'),
    ('quiz.restart', 'Restart'),
    ('quiz.difficulty.easy', 'Easy'),
    ('quiz.difficulty.medium', 'Medium'),
    ('quiz.difficulty.hard', 'Hard'),
    ('quiz.mismatch.prompt', 'Which one does not belong?'),
    ('quiz.mismatch.right', 'Correct. The others all shared'),
    ('quiz.mismatch.wrong', 'Not quite. The others all shared'),
    ('quiz.mismatch.noSet', 'No question could be put together right now.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('quiz.play', 'Prehrať'),
    ('quiz.pause', 'Pozastaviť'),
    ('quiz.restart', 'Od začiatku'),
    ('quiz.difficulty.easy', 'Ľahká'),
    ('quiz.difficulty.medium', 'Stredná'),
    ('quiz.difficulty.hard', 'Ťažká'),
    ('quiz.mismatch.prompt', 'Ktorý sem nepatrí?'),
    ('quiz.mismatch.right', 'Správne. Ostatní mali spoločné'),
    ('quiz.mismatch.wrong', 'Nie celkom. Ostatní mali spoločné'),
    ('quiz.mismatch.noSet', 'Otázku sa teraz nepodarilo zostaviť.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
