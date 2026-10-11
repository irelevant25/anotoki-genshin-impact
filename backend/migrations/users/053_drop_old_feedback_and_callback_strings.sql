-----------------------------------------------------------
-- THE OLD FEEDBACK FORM'S AND SIGN-IN CALLBACK'S WORDS GO
--
-- Since anotoki-lib 0.4.1 (2026-10-11) the visitors' feedback form and the
-- page a sign-in comes back to are the anotoki library's, in its own words
-- (anotoki.feedback.*, anotoki.signIn.*, brought by its anotoki_translations
-- 003 and 004). The site's own form (site-feedback-contact-modal) and its
-- callback page went with that change, and nothing asks for their strings any
-- more - the owner's decision of 2026-10-11, as for the not-set-up page's in
-- 049: the form's labels, placeholders, kinds and answers (feedback.*), its
-- Cancel and Submit buttons (common.cancel and common.submit, which no other
-- page used), and the callback page's seven (auth.callback.*).
--
-- Each key was checked with the key scan of `php translations.php --status`
-- (the library's KeyScanner over frontend/src/app, shared/dynamic-keys.ts
-- included): it lists every one of them as nothing asks for it, and none is
-- named, whole, anywhere in frontend/src or backend/ but in the migrations.
-- Kept, because the pages still read them: the library form's extra fields,
-- worded by the site (feedback.steps, feedback.expected and its placeholder,
-- feedback.browser and its placeholder, feedback.whyImportant and its
-- placeholder - shared/site-feedback.ts), footer.feedback, common.close,
-- common.signIn, auth.startFailed and auth.unavailable.
--
-- Deleting a key takes its strings with it, in every language and whatever
-- the owner reworded them to - translations.key_name is ON DELETE CASCADE.
-- No other key is touched. Apply it after the upload, as every file of this
-- release: a build from before would show these keys bare.
-----------------------------------------------------------

DELETE FROM translation_keys WHERE name IN (
    'auth.callback.back',
    'auth.callback.cancelled',
    'auth.callback.code',
    'auth.callback.expired',
    'auth.callback.failed',
    'auth.callback.retry',
    'auth.callback.title',
    'common.cancel',
    'common.submit',
    'feedback.actual',
    'feedback.actualPlaceholder',
    'feedback.additional',
    'feedback.additionalPlaceholder',
    'feedback.anonymous',
    'feedback.anonymousNote',
    'feedback.details',
    'feedback.detailsPlaceholder',
    'feedback.emailHelp',
    'feedback.emailOptional',
    'feedback.emailPlaceholder',
    'feedback.failed',
    'feedback.incomplete',
    'feedback.message',
    'feedback.messagePlaceholder',
    'feedback.section',
    'feedback.sectionPlaceholder',
    'feedback.sending',
    'feedback.stepsPlaceholder',
    'feedback.subject',
    'feedback.subjectPlaceholder',
    'feedback.thanks',
    'feedback.title',
    'feedback.type',
    'feedback.typeBug',
    'feedback.typeOther',
    'feedback.typeSuggestion'
);

-----------------------------------------------------------
-- PROVE IT
--
-- None of the thirty-six keys is left, and no string under one - and every
-- key of the same namespaces the pages still read is still here.
-----------------------------------------------------------

DO $$
DECLARE
    leftover TEXT;
    lost TEXT;
BEGIN
    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM (
          SELECT name FROM translation_keys
           WHERE name IN (
               'auth.callback.back', 'auth.callback.cancelled', 'auth.callback.code', 'auth.callback.expired',
               'auth.callback.failed', 'auth.callback.retry', 'auth.callback.title', 'common.cancel', 'common.submit',
               'feedback.actual', 'feedback.actualPlaceholder', 'feedback.additional', 'feedback.additionalPlaceholder',
               'feedback.anonymous', 'feedback.anonymousNote', 'feedback.details', 'feedback.detailsPlaceholder',
               'feedback.emailHelp', 'feedback.emailOptional', 'feedback.emailPlaceholder', 'feedback.failed',
               'feedback.incomplete', 'feedback.message', 'feedback.messagePlaceholder', 'feedback.section',
               'feedback.sectionPlaceholder', 'feedback.sending', 'feedback.stepsPlaceholder', 'feedback.subject',
               'feedback.subjectPlaceholder', 'feedback.thanks', 'feedback.title', 'feedback.type', 'feedback.typeBug',
               'feedback.typeOther', 'feedback.typeSuggestion'
           )
          UNION
          SELECT key_name FROM translations
           WHERE key_name IN (
               'auth.callback.back', 'auth.callback.cancelled', 'auth.callback.code', 'auth.callback.expired',
               'auth.callback.failed', 'auth.callback.retry', 'auth.callback.title', 'common.cancel', 'common.submit',
               'feedback.actual', 'feedback.actualPlaceholder', 'feedback.additional', 'feedback.additionalPlaceholder',
               'feedback.anonymous', 'feedback.anonymousNote', 'feedback.details', 'feedback.detailsPlaceholder',
               'feedback.emailHelp', 'feedback.emailOptional', 'feedback.emailPlaceholder', 'feedback.failed',
               'feedback.incomplete', 'feedback.message', 'feedback.messagePlaceholder', 'feedback.section',
               'feedback.sectionPlaceholder', 'feedback.sending', 'feedback.stepsPlaceholder', 'feedback.subject',
               'feedback.subjectPlaceholder', 'feedback.thanks', 'feedback.title', 'feedback.type', 'feedback.typeBug',
               'feedback.typeOther', 'feedback.typeSuggestion'
           )
      ) AS left_behind;
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'the old feedback form''s and callback page''s strings are still here: %', leftover;
    END IF;

    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO lost
      FROM (VALUES
          ('feedback.steps'), ('feedback.expected'), ('feedback.expectedPlaceholder'), ('feedback.browser'),
          ('feedback.browserPlaceholder'), ('feedback.whyImportant'), ('feedback.whyImportantPlaceholder'),
          ('footer.feedback'), ('common.close'), ('common.signIn'), ('auth.startFailed'), ('auth.unavailable')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name);
    IF lost IS NOT NULL THEN
        RAISE EXCEPTION 'keys the pages still read are gone: %', lost;
    END IF;
END $$;
