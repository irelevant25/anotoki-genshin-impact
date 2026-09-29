-----------------------------------------------------------
-- DAILY PAGE STRINGS
--
-- The Daily page shows the two quizzes set for today as the same cards the
-- Quizzes page uses, with a mark on any that has been started or finished.
--
-- daily.status.* is reached through a key built at runtime
-- ('daily.status.' + started|won|lost), so all three have to exist for any of
-- them to work. There is no key for an untouched card - it carries no mark, so
-- there is nothing to say.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('daily.title', 'Heading of the Daily page', 'genshin_impact'),
    ('daily.remaining', 'Under the heading - {count} is how many of today''s quizzes are unfinished', 'genshin_impact'),
    ('daily.allDone', 'Under the heading, once both of today''s quizzes are finished', 'genshin_impact'),
    ('daily.none', 'Shown if no quizzes could be drawn for today', 'genshin_impact'),
    ('daily.status.started', 'Mark on a daily card that has been played but not finished', 'genshin_impact'),
    ('daily.status.won', 'Mark on a daily card that was answered correctly', 'genshin_impact'),
    ('daily.status.lost', 'Mark on a daily card that ran out of tries', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('daily.title', 'Daily'),
    ('daily.remaining', '{count} left today'),
    ('daily.allDone', 'Both done for today - come back tomorrow.'),
    ('daily.none', 'Nothing set for today.'),
    ('daily.status.started', 'In progress'),
    ('daily.status.won', 'Win'),
    ('daily.status.lost', 'Lost')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('daily.title', 'Denné'),
    ('daily.remaining', 'Dnes zostáva: {count}'),
    ('daily.allDone', 'Dnes máš oboje hotové - vráť sa zajtra.'),
    ('daily.none', 'Na dnes nie je nič pripravené.'),
    ('daily.status.started', 'Rozohrané'),
    ('daily.status.won', 'Výhra'),
    ('daily.status.lost', 'Prehra')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
