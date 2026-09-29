<?php

class Enemy extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly ?int $icon_file_id = null,
        public readonly ?string $version = null,
        public readonly ?string $description = null,
        public readonly ?string $interactive_map_link = null,
    ) {
    }
}
