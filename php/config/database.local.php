<?php

// config/database.php
// Copy this to config/database.local.php and fill in your credentials
// database.local.php is gitignored

return [
    'driver' => 'pgsql',
    'host' => '127.0.0.1',
    'port' => '5432',
    'databases' => [
        'users' => 'users',
        'genshin_impact' => 'genshin_impact',
        'star_rail' => 'star_rail',
    ],
    'username' => 'postgres',
    'password' => 'antk',
    // Hand connections back from the pool instead of opening one per request.
    // Only a win where PHP holds processes open; harmless where it does not.
    'persistent' => true,

    'charset' => 'utf8',
];
