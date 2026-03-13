<?php

class CharacterAffiliation extends DbModel
{
    public function __construct(
        public readonly int $character_id,
        public readonly int $affiliation_id,
    ) {}
}
