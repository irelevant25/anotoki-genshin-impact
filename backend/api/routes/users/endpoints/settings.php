<?php

use Anotoki\Lib\Auth\Http\AuthRoutes;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * What the site itself is told, before anybody has signed in.
 *
 *   GET /api/settings/public   where the site signs people in, and the visitors
 *
 * Open by necessity: the page has to know where its sign-in lives before it
 * can ask who is reading it. Nothing here is a secret - the IAM's address and
 * this site's client id are exactly what the frontend's sign-in button needs,
 * and both are public by design (every token names them).
 *
 * The switches an admin throws without a deploy - the site closed for
 * maintenance, the announcement, who sees each page - were here too until
 * anotoki-lib 0.11.0 made genshin's own the family's: they are the library's
 * site settings now (api/site_state.php's siteSettings()), told at
 * GET /api/site-settings and set at /api/admin/site-settings (api/index.php).
 * This answer keeps the rest of the boot.
 */
function publicSiteSettings(): array
{
    $iam = siteIam();
    // Asked here first for its log line (an IAM that does not know this site,
    // or could not be asked); the answer below is the same, kept for the request.
    signInRequired();

    return [
        // What the pages need to sign in, the anotoki library's boot
        // configuration (AuthRoutes::configBody()): the IAM, this site's id
        // there, the IAM's switch relayed - the page learns it here, from its
        // own server, and never asks the IAM itself - and sign_in_available,
        // false once the IAM has said it does not know this site (then no
        // sign-in is offered, and the sign-in hint sends nobody to the IAM).
        // Beside them this site's two links into the IAM.
        'auth' => AuthRoutes::configBody(siteSignInRule(), $iam) + [
            'account_url' => $iam->accountUrl(),
            'admin_url' => $iam->issuer . '/admin',
        ],
        // Playing without signing in (api/visitors.php): whether the server
        // can keep a visitor's games yet - not until users/045 is applied, so
        // an upload before "Apply pending" behaves as before - and for how
        // long, the server's own number, so the page's notice and the sweep
        // agree. Whether visitors are welcome at all is auth.login_required.
        'visitors' => [
            'available' => visitorsReady(),
            'keep_days' => visitorSetting('keep_days'),
        ],
    ];
}

// ── GET /api/settings/public ─────────────────────────────────────────────────
//
// Open, and asked once at start-up before anything else: where the IAM is
// comes from here. It answers while an update waits, while the site is closed
// for maintenance (a reserved path of the site settings, SITE_RESERVED_API_PATHS)
// and while the IAM requires sign-in (SIGN_IN_OPEN_PATHS), and never reads a
// token (TOKENLESS_PATHS).

$app->get('/api/settings/public', function (Request $request, Response $response) {
    return respondJson($response, publicSiteSettings());
})->add(responds(PublicSiteSettings::class));
