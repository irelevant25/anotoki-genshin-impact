<?php

/**
 * Generic model for simple lookup tables that use a name as the primary key.
 */
class RelationshipType extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class TalentType extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class FoodType extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class MaterialType extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class MaterialGroup extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class Region extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class EnemyType extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class DomainLevel extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class EnemyFamily extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class CharacterModel extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}

class EnemyGroup extends DbModel
{
    public function __construct(public readonly string $name)
    {
    }
}
