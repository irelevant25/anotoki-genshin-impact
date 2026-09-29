<?php

class Banner extends DbModel
{
    public function __construct(
        public readonly string  $name,
        public readonly string  $version,
        public readonly string  $duration_from,
        public readonly ?string $duration_to = null,
        public readonly ?int $icon_file_id = null,
    ) {}
}
