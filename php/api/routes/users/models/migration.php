<?php

class Migration extends DbModel
{
    public function __construct(
        public readonly string $filename,
    ) {}
}
