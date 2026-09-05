-----------------------------------------------------------
-- THE MAC COLUMN GOES
--
-- It was added on the theory that a hardware address is a stronger handle on a
-- visitor than an IP. It is not, because a server never sees one: a MAC address
-- belongs to the link a request last crossed, and every router between the
-- caller and here rewrites it. The only thing it ever caught was somebody on
-- the same network as the server, which in practice meant a phone against a
-- development machine and nothing else. Every row in this table has it null.
--
-- A column that is null for everybody who is not in the building is not a
-- weaker signal, it is a misleading one, so it goes rather than staying as
-- something to explain. The IP stays: it is what a request actually carries,
-- and behind a proxy it is still the closest thing to an origin there is.
-----------------------------------------------------------

ALTER TABLE user_sessions DROP COLUMN IF EXISTS mac;
