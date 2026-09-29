-----------------------------------------------------------
-- SITE LANGUAGES AND UI TRANSLATIONS
--
-- The site itself becomes translatable. Game content stays as it is: one
-- character description, in English, is still one description.
--
-- `languages` already existed with a name as its key, which reads well in a
-- dropdown but is no use to a browser. It gains the code the rest of the
-- stack speaks, the name as its own speakers write it, and a way to be
-- switched off without being deleted. `users.language` moves from the name to
-- the code so there is one spelling of a language everywhere.
--
-- Translations are rows rather than files because they are edited from the
-- admin panel: files bundled into the Angular build are overwritten by the
-- next deploy, and files written by the server would be a database without
-- the audit log. The admin editor imports and exports JSON, so bulk work in
-- a text editor is still on the table.
-----------------------------------------------------------

-----------------------------------------------------------
-- LANGUAGES
-----------------------------------------------------------

ALTER TABLE languages ADD COLUMN IF NOT EXISTS code        VARCHAR(10);
ALTER TABLE languages ADD COLUMN IF NOT EXISTS native_name VARCHAR(50);
ALTER TABLE languages ADD COLUMN IF NOT EXISTS enabled     BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE languages ADD COLUMN IF NOT EXISTS sort_order  INTEGER NOT NULL DEFAULT 0;

INSERT INTO languages (name) VALUES ('English'), ('Slovak') ON CONFLICT DO NOTHING;

UPDATE languages SET code = 'en', native_name = 'English',    sort_order = 1 WHERE name = 'English';
UPDATE languages SET code = 'sk', native_name = 'Slovenčina', sort_order = 2 WHERE name = 'Slovak';

-- Any row this migration did not anticipate still needs a code. A collision
-- here trips the unique constraint below rather than passing silently.
UPDATE languages SET code = lower(substring(name from 1 for 2)) WHERE code IS NULL;
UPDATE languages SET native_name = name WHERE native_name IS NULL;

ALTER TABLE languages ALTER COLUMN code        SET NOT NULL;
ALTER TABLE languages ALTER COLUMN native_name SET NOT NULL;
ALTER TABLE languages ADD CONSTRAINT uq_languages_code UNIQUE (code);

-----------------------------------------------------------
-- USERS POINT AT THE CODE
-----------------------------------------------------------

ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_language;
ALTER TABLE users ALTER COLUMN language DROP DEFAULT;

UPDATE users SET language = COALESCE(
    (SELECT l.code FROM languages l WHERE l.name = users.language), 'en'
);

ALTER TABLE users ALTER COLUMN language TYPE VARCHAR(10);
ALTER TABLE users ALTER COLUMN language SET DEFAULT 'en';
ALTER TABLE users ADD CONSTRAINT fk_users_language
    FOREIGN KEY (language) REFERENCES languages(code) ON UPDATE CASCADE;

