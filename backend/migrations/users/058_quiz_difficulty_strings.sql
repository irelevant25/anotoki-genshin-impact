-----------------------------------------------------------
-- THE QUIZZES' DIFFICULTY, CHOSEN BY THE PLAYER
--
-- The owner's request of 2026-10-19: the badge above every quiz's question
-- becomes a button that opens a dialog of the quiz's difficulties - every
-- level, what each one shows, the question's own marked - and the level
-- chosen there is the next question's, kept for each quiz in this browser
-- (frontend quizzes/shared: quiz-levels.ts, difficulty-badge,
-- difficulty-modal). The daily run's badge is no button: the daily is the
-- same for everybody. Every level now has the same five tries (the Profile
-- counts tries and wins across difficulties), so a level is harder by what
-- it shows. So, new:
--
--   - quiz.difficulty.button, .next, .daily: the badge - its name for a
--     screen reader, the line under it while the next question is to be
--     drawn at another level, and in the daily why it cannot change;
--   - quiz.difficulty.title, .intro, .introMismatch, .choose, .current,
--     .fromNext, .save, .cancel: the dialog;
--   - quiz.levelInfo.*: what each level shows, quiz by quiz. Banners and
--     Dish share the picture's three, Voice has its three; the numbers of
--     Pixelate, Music and Mismatch go into theirs as they are.
--
-- A new string only where it has none (ON CONFLICT DO NOTHING), informal
-- Slovak ("ty"), as users/051 does. No other key is touched. Apply it with the
-- upload, as every file of a release: until it runs, the new build shows its
-- new keys bare.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('quiz.difficulty.button', 'The badge above a quiz''s question, a button that opens the quiz''s difficulty dialog: what a screen reader says for it. {level} is the question''s difficulty, the badge''s own word (quiz.difficulty.easy, .medium or .hard).'),
    ('quiz.difficulty.next', 'Under the badge above a quiz''s question, while the next question is to be drawn at another difficulty than this one''s: which. {level} is that difficulty''s name (quiz.difficulty.easy, .medium or .hard).'),
    ('quiz.difficulty.daily', 'Under the badge above a daily quiz''s question, which is no button there: why its difficulty cannot be chosen. No placeholders.'),
    ('quiz.difficulty.title', 'Heading of a quiz''s difficulty dialog, opened from the badge above its question. {quiz} is the quiz''s name (quiz.banners.title and the rest).'),
    ('quiz.difficulty.intro', 'The difficulty dialog of the five quizzes with tries (all but Mismatch), above the levels: what changes from one level to the next. No placeholders.'),
    ('quiz.difficulty.introMismatch', 'Mismatch''s difficulty dialog, above the levels: what changes from one level to the next - Mismatch has no tries, one pick ends a question. No placeholders.'),
    ('quiz.difficulty.choose', 'The difficulty dialog: the name of its group of levels to choose from, read out with them by a screen reader. No placeholders.'),
    ('quiz.difficulty.current', 'The difficulty dialog: the name of the level the question on screen is played at, marked among the levels. {level} is its name (quiz.difficulty.easy, .medium or .hard).'),
    ('quiz.difficulty.fromNext', 'The difficulty dialog, under the levels, once another one is chosen while the question on screen has begun (a guess made, or over): it keeps its own level. {level} is the question''s difficulty (quiz.difficulty.easy, .medium or .hard).'),
    ('quiz.difficulty.save', 'The difficulty dialog''s button that keeps the level chosen, for this quiz in this browser. No placeholders.'),
    ('quiz.difficulty.cancel', 'The difficulty dialog''s button that closes it, changing nothing. No placeholders.'),
    ('quiz.levelInfo.pictureEasy', 'The difficulty dialog of Banners and Dish: what Easy shows, guess by guess (frontend quiz-levels.ts - a change there is a change here). No placeholders.'),
    ('quiz.levelInfo.pictureMedium', 'The difficulty dialog of Banners and Dish: what Medium shows, guess by guess (frontend quiz-levels.ts - a change there is a change here). No placeholders.'),
    ('quiz.levelInfo.pictureHard', 'The difficulty dialog of Banners and Dish: what Hard shows, guess by guess (frontend quiz-levels.ts - a change there is a change here). No placeholders.'),
    ('quiz.levelInfo.pixelate', 'The difficulty dialog of Pixelate: what a level shows. {first} and {last} are how many blocks across the portrait is drawn in at the first guess and the last, read from the level.'),
    ('quiz.levelInfo.music', 'The difficulty dialog of Music: what a level whose last guess has a piece of the track shows. {first} and {last} are the seconds of it at the first guess and the last, read from the level.'),
    ('quiz.levelInfo.musicWhole', 'The difficulty dialog of Music: what a level whose last guess has the whole track shows. {first} is the seconds of it at the first guess, read from the level.'),
    ('quiz.levelInfo.voiceEasy', 'The difficulty dialog of Voice: what Easy shows, guess by guess - the line, then the recording (frontend quiz-levels.ts - a change there is a change here). No placeholders.'),
    ('quiz.levelInfo.voiceMedium', 'The difficulty dialog of Voice: what Medium shows, guess by guess - the line, then the recording (frontend quiz-levels.ts - a change there is a change here). No placeholders.'),
    ('quiz.levelInfo.voiceHard', 'The difficulty dialog of Voice: what Hard shows, guess by guess - the line, then the recording (frontend quiz-levels.ts - a change there is a change here). No placeholders.'),
    ('quiz.levelInfo.mismatch', 'The difficulty dialog of Mismatch: what a level offers. {count} is how many characters a question shows, read from the level.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('quiz.difficulty.button', 'Difficulty: {level}'),
    ('quiz.difficulty.next', '{level} from the next question'),
    ('quiz.difficulty.daily', 'The daily is the same for everybody'),
    ('quiz.difficulty.title', 'Difficulty: {quiz}'),
    ('quiz.difficulty.intro', 'Every level has the same number of tries - what changes is how much you are shown.'),
    ('quiz.difficulty.introMismatch', 'One pick a question on every level - what changes is how many characters you choose from.'),
    ('quiz.difficulty.choose', 'Choose a difficulty'),
    ('quiz.difficulty.current', '{level} (this question)'),
    ('quiz.difficulty.fromNext', 'This question stays {level} - your choice counts from the next one.'),
    ('quiz.difficulty.save', 'Choose'),
    ('quiz.difficulty.cancel', 'Cancel'),
    ('quiz.levelInfo.pictureEasy', 'Half the picture to start, all of it after your first wrong guess.'),
    ('quiz.levelInfo.pictureMedium', 'Half the picture, blurred and in grey to start - each wrong guess takes one of the three away.'),
    ('quiz.levelInfo.pictureHard', 'A quarter of the picture, heavily blurred and in grey to start - each wrong guess shows a little more, and the colour comes only with the answer.'),
    ('quiz.levelInfo.pixelate', 'A {first} × {first} grid to start, finer with each wrong guess, up to {last} × {last}.'),
    ('quiz.levelInfo.music', 'The first {first} s of the track to start, more with each wrong guess, up to {last} s.'),
    ('quiz.levelInfo.musicWhole', 'The first {first} s of the track to start, more with each wrong guess, and all of it on your last guess.'),
    ('quiz.levelInfo.voiceEasy', 'Half the line to start, then all of it, then half a second of the recording, then the whole recording.'),
    ('quiz.levelInfo.voiceMedium', 'Half the line to start, then all of it, then half a second of the recording, then one second, then two.'),
    ('quiz.levelInfo.voiceHard', 'A quarter of the line to start, then half, then all of it, then half a second of the recording, then one second.'),
    ('quiz.levelInfo.mismatch', 'Characters to choose from: {count}.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('quiz.difficulty.button', 'Obtiažnosť: {level}'),
    ('quiz.difficulty.next', '{level} od ďalšej otázky'),
    ('quiz.difficulty.daily', 'Denné kvízy sú pre všetkých rovnaké'),
    ('quiz.difficulty.title', 'Obtiažnosť: {quiz}'),
    ('quiz.difficulty.intro', 'Každá úroveň má rovnaký počet pokusov - mení sa, koľko toho uvidíš.'),
    ('quiz.difficulty.introMismatch', 'Na každej úrovni máš na otázku jeden tip - mení sa, z koľkých postáv vyberáš.'),
    ('quiz.difficulty.choose', 'Zvoľ obtiažnosť'),
    ('quiz.difficulty.current', '{level} (táto otázka)'),
    ('quiz.difficulty.fromNext', 'Táto otázka zostáva na úrovni {level} - tvoja voľba platí od ďalšej.'),
    ('quiz.difficulty.save', 'Zvoliť'),
    ('quiz.difficulty.cancel', 'Zrušiť'),
    ('quiz.levelInfo.pictureEasy', 'Na začiatok polovica obrázka, po prvom zlom tipe celý.'),
    ('quiz.levelInfo.pictureMedium', 'Na začiatok polovica obrázka, rozmazaná a sivá - každý zlý tip jedno z toho odstráni.'),
    ('quiz.levelInfo.pictureHard', 'Na začiatok štvrtina obrázka, silno rozmazaná a sivá - každý zlý tip ukáže trochu viac a farby prídu až s odpoveďou.'),
    ('quiz.levelInfo.pixelate', 'Na začiatok mriežka {first} × {first}, s každým zlým tipom jemnejšia, až po {last} × {last}.'),
    ('quiz.levelInfo.music', 'Na začiatok {first} s zo skladby, s každým zlým tipom viac, až {last} s.'),
    ('quiz.levelInfo.musicWhole', 'Na začiatok {first} s zo skladby, s každým zlým tipom viac a pri poslednom tipe celá.'),
    ('quiz.levelInfo.voiceEasy', 'Na začiatok polovica hlášky, potom celá, potom pol sekundy z nahrávky a potom celá nahrávka.'),
    ('quiz.levelInfo.voiceMedium', 'Na začiatok polovica hlášky, potom celá, potom pol sekundy z nahrávky, potom sekunda a potom dve.'),
    ('quiz.levelInfo.voiceHard', 'Na začiatok štvrtina hlášky, potom polovica, potom celá, potom pol sekundy z nahrávky a potom sekunda.'),
    ('quiz.levelInfo.mismatch', 'Postáv na výber: {count}.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- PROVE IT
--
-- Every new key reads in English and in Slovak, and every key the badge and
-- the dialog read besides them - the three levels' names, the quizzes'
-- names - is still here.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
    lost TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('quiz.difficulty.button'), ('quiz.difficulty.next'), ('quiz.difficulty.daily'), ('quiz.difficulty.title'),
          ('quiz.difficulty.intro'), ('quiz.difficulty.introMismatch'), ('quiz.difficulty.choose'), ('quiz.difficulty.current'),
          ('quiz.difficulty.fromNext'), ('quiz.difficulty.save'), ('quiz.difficulty.cancel'),
          ('quiz.levelInfo.pictureEasy'), ('quiz.levelInfo.pictureMedium'), ('quiz.levelInfo.pictureHard'),
          ('quiz.levelInfo.pixelate'), ('quiz.levelInfo.music'), ('quiz.levelInfo.musicWhole'),
          ('quiz.levelInfo.voiceEasy'), ('quiz.levelInfo.voiceMedium'), ('quiz.levelInfo.voiceHard'),
          ('quiz.levelInfo.mismatch')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/058: keys without an English and a Slovak string: %', missing;
    END IF;

    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO lost
      FROM (VALUES
          ('quiz.difficulty.easy'), ('quiz.difficulty.medium'), ('quiz.difficulty.hard'),
          ('quiz.banners.title'), ('quiz.dish.title'), ('quiz.pixelate.title'), ('quiz.mismatch.title'), ('quiz.music.title'), ('quiz.voice.title')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name);
    IF lost IS NOT NULL THEN
        RAISE EXCEPTION 'users/058: keys the badge and the dialog read are gone: %', lost;
    END IF;
END $$;
