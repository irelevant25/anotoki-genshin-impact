-----------------------------------------------------------
-- THE OLD COPIES OF THE AUDIT LOG AND FEEDBACK GO (2026-10-25)
--
-- The owner's request of 2026-10-25: no leftover tables. genshin_impact/028
-- and 029 kept the old tables when the audit log and feedback moved into the
-- anotoki library's - audit_logs_before_library (every entry, by account id)
-- and feedback_before_library (every message, without the address it came
-- from) - unread, "for one release", a way back in case something did not
-- come over whole. Every release since has read the library's tables alone;
-- the copies go, with nothing kept of them. The backup Apply takes first
-- holds them as they were.
--
-- A file of this half, not of users/: on a new installation every users/ file
-- runs before genshin_impact/001, and 028 and 029 make these copies after
-- them (renaming the tables they move from), so only a file after them can
-- take them away. users/067 drops the words' two copies and the Privacy page's
-- line for all four; the two are applied together.
--
-- The scrub of the IAM's deleted accounts no longer blanks the old feedback's
-- copy (api/admin_tools.php's peopleScrubCopies()): there is none.
-----------------------------------------------------------

DROP TABLE IF EXISTS audit_logs_before_library;
DROP TABLE IF EXISTS feedback_before_library;

-----------------------------------------------------------
-- PROVE IT
-----------------------------------------------------------

DO $$
BEGIN
    IF to_regclass('audit_logs_before_library') IS NOT NULL OR to_regclass('feedback_before_library') IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/033: the old copies of the audit log and feedback are still here';
    END IF;
END $$;
