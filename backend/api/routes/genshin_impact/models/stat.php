<?php

class Stat extends DbModel
{
    public function __construct(
        public readonly string $name,
    ) {}
}
