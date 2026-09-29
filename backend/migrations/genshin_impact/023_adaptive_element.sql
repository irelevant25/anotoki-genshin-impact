-- An element for the characters whose element the player chooses.
--
-- Manekin and Manekina (Luna II) take whichever element the player gives them,
-- and the wiki lists theirs as "Adaptive". A character cannot be saved without an
-- element - characters.element is NOT NULL and a foreign key into this table - so
-- the value has to exist before the import can create them.
--
-- It has no icon: the wiki draws none. The site hides an icon that fails to
-- load, so until one is added to assets/elements the element shows as its name.

INSERT INTO elements (name) VALUES ('Adaptive')
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM elements WHERE name = 'Adaptive') THEN
        RAISE EXCEPTION 'the Adaptive element was not added';
    END IF;
END $$;
