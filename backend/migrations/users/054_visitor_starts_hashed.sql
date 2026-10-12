-----------------------------------------------------------
-- THE NEW VISITORS' COUNT KEEPS NO ADDRESS
--
-- anotoki-lib 0.5.0 (2026-10-11), and the owner's rule of the same day: what
-- an anotoki site keeps of where a request came from is a keyed hash, never
-- the address. visitor_starts (users/045) counts the visitors made in the
-- last hour by address, for the limit on new visitors from one address - and
-- kept the address itself (an IPv6 one by its /64), an hour at a time, in the
-- database and so in every backup made meanwhile. From this release
-- api/visitors.php writes an HMAC of it instead (clientAddressHash(),
-- api/client_address.php: SHA-256 under a key derived from the site secret,
-- 64 hex characters), and the column takes nothing else (the check below).
-- The hash is the same for one address for as long as the secret lasts - so
-- the limit counts as before - which makes it a stable pseudonym of the
-- address, here and in every backup made meanwhile. Without the secret
-- nothing reads an address back from it; whoever holds a backup AND
-- config/secret.local.php can find an IPv4 address again by trying all 2^32
-- (an IPv6 /64, 2^64, stays out of reach).
--
-- The rows there now hold addresses. They cannot become the HMAC here - its
-- key is the site's, never the database's - so they go: each was kept for an
-- hour at most, and for at most an hour after this runs the limits count the
-- new visitors from zero (the sites are not public yet; the owner's word of
-- 2026-10-11). Nothing else changes: no other table, no other column, no
-- visitor and nobody's games - the limit only reads this table.
--
-- The backups made before this file ran hold the addresses of their hour as
-- they were, until the owner deletes them (DEV.md, the 0.5.0 update).
--
-- NOT A WAY BACK
--
-- A build from before this file writes the address, which the check refuses:
-- its first save for a new visitor would fail. Upload the new build first,
-- then Apply; once this has run, an older build never goes on the host again.
-----------------------------------------------------------

DELETE FROM visitor_starts WHERE address !~ '^[0-9a-f]{64}$';

-- Dropped and added again, so a second run is the same as the first.
ALTER TABLE visitor_starts DROP CONSTRAINT IF EXISTS visitor_starts_address_hashed;

ALTER TABLE visitor_starts ADD CONSTRAINT visitor_starts_address_hashed CHECK (address ~ '^[0-9a-f]{64}$');

COMMENT ON COLUMN visitor_starts.address IS
    'users/054: an HMAC-SHA256 (hex) of the address bucket a new visitor came from, under a key derived from the site secret - never the address (api/client_address.php, clientAddressHash()).';

-----------------------------------------------------------
-- PROVE IT
--
-- The check is there and holds every row (validated), and no row holds
-- anything but a hash; the table and its two indexes are as users/045 made
-- them.
-----------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                    WHERE conrelid = 'visitor_starts'::regclass AND conname = 'visitor_starts_address_hashed'
                      AND contype = 'c' AND convalidated) THEN
        RAISE EXCEPTION 'users/054: visitor_starts has no validated check visitor_starts_address_hashed';
    END IF;
    IF EXISTS (SELECT 1 FROM visitor_starts WHERE address !~ '^[0-9a-f]{64}$') THEN
        RAISE EXCEPTION 'users/054: visitor_starts still holds an address';
    END IF;
    IF (SELECT count(*) FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'visitor_starts'
           AND column_name IN ('id', 'address', 'started_at')) <> 3
       OR to_regclass('visitor_starts_by_address') IS NULL OR to_regclass('visitor_starts_by_time') IS NULL THEN
        RAISE EXCEPTION 'users/054: visitor_starts is not as users/045 made it (id, address, started_at, its two indexes)';
    END IF;
END $$;
