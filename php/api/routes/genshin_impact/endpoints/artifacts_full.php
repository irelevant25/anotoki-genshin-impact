<?php

// ── /api/artifacts[/{id}]/full ────────────────────────────────────────────────
//
// artifact
//   pieces[]   -- one per artifact_piece_type

registerFullResource(
    $app,
    'artifacts',
    'artifacts',
    Artifact::class,
    'artifact',
    [
        [
            'key' => 'pieces',
            'table' => 'artifacts_pieces',
            'fk' => 'artifact_id',
            'model' => ArtifactPiece::class,
        ],
    ],
    [
        '_parent' => ['icon' => 'artifacts'],
        'pieces' => ['icon' => 'artifacts'],
    ]
);
