<?php

// ---------------------------------------------------------------------------
// config/app.php — where this site is, and who may call its API from a browser
// ---------------------------------------------------------------------------
// config/app.local.php, which setup.php writes, returns:
//
//   'url'           this site's own address, scheme and host: http://localhost:4200
//                   in development (ng serve), https://genshin.anotoki.eu once
//                   deployed. The API answers browsers calling from it (CORS):
//                   in development that is another port, in production the
//                   page's own origin, where it costs nothing.
//   'cors_origins'  any other origin allowed to call the API from a browser.
//                   Usually none.
//
// There is no default for either - see config/local.php. The allowlist that
// used to be written here named a production domain in every checkout.
// ---------------------------------------------------------------------------

require_once __DIR__ . '/local.php';

/**
 * This site's address and the other origins its API answers, normalised to
 * `scheme://host[:port]`.
 *
 * @return array{url: string, cors_origins: string[]}
 */
function appConfig(): array
{
    static $config = null;

    if ($config !== null) {
        return $config;
    }

    $local = localConfig('app');
    $url = is_array($local) ? localConfigOrigin($local['url'] ?? null) : null;

    if ($url === null) {
        notSetUp('app.local.php', 'this site\'s own address');
    }

    $origins = [];
    foreach ((array) ($local['cors_origins'] ?? []) as $origin) {
        $normalised = localConfigOrigin($origin);
        if ($normalised !== null) {
            $origins[] = $normalised;
        }
    }

    return $config = ['url' => $url, 'cors_origins' => array_values(array_unique($origins))];
}
