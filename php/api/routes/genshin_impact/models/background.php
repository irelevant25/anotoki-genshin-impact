<?php

class Background extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly ?int $image_file_id = null,
        public readonly ?int $preview_file_id = null,
    ) {}
}
