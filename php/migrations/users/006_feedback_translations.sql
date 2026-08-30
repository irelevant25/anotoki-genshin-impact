-----------------------------------------------------------
-- FEEDBACK FORM STRINGS
--
-- The contact form now sends somewhere, which gave it things to say: whether
-- the message arrived, and what sending anonymously means.
--
-- Found by `php translations.php --status`, which reads the Angular sources
-- and reports keys the database does not have.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('feedback.anonymous', 'Checkbox shown to a signed-in sender'),
    ('feedback.anonymousNote', 'Shown in place of the address when sending anonymously'),
    ('feedback.emailHelp', 'Help text under the address field'),
    ('feedback.sending', 'Loader text while the message is being sent'),
    ('feedback.thanks', 'Confirmation once the message is stored'),
    ('feedback.failed', 'Shown when the message could not be sent'),
    ('feedback.incomplete', 'Shown when required fields are still empty')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('feedback.anonymous', 'Send anonymously'),
    ('feedback.anonymousNote', 'Nothing identifying you is sent, and we will not be able to reply.'),
    ('feedback.emailHelp', 'Optional. Leave it empty to stay anonymous.'),
    ('feedback.sending', 'Sending...'),
    ('feedback.thanks', 'Thank you, your message has been received.'),
    ('feedback.failed', 'Your message could not be sent. Please try again.'),
    ('feedback.incomplete', 'Please fill in the fields marked as required.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('feedback.anonymous', 'Odoslať anonymne'),
    ('feedback.anonymousNote', 'Neodošle sa nič, čo by vás identifikovalo, a nebudeme vám môcť odpovedať.'),
    ('feedback.emailHelp', 'Nepovinné. Ponechajte prázdne, ak chcete zostať anonymný.'),
    ('feedback.sending', 'Odosielanie...'),
    ('feedback.thanks', 'Ďakujeme, vaša správa bola prijatá.'),
    ('feedback.failed', 'Vašu správu sa nepodarilo odoslať. Skúste to znova.'),
    ('feedback.incomplete', 'Vyplňte prosím povinné polia.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
