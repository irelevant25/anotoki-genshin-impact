<?php

class ArtifactPiece extends DbModel
{
    public function __construct(
        public readonly int    $artifact_id,
        public readonly string $type,
        public readonly string $name,
        public readonly ?int $icon_file_id = null,
    ) {}
}
