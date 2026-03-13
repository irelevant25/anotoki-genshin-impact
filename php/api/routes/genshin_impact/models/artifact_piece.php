<?php

class ArtifactPiece extends DbModel
{
    public function __construct(
        public readonly int    $artifact_id,
        public readonly string $type,
        public readonly string $name,
    ) {}
}
