<?php

abstract class DbModel
{
    protected static function jsonFields(): array
    {
        return [];
    }

    public static function fromBody(array $body): static
    {
        $params = [];
        foreach ((new ReflectionClass(static::class))->getConstructor()->getParameters() as $param) {
            $name = $param->getName();
            if (array_key_exists($name, $body)) {
                $params[$name] = $body[$name];
            }
        }
        return new static(...$params);
    }

    public static function partialToDbArray(array $body): array
    {
        $knownKeys = array_map(
            fn($p) => $p->getName(),
            (new ReflectionClass(static::class))->getConstructor()->getParameters()
        );
        $data = array_intersect_key($body, array_flip($knownKeys));
        foreach (static::jsonFields() as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = $data[$field] !== null ? json_encode($data[$field]) : null;
            }
        }
        foreach ($data as $key => $value) {
            if (is_bool($value)) $data[$key] = (int) $value;
        }
        return $data;
    }

    public function toDbArray(): array
    {
        $data = [];
        foreach ((new ReflectionClass($this))->getProperties() as $prop) {
            $data[$prop->getName()] = $prop->getValue($this);
        }
        foreach (static::jsonFields() as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = $data[$field] !== null ? json_encode($data[$field]) : null;
            }
        }
        foreach ($data as $key => $value) {
            if (is_bool($value)) $data[$key] = (int) $value;
        }
        return $data;
    }
}
