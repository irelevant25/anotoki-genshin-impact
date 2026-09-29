<?php

// ── /api/banners[/{id}]/full ──────────────────────────────────────────────────
//
// banner
//   characters[]   -- featured characters, ordered
//   weapons[]      -- featured weapons, ordered
//
// Banners have no icon column; the art is resolved from "{version} - {name}".

registerFullResource(
    $app,
    'banners',
    'banners',
    Banner::class,
    'banner',
    [
        [
            'key' => 'characters',
            'table' => 'banners_characters',
            'fk' => 'banner_id',
            'model' => BannerCharacter::class,
        ],
        [
            'key' => 'weapons',
            'table' => 'banners_weapons',
            'fk' => 'banner_id',
            'model' => BannerWeapon::class,
        ],
    ],
    full: BannerFull::class,
    fullRow: BannerFullRow::class,
);
