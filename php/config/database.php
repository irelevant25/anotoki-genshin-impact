<?php

// config/database.php
// Copy this to config/database.local.php and fill in your credentials
// database.local.php is gitignored
//
// 'databases' maps a stable alias → actual database name.
// Routes always use the alias (e.g. getDb('genshin_impact')).
// To rename a database on your server, only change the value here.

return [
    'driver' => 'mysql', // Change to 'pgsql' for PostgreSQL
    'host' => '127.0.0.1',
    'port' => '3306',    // 5432 for PostgreSQL
    'databases' => [
        'users'          => 'your_users_db',
        'genshin_impact' => 'your_genshin_db',
        'star_rail'      => 'your_star_rail_db',
    ],
    'username' => 'your_username',
    'password' => 'your_password',
    'charset' => 'utf8mb4', // 'utf8' for PostgreSQL
];
