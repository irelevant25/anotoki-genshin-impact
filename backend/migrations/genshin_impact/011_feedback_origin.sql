-----------------------------------------------------------
-- WHERE A PIECE OF FEEDBACK CAME FROM
--
-- The row already recorded the browser and the page. It did not record the
-- address, which is the one thing that tells two reports from the same person
-- apart from two people reporting the same thing - and the only handle there
-- is on somebody sending the form a hundred times.
--
-- `mac` is here for the same reason user_sessions has one, and will be null for
-- the same reason: a MAC address belongs to the link a request last crossed,
-- and every router between the caller and this server rewrites it. It is
-- readable only when the caller shares a network with the server - a phone
-- against a development machine - and null is the honest answer everywhere
-- else. Nothing is sent from the browser to fill either column; both are read
-- from the request, because a value the client chooses is not evidence.
-----------------------------------------------------------

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ip VARCHAR(45);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS mac VARCHAR(17);
