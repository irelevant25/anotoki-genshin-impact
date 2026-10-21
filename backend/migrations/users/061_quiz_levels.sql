-----------------------------------------------------------
-- THE QUIZZES' LEVELS, ON THE ADMIN PANEL
--
-- The owner's decision of 2026-10-21: what each level of each quiz shows -
-- the tries' steps, Pixelate's grid, the seconds of a track or a recording,
-- how many characters Mismatch offers - is changed on the admin panel's new
-- Quiz levels page, by an ADMIN or an EDITOR, where it was only the code's
-- (frontend quiz-levels.ts).
--
--   quiz_levels   one row at most: the six quizzes' three levels as the page
--                 saved them, held to api/quiz_levels.php's rules before they
--                 are written and again as they are read. No row - as after
--                 this file, which seeds nothing - is the built-in levels, the
--                 frontend's QUIZ_LEVELS, which every page plays while nothing
--                 is saved, while it asks (GET /api/quiz/levels) and whenever
--                 asking fails. Who changed them, from what to what, is the
--                 audit log's (content.insert, update and delete on
--                 quiz_levels): the row keeps no person.
--
-- The difficulty dialog says each level in words (quiz.levelInfo.*), and the
-- numbers its sentences name come from the levels. Voice's three named the
-- seconds of the recording in words - "half a second", "one second", "two":
-- they take them from the levels now ({first}, {second} and {third}, the
-- seconds of the first, second and third step that plays some), English and
-- informal Slovak, each only while it is still users/058's word for word, so
-- a rewording the owner made stands - and a Slovak one only where its English
-- is this file's, so that no Slovak string names a number its English does
-- not. The descriptions of those three keys and of the picture's three - what
-- the classes do, in words no number can follow - say that the Quiz levels
-- page warns when a level's steps leave their words behind. And a Voice level
-- saved with fewer pieces of the recording than its sentence names is said in
-- general words, quiz.levelInfo.voiceOther (new): never a number missing.
--
-- Nothing to do in any order: a build from before this file reads no
-- quiz_levels and plays the built-in levels, as the new one does while nothing
-- is saved.
-----------------------------------------------------------

