<?php

// ---------------------------------------------------------------------------
// config/google.php — signing in with Google
// ---------------------------------------------------------------------------
// Empty by default, and everything to do with Google is off while it is: the
// button does not appear on the site, and the endpoints behind it refuse.
// Nothing here is a secret - a client id is public, it travels in the page and
// identifies the site to Google - so this file is committed rather than local.
// It is the *audience* check that makes it matter: an id token minted for
// somebody else's client id is refused, which is what stops a token obtained
// by another site being replayed at this one.
//
// To turn it on, make an OAuth 2.0 Client ID of type "Web application" in the
// Google Cloud console and put it here, or in config/google.local.php to keep
// development and production apart. Two things have to be set on it:
//
//   Authorised JavaScript origins
//       http://localhost:4200     while developing
//       https://anotoki.sk        once deployed
//
//   Authorised redirect URIs
//       none needed. The site uses Google Identity Services, which hands the
//       browser an id token directly rather than redirecting anywhere, so
//       there is no callback URL to register.
//
// No client secret is involved for the same reason: nothing here exchanges an
// authorisation code. The browser receives a signed id token, posts it to
// /api/auth/google, and the server checks the signature against Google's own
// published keys.
// ---------------------------------------------------------------------------

return [
    'client_id' => '',
];
