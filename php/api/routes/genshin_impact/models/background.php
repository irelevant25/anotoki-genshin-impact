<?php

class Background extends DbModel
{
    public function __construct(
        public readonly string $name,
    ) {}
}
