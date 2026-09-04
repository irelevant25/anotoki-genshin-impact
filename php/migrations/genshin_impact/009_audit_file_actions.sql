-----------------------------------------------------------
-- TWO MORE THINGS THE AUDIT LOG CAN SAY
--
-- The log has only ever recorded INSERT, UPDATE and DELETE, because until now
-- everything it watched was a row being written by a person in a form. The
-- file catalogue does two things that are neither.
--
--   RECONCILE  a sweep of the asset tree, adopting whatever it found. It is
--              one entry for a run, not one per file: the first sweep adopts
--              eighty-eight thousand of them, and "not every small one" is
--              exactly what an audit trail of that would be.
--
--   MOVE       a file changed category, so it changed folder. Neither an
--              update to a row nor a deletion and a re-creation, and calling
--              it either would lose the one fact worth keeping - that the
--              bytes are the same bytes, somewhere else.
--
-- `changed_by` stays nullable and a reconcile leaves it null on purpose. Files
-- also arrive over FTP and leave the same way, and the honest answer to "who
-- added this" is that nobody here did; it was found. A name in that column
-- would say the person who pressed the button put the file there.
--
-- The admin page builds its filter from whatever actions exist and styles each
-- one by name, so both appear on their own without anything else changing.
-----------------------------------------------------------

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_check
    CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'RECONCILE', 'MOVE'));
