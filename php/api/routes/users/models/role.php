<?php

namespace User;

class Role extends \DbModel
{
    public function __construct(
        public readonly string $name,
    ) {}
}
