<?php

use Anotoki\Lib\Support\ClientAddress;
use Anotoki\Lib\Support\Keys;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Which address a request comes from, for every limit that counts per
 * address - the new visitors' (api/visitors.php) and, through the
 * AdminContext (api/admin_tools.php), the anotoki library's own: feedback,
 * the error log's client hashes and the pages' error reports. One rule
 * wherever the site or the library reads an address, the library's
 * ClientAddress (anotoki-lib 0.5.0, the owner's rule of 2026-10-11), over this
 * site's settings:
 *
 * REMOTE_ADDR, unless the connection comes from one of the trusted proxies
 * (config/visitors.php's client_address.trusted_proxies: Cloudflare's
 * published ranges, which the site is behind - committed; the optional
 * config/visitors.local.php may name others, never one wider than a proxy's,
 * or none): then the address in Cloudflare's CF-Connecting-IP - the library's
 * ClientAddress::CLOUDFLARE_HEADER, pinned, no setting - when it holds one
 * address. A forwarding header is one the caller writes, so believed from
 * anybody else it would let them pick a new address for every request and
 * walk past every limit; and any other header (X-Real-IP, True-Client-IP,
 * X-Forwarded-For) is one a visitor may send through Cloudflare untouched, so
 * none is ever read. A header that is not one address counts the connection's
 * own.
 *
 * One address, for counting: an IPv4 address as it is (also when written as
 * IPv6, ::ffff:198.51.100.7), an IPv6 address by its /64 - one household or
 * one server is handed a whole /64 and picks from it at will, so counting
 * single IPv6 addresses would count nothing.
 *
 * What is kept of one is never the address: the visitor limits keep a keyed
 * HMAC of its bucket (clientAddressHash()), the library keyed hashes of its
 * own. No log line of this site's carries one.
 */

/**
 * The proxies whose CF-Connecting-IP names a request's address -
 * config/visitors.php's client_address.trusted_proxies, each checked there.
 *
 * @return list<string>
 */
function siteTrustedProxies(): array
{
    return visitorSettings()['client_address']['trusted_proxies'];
}

/** What the limits count for this request: its address, or for IPv6 its /64 ("2001:db8:1:2::/64"); '?' when the server gave none. */
function clientAddressCounted(Request $request): string
{
    $address = ClientAddress::of($request, siteTrustedProxies(), ClientAddress::CLOUDFLARE_HEADER);

    return $address === null ? '?' : ClientAddress::bucket($address);
}

/**
 * What the visitor limits keep of the address they count (visitor_starts,
 * users/054): an HMAC of its bucket under a key of this site's own, derived
 * from the site secret - 64 hex characters, never the address. It is the same
 * for one address for as long as the secret lasts: a stable pseudonym of it,
 * in the table and in every backup made meanwhile. Without the secret nothing
 * reads an address back from it (hashed without a key, an IPv4 address would
 * be found again by trying the four billion); whoever holds a backup AND
 * config/secret.local.php can do exactly that for an IPv4 address (2^32
 * tries), never for an IPv6 /64 (2^64). Only for a site that is set up:
 * appSecret() says so otherwise.
 */
function clientAddressHash(Request $request): string
{
    static $key = null;

    $key ??= Keys::derive(appSecret(), 'visitor-limits');

    return hash_hmac('sha256', clientAddressCounted($request), $key);
}
