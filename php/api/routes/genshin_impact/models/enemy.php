<?php

class Enemy extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly string $icon,
        public readonly ?string $version = null,
        public readonly ?string $description = null,
        public readonly ?string $interactive_map_link = null,
    ) {
    }
}
