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
    'charset' => 'utf8',
];