CREATE TABLE quiz_levels (
    -- One row at most: its key can only be 1.
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    levels JSONB NOT NULL CHECK (jsonb_typeof(levels) = 'object'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE quiz_levels IS 'The quizzes'' levels as the admin panel''s Quiz levels page saved them (api/quiz_levels.php); no row: the built-in levels, the frontend''s QUIZ_LEVELS.';

-----------------------------------------------------------
-- VOICE'S SECONDS, FROM THE LEVELS
-----------------------------------------------------------

UPDATE translations t
   SET value = v.new_value,
       updated_at = CURRENT_TIMESTAMP
  FROM (VALUES
    ('quiz.levelInfo.voiceEasy',
     'Half the line to start, then all of it, then half a second of the recording, then the whole recording.',
     'Half the line to start, then all of it, then {first} s of the recording, then the whole recording.'),
    ('quiz.levelInfo.voiceMedium',
     'Half the line to start, then all of it, then half a second of the recording, then one second, then two.',
     'Half the line to start, then all of it, then {first} s of the recording, then {second} s, then {third} s.'),
    ('quiz.levelInfo.voiceHard',
     'A quarter of the line to start, then half, then all of it, then half a second of the recording, then one second.',
     'A quarter of the line to start, then half, then all of it, then {first} s of the recording, then {second} s.')
  ) AS v(key_name, old_value, new_value)
 WHERE t.key_name = v.key_name
   AND t.language_code = 'en'
   AND t.value = v.old_value;

UPDATE translations t
   SET value = v.new_value,
       updated_at = CURRENT_TIMESTAMP
  FROM (VALUES
    ('quiz.levelInfo.voiceEasy',
     'Na začiatok polovica hlášky, potom celá, potom pol sekundy z nahrávky a potom celá nahrávka.',
     'Na začiatok polovica hlášky, potom celá, potom {first} s z nahrávky a potom celá nahrávka.',
     'Half the line to start, then all of it, then {first} s of the recording, then the whole recording.'),
    ('quiz.levelInfo.voiceMedium',
     'Na začiatok polovica hlášky, potom celá, potom pol sekundy z nahrávky, potom sekunda a potom dve.',
     'Na začiatok polovica hlášky, potom celá, potom {first} s z nahrávky, potom {second} s a potom {third} s.',
     'Half the line to start, then all of it, then {first} s of the recording, then {second} s, then {third} s.'),
    ('quiz.levelInfo.voiceHard',
     'Na začiatok štvrtina hlášky, potom polovica, potom celá, potom pol sekundy z nahrávky a potom sekunda.',
     'Na začiatok štvrtina hlášky, potom polovica, potom celá, potom {first} s z nahrávky a potom {second} s.',
     'A quarter of the line to start, then half, then all of it, then {first} s of the recording, then {second} s.')
  ) AS v(key_name, old_value, new_value, english)
 WHERE t.key_name = v.key_name
   AND t.language_code = 'sk'
   AND t.value = v.old_value
   AND EXISTS (SELECT 1 FROM translations e WHERE e.key_name = v.key_name AND e.language_code = 'en' AND e.value = v.english);

-- A key's description is the code's (users/050): what each of the six says now.
UPDATE translation_keys k
   SET description = v.description
  FROM (VALUES
    ('quiz.levelInfo.pictureEasy', 'The difficulty dialog of Banners and Dish: what Easy shows, guess by guess - the built-in level''s classes in words, which no number can follow: the admin panel''s Quiz levels page warns when Easy''s steps of either quiz differ from them. No placeholders.'),
    ('quiz.levelInfo.pictureMedium', 'The difficulty dialog of Banners and Dish: what Medium shows, guess by guess - the built-in level''s classes in words, which no number can follow: the admin panel''s Quiz levels page warns when Medium''s steps of either quiz differ from them. No placeholders.'),
    ('quiz.levelInfo.pictureHard', 'The difficulty dialog of Banners and Dish: what Hard shows, guess by guess - the built-in level''s classes in words, which no number can follow: the admin panel''s Quiz levels page warns when Hard''s steps of either quiz differ from them. No placeholders.'),
    ('quiz.levelInfo.voiceEasy', 'The difficulty dialog of Voice: what Easy shows, guess by guess - the line, then the recording. {first} is the seconds of it at the first step that plays some, read from the level; the rest is the built-in level''s steps in words, and the admin panel''s Quiz levels page warns when Easy''s steps differ from them.'),
    ('quiz.levelInfo.voiceMedium', 'The difficulty dialog of Voice: what Medium shows, guess by guess - the line, then the recording. {first}, {second} and {third} are the seconds of it at the first, second and third step that plays some, read from the level; the rest is the built-in level''s steps in words, and the admin panel''s Quiz levels page warns when Medium''s steps differ from them.'),
    ('quiz.levelInfo.voiceHard', 'The difficulty dialog of Voice: what Hard shows, guess by guess - the line, then the recording. {first} and {second} are the seconds of it at the first and second step that plays some, read from the level; the rest is the built-in level''s steps in words, and the admin panel''s Quiz levels page warns when Hard''s steps differ from them.')
  ) AS v(name, description)
 WHERE k.name = v.name;

-----------------------------------------------------------
-- VOICE IN GENERAL WORDS
--
-- A key's placeholders are its English's (the anotoki library's rule: a
-- rewording keeps them), so Voice's three sentences always name as many
-- pieces of the recording as the built-in levels play - Easy one, Medium
-- three, Hard two. A level saved with fewer pieces than its sentence names
-- is said in general words instead, true of every level the rules take, so
-- that no reader ever sees a number missing: quiz.levelInfo.voiceOther, new,
-- English and informal Slovak, each only where it has none.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('quiz.levelInfo.voiceOther', 'The difficulty dialog of Voice: what a level shows when its steps play fewer pieces of the recording than its own sentence (quiz.levelInfo.voiceEasy, .voiceMedium or .voiceHard) names - general words, true of every level the admin panel''s Quiz levels page lets an administrator save. No placeholders.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value) VALUES
    ('quiz.levelInfo.voiceOther', 'en', 'Part of the line or of its recording to start, and more with each wrong guess.'),
    ('quiz.levelInfo.voiceOther', 'sk', 'Na začiatok časť hlášky alebo jej nahrávky a s každým zlým tipom viac.')
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- PROVE IT
--
-- The table is there, empty: the built-in levels are in force. No Voice
-- string in English is still users/058's, nor one in Slovak beside this
-- file's English; no Slovak one names a number its English does not; Voice's
-- general words read in English and Slovak; and the keys the difficulty
-- dialog reads are all here.
-----------------------------------------------------------

DO $$
DECLARE
    stale TEXT;
    unmatched TEXT;
    lost TEXT;
BEGIN
    IF (SELECT count(*) FROM quiz_levels) <> 0 THEN
        RAISE EXCEPTION 'users/061: quiz_levels holds a row: nothing is to be saved but by the Quiz levels page';
    END IF;

    IF (SELECT count(*) FROM translations WHERE key_name = 'quiz.levelInfo.voiceOther' AND language_code IN ('en', 'sk')) <> 2 THEN
        RAISE EXCEPTION 'users/061: quiz.levelInfo.voiceOther has no English or no Slovak string';
    END IF;

    SELECT string_agg(t.key_name || '|' || t.language_code, ', ' ORDER BY t.key_name, t.language_code) INTO stale
      FROM translations t
     WHERE (t.key_name, t.language_code, t.value) IN (
          ('quiz.levelInfo.voiceEasy', 'en', 'Half the line to start, then all of it, then half a second of the recording, then the whole recording.'),
          ('quiz.levelInfo.voiceMedium', 'en', 'Half the line to start, then all of it, then half a second of the recording, then one second, then two.'),
          ('quiz.levelInfo.voiceHard', 'en', 'A quarter of the line to start, then half, then all of it, then half a second of the recording, then one second.')
     )
        OR ((t.key_name, t.language_code, t.value) IN (
          ('quiz.levelInfo.voiceEasy', 'sk', 'Na začiatok polovica hlášky, potom celá, potom pol sekundy z nahrávky a potom celá nahrávka.'),
          ('quiz.levelInfo.voiceMedium', 'sk', 'Na začiatok polovica hlášky, potom celá, potom pol sekundy z nahrávky, potom sekunda a potom dve.'),
          ('quiz.levelInfo.voiceHard', 'sk', 'Na začiatok štvrtina hlášky, potom polovica, potom celá, potom pol sekundy z nahrávky a potom sekunda.')
        ) AND EXISTS (SELECT 1 FROM translations e WHERE e.key_name = t.key_name AND e.language_code = 'en' AND e.value LIKE '%{first}%'));
    IF stale IS NOT NULL THEN
        RAISE EXCEPTION 'users/061: strings still in users/058''s words: %', stale;
    END IF;

    SELECT string_agg(s.key_name || ' ' || p.placeholder, ', ' ORDER BY s.key_name, p.placeholder) INTO unmatched
      FROM translations s
     CROSS JOIN (VALUES ('{first}'), ('{second}'), ('{third}')) AS p(placeholder)
     WHERE s.key_name IN ('quiz.levelInfo.voiceEasy', 'quiz.levelInfo.voiceMedium', 'quiz.levelInfo.voiceHard')
       AND s.language_code = 'sk'
       AND strpos(s.value, p.placeholder) > 0
       AND NOT EXISTS (SELECT 1 FROM translations e WHERE e.key_name = s.key_name AND e.language_code = 'en' AND strpos(e.value, p.placeholder) > 0);
    IF unmatched IS NOT NULL THEN
        RAISE EXCEPTION 'users/061: Slovak strings name a number their English does not: %', unmatched;
    END IF;

    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO lost
      FROM (VALUES
          ('quiz.levelInfo.pictureEasy'), ('quiz.levelInfo.pictureMedium'), ('quiz.levelInfo.pictureHard'),
          ('quiz.levelInfo.pixelate'), ('quiz.levelInfo.music'), ('quiz.levelInfo.musicWhole'),
          ('quiz.levelInfo.voiceEasy'), ('quiz.levelInfo.voiceMedium'), ('quiz.levelInfo.voiceHard'), ('quiz.levelInfo.voiceOther'),
          ('quiz.levelInfo.mismatch')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name);
    IF lost IS NOT NULL THEN
        RAISE EXCEPTION 'users/061: keys the difficulty dialog reads are gone: %', lost;
    END IF;
END $$;
