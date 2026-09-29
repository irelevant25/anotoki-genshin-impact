-----------------------------------------------------------
-- STRINGS FOR THIS ROUND
--
-- A sign-up button in the account panel, the count of unfinished dailies on
-- the menu, remembering a device so two-factor does not ask every time, and
-- the two settings that decide how a date and a clock are written.
--
-- The format options are labelled by an example rather than by a name - the
-- button says "1.3.2026", which tells you what you are choosing in a way that
-- "day, month, year" does not. These strings are the tooltips behind them, for
-- anyone who wants it said in words.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('common.signUp', 'Button in the account panel for somebody who has no account yet', 'genshin_impact'),
    ('nav.dailyRemaining', 'Tooltip on the count beside Daily - {count} quizzes left today', 'genshin_impact'),
    ('nav.dailyDone', 'Tooltip on the count beside Daily when there is nothing left', 'genshin_impact'),
    ('login.rememberDevice', 'Checkbox on the two-factor step of signing in', 'genshin_impact'),
    ('login.rememberDeviceNote', 'Explains what the remember-device checkbox does and does not do', 'genshin_impact'),
    ('account.devices.title', 'Heading of the remembered-devices row in the account panel', 'genshin_impact'),
    ('account.devices.count', 'How many browsers will not be asked for a code - {count}', 'genshin_impact'),
    ('account.devices.forget', 'Button that makes every browser ask for a code again', 'genshin_impact'),
    ('account.devices.forgotten', 'Notification after that', 'genshin_impact'),
    ('account.dateFormat', 'Label of the date-order chooser in the account panel', 'genshin_impact'),
    ('account.timeFormat', 'Label of the clock chooser in the account panel', 'genshin_impact'),
    ('account.formats.auto', 'Tooltip on the option that follows the device', 'genshin_impact'),
    ('account.formats.dmyDot', 'Tooltip on the day.month.year option', 'genshin_impact'),
    ('account.formats.dmySlash', 'Tooltip on the day/month/year option', 'genshin_impact'),
    ('account.formats.mdySlash', 'Tooltip on the month/day/year option', 'genshin_impact'),
    ('account.formats.ymdDash', 'Tooltip on the year-month-day option', 'genshin_impact'),
    ('account.formats.clock24', 'Tooltip on the 24-hour option', 'genshin_impact'),
    ('account.formats.clock12', 'Tooltip on the 12-hour option', 'genshin_impact'),
    ('account.formats.saved', 'Notification after changing how dates or times are written', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('common.signUp', 'Sign up'),
    ('nav.dailyRemaining', '{count} daily quizzes still to play'),
    ('nav.dailyDone', 'Today''s daily is done'),
    ('login.rememberDevice', 'Do not ask for a code on this device again'),
    ('login.rememberDeviceNote', 'For thirty days, on this browser. Your password is still needed - this only skips the code.'),
    ('account.devices.title', 'Remembered devices'),
    ('account.devices.count', '{count} will not be asked for a code'),
    ('account.devices.forget', 'Ask everywhere again'),
    ('account.devices.forgotten', 'Every device will be asked for a code again.'),
    ('account.dateFormat', 'Dates'),
    ('account.timeFormat', 'Clock'),
    ('account.formats.auto', 'As this device writes them'),
    ('account.formats.dmyDot', 'Day, month, year - separated by dots'),
    ('account.formats.dmySlash', 'Day, month, year - separated by slashes'),
    ('account.formats.mdySlash', 'Month, day, year - as written in the United States'),
    ('account.formats.ymdDash', 'Year, month, day - the order that sorts'),
    ('account.formats.clock24', 'Twenty-four hours'),
    ('account.formats.clock12', 'Twelve hours, with am and pm'),
    ('account.formats.saved', 'Saved.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('common.signUp', 'Registrovať sa'),
    ('nav.dailyRemaining', 'Ešte ti zostávajú {count} denné kvízy'),
    ('nav.dailyDone', 'Dnešná denná výzva je hotová'),
    ('login.rememberDevice', 'Na tomto zariadení sa už na kód nepýtať'),
    ('login.rememberDeviceNote', 'Tridsať dní, v tomto prehliadači. Heslo bude stále potrebné - preskočí sa len kód.'),
    ('account.devices.title', 'Zapamätané zariadenia'),
    ('account.devices.count', '{count} sa nebude pýtať na kód'),
    ('account.devices.forget', 'Pýtať sa znova všade'),
    ('account.devices.forgotten', 'Každé zariadenie sa znova spýta na kód.'),
    ('account.dateFormat', 'Dátumy'),
    ('account.timeFormat', 'Hodiny'),
    ('account.formats.auto', 'Ako ich píše toto zariadenie'),
    ('account.formats.dmyDot', 'Deň, mesiac, rok - oddelené bodkami'),
    ('account.formats.dmySlash', 'Deň, mesiac, rok - oddelené lomkami'),
    ('account.formats.mdySlash', 'Mesiac, deň, rok - ako sa píše v USA'),
    ('account.formats.ymdDash', 'Rok, mesiac, deň - poradie, ktoré sa dá triediť'),
    ('account.formats.clock24', 'Dvadsaťštyri hodín'),
    ('account.formats.clock12', 'Dvanásť hodín, s am a pm'),
    ('account.formats.saved', 'Uložené.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