-----------------------------------------------------------
-- TRANSLATION KEYS
-- name: TranslationKey
--
-- A key exists on its own so it can be listed in the admin editor before
-- anyone has translated it, and so it can carry a note explaining where it
-- appears. Without that a translator is guessing from the key alone.
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS translation_keys (
    name        VARCHAR(200)    PRIMARY KEY,
    description TEXT,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP
);
CREATE OR REPLACE TRIGGER trg_translation_keys_updated_at
    BEFORE UPDATE ON translation_keys
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- TRANSLATIONS
-- name: Translation
--
-- Deleting a language takes its translations with it, and renaming a key
-- carries them along, so neither leaves orphans behind.
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS translations (
    key_name      VARCHAR(200)  NOT NULL,
    language_code VARCHAR(10)   NOT NULL,
    value         TEXT          NOT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP,

    PRIMARY KEY (key_name, language_code),
    CONSTRAINT fk_translations_key FOREIGN KEY (key_name)
        REFERENCES translation_keys(name) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_translations_language FOREIGN KEY (language_code)
        REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations (language_code);
CREATE OR REPLACE TRIGGER trg_translations_updated_at
    BEFORE UPDATE ON translations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- SEED: the strings the site was carrying hard coded
--
-- English is the fallback, so it is the one row every key must have. The
-- Slovak column is a first pass and is meant to be corrected in the admin
-- editor rather than by another migration.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('common.cancel', 'Button that abandons a form'),
    ('common.close', 'Button that closes a dialog'),
    ('common.submit', 'Button that sends a form'),
    ('common.signIn', 'Button that opens the login dialog'),
    ('common.login', 'Login dialog title and confirm button'),
    ('common.logout', 'Button that ends the session'),
    ('nav.daily', 'Top navigation item'),
    ('nav.quizzes', 'Top navigation item'),
    ('nav.games', 'Top navigation item'),
    ('nav.database', 'Top navigation item'),
    ('nav.profile', 'Top navigation item'),
    ('footer.backgrounds', 'Bottom bar item'),
    ('footer.feedback', 'Bottom bar item'),
    ('footer.versions', 'Bottom bar item, replaced by the version number once loaded'),
    ('footer.account', 'Bottom bar item'),
    ('account.title', 'Account dialog title'),
    ('account.email', 'Row label'),
    ('account.role', 'Row label'),
    ('account.memberSince', 'Row label, followed by a date'),
    ('account.confirmed', 'Badge on a verified email address'),
    ('account.unconfirmed', 'Badge on an unverified email address'),
    ('account.signedOutNote', 'Shown in place of the profile when nobody is signed in'),
    ('account.appearance', 'Label of the light/dark chooser'),
    ('account.language', 'Label of the language chooser'),
    ('account.adminPanel', 'Button that opens the admin panel'),
    ('account.loggingOut', 'Loader text while signing out'),
    ('theme.light', 'Appearance choice'),
    ('theme.dark', 'Appearance choice'),
    ('theme.auto', 'Appearance choice that follows the operating system'),
    ('login.title', 'Login dialog title'),
    ('login.email', 'Field label'),
    ('login.emailPlaceholder', 'Field placeholder'),
    ('login.password', 'Field label'),
    ('login.passwordPlaceholder', 'Field placeholder'),
    ('login.loggingIn', 'Loader text while signing in'),
    ('feedback.title', 'Feedback dialog title'),
    ('feedback.type', 'Field label'),
    ('feedback.typeBug', 'Feedback kind'),
    ('feedback.typeSuggestion', 'Feedback kind'),
    ('feedback.typeOther', 'Feedback kind'),
    ('feedback.emailOptional', 'Field label'),
    ('feedback.section', 'Field label, which part of the site the report is about'),
    ('feedback.sectionPlaceholder', 'Field placeholder'),
    ('feedback.subject', 'Field label'),
    ('feedback.subjectPlaceholder', 'Field placeholder'),
    ('feedback.steps', 'Field label'),
    ('feedback.stepsPlaceholder', 'Field placeholder, three numbered lines'),
    ('feedback.expected', 'Field label'),
    ('feedback.expectedPlaceholder', 'Field placeholder'),
    ('feedback.actual', 'Field label'),
    ('feedback.actualPlaceholder', 'Field placeholder'),
    ('feedback.browser', 'Field label'),
    ('feedback.browserPlaceholder', 'Field placeholder'),
    ('feedback.additional', 'Field label'),
    ('feedback.additionalPlaceholder', 'Field placeholder'),
    ('feedback.details', 'Field label'),
    ('feedback.detailsPlaceholder', 'Field placeholder'),
    ('feedback.whyImportant', 'Field label'),
    ('feedback.whyImportantPlaceholder', 'Field placeholder'),
    ('feedback.message', 'Field label'),
    ('feedback.messagePlaceholder', 'Field placeholder'),
    ('backgrounds.title', 'Backgrounds dialog title'),
    ('backgrounds.whatTitle', 'Section heading'),
    ('backgrounds.whatText', 'Section text'),
    ('backgrounds.howTitle', 'Section heading'),
    ('backgrounds.step1', 'Numbered instruction'),
    ('backgrounds.step2', 'Numbered instruction'),
    ('backgrounds.step3', 'Numbered instruction'),
    ('backgrounds.step4', 'Numbered instruction'),
    ('backgrounds.availableTitle', 'Section heading'),
    ('backgrounds.availableText', 'Section text'),
    ('backgrounds.note', 'Closing note'),
    ('changelog.title', 'Changelog dialog title'),
    ('changelog.latest', 'Badge on the newest version'),
    ('changelog.added', 'Section heading'),
    ('changelog.fixed', 'Section heading'),
    ('changelog.updated', 'Section heading'),
    ('changelog.new', 'Small badge beside a brand new entry'),
    ('changelog.noFixes', 'Shown when a version fixed nothing'),
    ('notFound.title', 'Heading of the 404 page'),
    ('notFound.text', 'Body of the 404 page')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('common.cancel', 'Cancel'),
    ('common.close', 'Close'),
    ('common.submit', 'Submit'),
    ('common.signIn', 'Sign in'),
    ('common.login', 'Login'),
    ('common.logout', 'Logout'),
    ('nav.daily', 'Daily'),
    ('nav.quizzes', 'Quizzes'),
    ('nav.games', 'Games'),
    ('nav.database', 'Database'),
    ('nav.profile', 'Profile'),
    ('footer.backgrounds', 'Backgrounds'),
    ('footer.feedback', 'Feedback/Contact'),
    ('footer.versions', 'Versions'),
    ('footer.account', 'Account'),
    ('account.title', 'Account'),
    ('account.email', 'Email'),
    ('account.role', 'Role'),
    ('account.memberSince', 'Member since'),
    ('account.confirmed', 'Confirmed'),
    ('account.unconfirmed', 'Unconfirmed'),
    ('account.signedOutNote', 'You are not signed in. Your choices are remembered on this device.'),
    ('account.appearance', 'Appearance'),
    ('account.language', 'Language'),
    ('account.adminPanel', 'Admin panel'),
    ('account.loggingOut', 'Logging out...'),
    ('theme.light', 'Light'),
    ('theme.dark', 'Dark'),
    ('theme.auto', 'System'),
    ('login.title', 'Login'),
    ('login.email', 'Email'),
    ('login.emailPlaceholder', 'your@email.com'),
    ('login.password', 'Password'),
    ('login.passwordPlaceholder', 'password'),
    ('login.loggingIn', 'Logging in...'),
    ('feedback.title', 'Site Feedback & Contact'),
    ('feedback.type', 'Type'),
    ('feedback.typeBug', 'Bug'),
    ('feedback.typeSuggestion', 'Suggestion'),
    ('feedback.typeOther', 'Other'),
    ('feedback.emailOptional', 'Email (optional)'),
    ('feedback.section', 'Section'),
    ('feedback.sectionPlaceholder', 'Select a section'),
    ('feedback.subject', 'Title'),
    ('feedback.subjectPlaceholder', 'Brief summary'),
    ('feedback.steps', 'Steps to Reproduce'),
    ('feedback.stepsPlaceholder', E'1. Go to...\n2. Click on...\n3. See error...'),
    ('feedback.expected', 'Expected Behavior'),
    ('feedback.expectedPlaceholder', 'What should happen?'),
    ('feedback.actual', 'Actual Behavior'),
    ('feedback.actualPlaceholder', 'What actually happens?'),
    ('feedback.browser', 'Browser & Device Information'),
    ('feedback.browserPlaceholder', 'e.g., Chrome 120 on Windows 11'),
    ('feedback.additional', 'Additional Information'),
    ('feedback.additionalPlaceholder', 'Any other details...'),
    ('feedback.details', 'Details'),
    ('feedback.detailsPlaceholder', 'Describe your suggestion...'),
    ('feedback.whyImportant', 'Why is this important?'),
    ('feedback.whyImportantPlaceholder', 'How would this improve the experience?'),
    ('feedback.message', 'Message'),
    ('feedback.messagePlaceholder', 'Your message...'),
    ('backgrounds.title', 'Backgrounds'),
    ('backgrounds.whatTitle', 'What is the Background Feature?'),
    ('backgrounds.whatText', 'Customize your quiz experience by choosing different character-themed wallpapers as the app background.'),
    ('backgrounds.howTitle', 'How to Use'),
    ('backgrounds.step1', 'Click on the Background menu item to view available wallpapers'),
    ('backgrounds.step2', 'Browse through the character thumbnails'),
    ('backgrounds.step3', 'Click on any character thumbnail to set their wallpaper as the background'),
    ('backgrounds.step4', 'The background will instantly change to your selection'),
    ('backgrounds.availableTitle', 'Available Backgrounds'),
    ('backgrounds.availableText', 'Backgrounds are available for characters that have wallpaper assets. The selection varies depending on the assets included in your installation.'),
    ('backgrounds.note', 'Note: You can continue playing quizzes with any background of your choice.'),
    ('changelog.title', 'Changelog'),
    ('changelog.latest', 'Latest'),
    ('changelog.added', 'Added'),
    ('changelog.fixed', 'Fixed'),
    ('changelog.updated', 'Updated'),
    ('changelog.new', 'new'),
    ('changelog.noFixes', 'No fixes in this version'),
    ('notFound.title', 'Page not found'),
    ('notFound.text', 'Sorry, we could not find the page you are looking for. Check that the address is correct.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('common.cancel', 'Zrušiť'),
    ('common.close', 'Zavrieť'),
    ('common.submit', 'Odoslať'),
    ('common.signIn', 'Prihlásiť sa'),
    ('common.login', 'Prihlásenie'),
    ('common.logout', 'Odhlásiť sa'),
    ('nav.daily', 'Denné'),
    ('nav.quizzes', 'Kvízy'),
    ('nav.games', 'Hry'),
    ('nav.database', 'Databáza'),
    ('nav.profile', 'Profil'),
    ('footer.backgrounds', 'Pozadia'),
    ('footer.feedback', 'Spätná väzba/Kontakt'),
    ('footer.versions', 'Verzie'),
    ('footer.account', 'Účet'),
    ('account.title', 'Účet'),
    ('account.email', 'E-mail'),
    ('account.role', 'Rola'),
    ('account.memberSince', 'Členom od'),
    ('account.confirmed', 'Overený'),
    ('account.unconfirmed', 'Neoverený'),
    ('account.signedOutNote', 'Nie ste prihlásený. Vaše nastavenia sú uložené v tomto zariadení.'),
    ('account.appearance', 'Vzhľad'),
    ('account.language', 'Jazyk'),
    ('account.adminPanel', 'Administrácia'),
    ('account.loggingOut', 'Odhlasovanie...'),
    ('theme.light', 'Svetlý'),
    ('theme.dark', 'Tmavý'),
    ('theme.auto', 'Systémový'),
    ('login.title', 'Prihlásenie'),
    ('login.email', 'E-mail'),
    ('login.emailPlaceholder', 'vas@email.com'),
    ('login.password', 'Heslo'),
    ('login.passwordPlaceholder', 'heslo'),
    ('login.loggingIn', 'Prihlasovanie...'),
    ('feedback.title', 'Spätná väzba a kontakt'),
    ('feedback.type', 'Typ'),
    ('feedback.typeBug', 'Chyba'),
    ('feedback.typeSuggestion', 'Návrh'),
    ('feedback.typeOther', 'Iné'),
    ('feedback.emailOptional', 'E-mail (nepovinné)'),
    ('feedback.section', 'Sekcia'),
    ('feedback.sectionPlaceholder', 'Vyberte sekciu'),
    ('feedback.subject', 'Predmet'),
    ('feedback.subjectPlaceholder', 'Stručné zhrnutie'),
    ('feedback.steps', 'Postup na zopakovanie'),
    ('feedback.stepsPlaceholder', E'1. Prejdite na...\n2. Kliknite na...\n3. Zobrazí sa chyba...'),
    ('feedback.expected', 'Očakávané správanie'),
    ('feedback.expectedPlaceholder', 'Čo sa má stať?'),
    ('feedback.actual', 'Skutočné správanie'),
    ('feedback.actualPlaceholder', 'Čo sa deje v skutočnosti?'),
    ('feedback.browser', 'Prehliadač a zariadenie'),
    ('feedback.browserPlaceholder', 'napr. Chrome 120 na Windows 11'),
    ('feedback.additional', 'Ďalšie informácie'),
    ('feedback.additionalPlaceholder', 'Akékoľvek ďalšie podrobnosti...'),
    ('feedback.details', 'Podrobnosti'),
    ('feedback.detailsPlaceholder', 'Opíšte svoj návrh...'),
    ('feedback.whyImportant', 'Prečo je to dôležité?'),
    ('feedback.whyImportantPlaceholder', 'Ako by to zlepšilo používanie?'),
    ('feedback.message', 'Správa'),
    ('feedback.messagePlaceholder', 'Vaša správa...'),
    ('backgrounds.title', 'Pozadia'),
    ('backgrounds.whatTitle', 'Čo je funkcia pozadia?'),
    ('backgrounds.whatText', 'Prispôsobte si kvízy výberom tapiet s postavami ako pozadie aplikácie.'),
    ('backgrounds.howTitle', 'Ako to použiť'),
    ('backgrounds.step1', 'Kliknutím na položku Pozadia zobrazíte dostupné tapety'),
    ('backgrounds.step2', 'Prezrite si náhľady postáv'),
    ('backgrounds.step3', 'Kliknutím na náhľad postavy nastavíte jej tapetu ako pozadie'),
    ('backgrounds.step4', 'Pozadie sa okamžite zmení na váš výber'),
    ('backgrounds.availableTitle', 'Dostupné pozadia'),
    ('backgrounds.availableText', 'Pozadia sú dostupné pre postavy, ktoré majú tapety. Výber sa líši podľa toho, ktoré súbory sú súčasťou inštalácie.'),
    ('backgrounds.note', 'Poznámka: Kvízy môžete hrať s ľubovoľným pozadím podľa vlastného výberu.'),
    ('changelog.title', 'Zoznam zmien'),
    ('changelog.latest', 'Najnovšia'),
    ('changelog.added', 'Pridané'),
    ('changelog.fixed', 'Opravené'),
    ('changelog.updated', 'Aktualizované'),
    ('changelog.new', 'nové'),
    ('changelog.noFixes', 'V tejto verzii nie sú žiadne opravy'),
    ('notFound.title', 'Stránka nebola nájdená'),
    ('notFound.text', 'Je nám ľúto, ale nemohli sme nájsť stránku, ktorú hľadáte. Skontrolujte, či ste zadali správnu adresu URL.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
