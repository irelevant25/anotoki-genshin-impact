-----------------------------------------------------------
-- PROFILE PAGE STRINGS
--
-- The header has had a Profile item since the menu was written; this is the
-- page behind it, and these are the strings on it.
--
-- Two of the keys it uses are not here. The difficulty labels are reached
-- through a key built at runtime - 'quiz.difficulty.' plus easy, medium or hard
-- - and those already exist among the quiz strings, so they are reused rather
-- than restated; profile.difficulty.unknown below fills the same slot for
-- questions answered before difficulty was recorded. The quiz names come from
-- quiz.<id>.title, which the Quizzes and Daily pages use too, so a quiz reads
-- as itself wherever it is met.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('profile.title', 'Heading of the Profile page, shown to a visitor who is not signed in', 'genshin_impact'),
    ('profile.signedOut.text', 'Under that heading - statistics belong to an account, so there is nothing to show without one', 'genshin_impact'),
    ('profile.memberSince', 'Label before the date the account was created', 'genshin_impact'),
    ('profile.failed', 'Shown when one of the four reads failed and part of the page is missing', 'genshin_impact'),
    ('profile.empty.title', 'Heading when signed in but no question has been finished yet', 'genshin_impact'),
    ('profile.empty.text', 'Under that heading', 'genshin_impact'),
    ('profile.empty.action', 'Link from the empty profile to the quizzes', 'genshin_impact'),
    ('profile.overview.played', 'Headline figure - questions finished, won and lost together', 'genshin_impact'),
    ('profile.overview.winRate', 'Headline figure - the share of those that were won', 'genshin_impact'),
    ('profile.overview.attempts', 'Headline figure - tries spent per question', 'genshin_impact'),
    ('profile.overview.characters', 'Headline figure - how many different characters have come up', 'genshin_impact'),
    ('profile.overview.quizzes', 'Headline figure - how many of the six have been played, shown as n / 6', 'genshin_impact'),
    ('profile.overview.streak', 'Headline figure - consecutive days played, up to today', 'genshin_impact'),
    ('profile.quizzes.title', 'Heading of the per-quiz section', 'genshin_impact'),
    ('profile.legend.won', 'The green part of every bar, and the mark on a won result', 'genshin_impact'),
    ('profile.legend.lost', 'The red part of every bar, and the mark on a lost result', 'genshin_impact'),
    ('profile.difficulty.title', 'Heading of the per-difficulty section', 'genshin_impact'),
    ('profile.difficulty.unknown', 'Stands where a difficulty would, for questions answered before it was recorded', 'genshin_impact'),
    ('profile.difficulty.none', 'Shown when nothing has been answered since difficulty started being recorded', 'genshin_impact'),
    ('profile.activity.title', 'Heading of the activity grid', 'genshin_impact'),
    ('profile.activity.summary', 'Above the grid - {days} is days played, {longest} the longest unbroken run', 'genshin_impact'),
    ('profile.activity.cell', 'Tooltip on one square - {played} questions that day, {wins} of them won', 'genshin_impact'),
    ('profile.activity.less', 'Left end of the shading legend', 'genshin_impact'),
    ('profile.activity.more', 'Right end of the shading legend', 'genshin_impact'),
    ('profile.characters.title', 'Heading of the per-character section', 'genshin_impact'),
    ('profile.characters.mostMet', 'Label on the character who has come up most often', 'genshin_impact'),
    ('profile.characters.times', 'Under that label - {count} is how many questions they were the answer to', 'genshin_impact'),
    ('profile.characters.best', 'Label on the character with the highest win rate', 'genshin_impact'),
    ('profile.characters.toughest', 'Label on the character with the lowest win rate', 'genshin_impact'),
    ('profile.characters.needMore', 'Shown instead, while no character has come up the {count} times a highlight needs', 'genshin_impact'),
    ('profile.characters.column.character', 'Character table column', 'genshin_impact'),
    ('profile.characters.column.played', 'Character table column - questions they were the answer to', 'genshin_impact'),
    ('profile.characters.column.won', 'Character table column', 'genshin_impact'),
    ('profile.characters.column.lost', 'Character table column', 'genshin_impact'),
    ('profile.characters.column.winRate', 'Character table column', 'genshin_impact'),
    ('profile.characters.column.attempts', 'Character table column - tries per question', 'genshin_impact'),
    ('profile.recent.title', 'Heading of the list of the last finished questions', 'genshin_impact'),
    ('profile.recent.attempts', 'On one of those - {count} is how many tries it took', 'genshin_impact'),
    ('profile.recent.none', 'Shown when there is nothing in that list', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('profile.title', 'Profile'),
    ('profile.signedOut.text', 'Sign in to see how your quizzes have been going.'),
    ('profile.memberSince', 'Playing since'),
    ('profile.failed', 'Some of your statistics could not be loaded, so what is below is incomplete.'),
    ('profile.empty.title', 'Nothing here yet'),
    ('profile.empty.text', 'Finish a question in any quiz and it will start showing up here.'),
    ('profile.empty.action', 'Go to the quizzes'),
    ('profile.overview.played', 'Questions'),
    ('profile.overview.winRate', 'Win rate'),
    ('profile.overview.attempts', 'Tries per question'),
    ('profile.overview.characters', 'Characters met'),
    ('profile.overview.quizzes', 'Quizzes played'),
    ('profile.overview.streak', 'Day streak'),
    ('profile.quizzes.title', 'By quiz'),
    ('profile.legend.won', 'Won'),
    ('profile.legend.lost', 'Lost'),
    ('profile.difficulty.title', 'By difficulty'),
    ('profile.difficulty.unknown', 'Not recorded'),
    ('profile.difficulty.none', 'Nothing has been answered since difficulty started being recorded.'),
    ('profile.activity.title', 'Activity'),
    ('profile.activity.summary', '{days} days played, longest run {longest}.'),
    ('profile.activity.cell', '{played} played, {wins} won'),
    ('profile.activity.less', 'Less'),
    ('profile.activity.more', 'More'),
    ('profile.characters.title', 'By character'),
    ('profile.characters.mostMet', 'Met most'),
    ('profile.characters.times', '{count} questions'),
    ('profile.characters.best', 'Best against'),
    ('profile.characters.toughest', 'Toughest'),
    ('profile.characters.needMore', 'Best and toughest appear once a character has come up {count} times.'),
    ('profile.characters.column.character', 'Character'),
    ('profile.characters.column.played', 'Played'),
    ('profile.characters.column.won', 'Won'),
    ('profile.characters.column.lost', 'Lost'),
    ('profile.characters.column.winRate', 'Win rate'),
    ('profile.characters.column.attempts', 'Tries'),
    ('profile.recent.title', 'Last twenty'),
    ('profile.recent.attempts', '{count} tries'),
    ('profile.recent.none', 'Nothing answered yet.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('profile.title', 'Profil'),
    ('profile.signedOut.text', 'Prihlás sa a uvidíš, ako ti idú kvízy.'),
    ('profile.memberSince', 'Hráš od'),
    ('profile.failed', 'Časť štatistík sa nepodarilo načítať, takže to, čo je nižšie, nie je úplné.'),
    ('profile.empty.title', 'Zatiaľ tu nič nie je'),
    ('profile.empty.text', 'Dohraj otázku v ktoromkoľvek kvíze a objaví sa tu.'),
    ('profile.empty.action', 'Prejsť na kvízy'),
    ('profile.overview.played', 'Otázky'),
    ('profile.overview.winRate', 'Úspešnosť'),
    ('profile.overview.attempts', 'Pokusov na otázku'),
    ('profile.overview.characters', 'Stretnutých postáv'),
    ('profile.overview.quizzes', 'Odohraných kvízov'),
    ('profile.overview.streak', 'Dní v rade'),
    ('profile.quizzes.title', 'Podľa kvízu'),
    ('profile.legend.won', 'Výhra'),
    ('profile.legend.lost', 'Prehra'),
    ('profile.difficulty.title', 'Podľa obtiažnosti'),
    ('profile.difficulty.unknown', 'Nezaznamenané'),
    ('profile.difficulty.none', 'Odkedy sa zaznamenáva obtiažnosť, nebola zodpovedaná žiadna otázka.'),
    ('profile.activity.title', 'Aktivita'),
    ('profile.activity.summary', 'Odohraných dní: {days}, najdlhšia séria: {longest}.'),
    ('profile.activity.cell', 'Odohraných: {played}, výhier: {wins}'),
    ('profile.activity.less', 'Menej'),
    ('profile.activity.more', 'Viac'),
    ('profile.characters.title', 'Podľa postavy'),
    ('profile.characters.mostMet', 'Najčastejšie'),
    ('profile.characters.times', 'Otázok: {count}'),
    ('profile.characters.best', 'Najlepšie ti ide'),
    ('profile.characters.toughest', 'Najhoršie ti ide'),
    ('profile.characters.needMore', 'Najlepšia a najhoršia postava sa ukážu, keď niektorá príde na rad {count}-krát.'),
    ('profile.characters.column.character', 'Postava'),
    ('profile.characters.column.played', 'Odohraté'),
    ('profile.characters.column.won', 'Výhry'),
    ('profile.characters.column.lost', 'Prehry'),
    ('profile.characters.column.winRate', 'Úspešnosť'),
    ('profile.characters.column.attempts', 'Pokusy'),
    ('profile.recent.title', 'Posledných dvadsať'),
    ('profile.recent.attempts', 'Pokusov: {count}'),
    ('profile.recent.none', 'Zatiaľ nič zodpovedané.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
