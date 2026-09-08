-- The voice-over wrapper table gets a name that says what it wraps and reads in
-- line with the ascension wrapper added alongside it (018):
-- voice_over_sets -> characters_voice_overs_sets.
--
-- A table rename carries everything that points at it by identity rather than by
-- name: the foreign keys from characters.voice_over_set_id and
-- characters_voice_overs.voice_over_set_id keep referencing it, and the id
-- sequence keeps working. Only the table name changes; the columns keep their
-- short names.
ALTER TABLE IF EXISTS voice_over_sets RENAME TO characters_voice_overs_sets;
