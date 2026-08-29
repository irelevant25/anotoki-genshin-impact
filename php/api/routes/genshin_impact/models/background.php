<?php

class Background extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $image = null,
        public readonly ?string $image_name = null,
        public readonly ?string $preview = null,
        public readonly ?string $preview_name = null,
    ) {}
}
