-----------------------------------------------------------
-- SHARED COMPONENT STRINGS
--
-- The table and the multiselect carried Slovak wording as literals in their
-- own source. They live in local-lib, which both sites and the admin panel
-- draw from, so a literal there is a string no translator can reach.
--
-- Scope is 'common': neither string says anything about a game, and the Star
-- Rail site will want the same words.
--
-- The multiselect counts things, so it needs one wording per plural form. The
-- forms are named after CLDR's categories and chosen at runtime by
-- Intl.PluralRules, which is why there is a 'few' at all: Slovak wants
-- separate wording for two-to-four, English does not. English never asks for
-- 'few' - Intl puts 2 in 'other' for English - but it is filled in anyway so
-- the key set reads as complete rather than as a gap someone should go and
-- fix. Zero has its own key instead of a plural form, because "no values
-- selected" is a different sentence rather than a different number.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('table.noData', 'Shown in place of rows when a table has none', 'common'),
    ('multiselect.selected.none', 'Multiselect summary when nothing is selected', 'common'),
    ('multiselect.selected.one', 'Multiselect summary for exactly one selection', 'common'),
    ('multiselect.selected.few', 'Multiselect summary, CLDR few (Slovak: 2-4) - {count}', 'common'),
    ('multiselect.selected.other', 'Multiselect summary, CLDR other (the general case) - {count}', 'common'),
    ('multiselect.more.one', 'Multiselect overflow when one selection is hidden', 'common'),
    ('multiselect.more.few', 'Multiselect overflow, CLDR few (Slovak: 2-4) - {count}', 'common'),
    ('multiselect.more.other', 'Multiselect overflow, CLDR other - {count}', 'common')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('table.noData', 'No data to display'),
    ('multiselect.selected.none', 'No values selected'),
    ('multiselect.selected.one', '1 value selected'),
    ('multiselect.selected.few', '{count} values selected'),
    ('multiselect.selected.other', '{count} values selected'),
    ('multiselect.more.one', '(+1 more)'),
    ('multiselect.more.few', '(+{count} more)'),
    ('multiselect.more.other', '(+{count} more)')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('table.noData', 'Žiadne dáta na zobrazenie'),
    ('multiselect.selected.none', 'Žiadna vybraná hodnota'),
    ('multiselect.selected.one', '1 vybraná hodnota'),
    ('multiselect.selected.few', '{count} vybrané hodnoty'),
    ('multiselect.selected.other', '{count} vybraných hodnôt'),
    ('multiselect.more.one', '(+1 ďalšia)'),
    ('multiselect.more.few', '(+{count} ďalšie)'),
    ('multiselect.more.other', '(+{count} ďalších)')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
