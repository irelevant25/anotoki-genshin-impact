<?php

class DbQuery
{
    private array $includes = [];  // fkCol => ['table' => string, 'columns' => string[]]
    private array $externalIncludes = [];  // fkCol => ['pdo' => PDO, 'table' => string, 'columns' => string[]]
    private array $aliasMap = [];  // internal alias => ['fk' => string, 'col' => string]
    private array $orderCols = [];
    private ?array $includeColsList = null;
    private ?array $excludeColsList = null;
    private ?int $limitVal = null;
    private ?int $offsetVal = null;
    private string $driver;

    private function __construct(
        private readonly PDO $pdo,
        private readonly string $table,
    ) {
        $this->driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    }

    // Helper method to generate driver-specific SQL
    private function sql(string $mysqlSql, string $pgsqlSql): string
    {
        return $this->driver === 'pgsql' ? $pgsqlSql : $mysqlSql;
    }

    public static function from(PDO $pdo, string $table): self
    {
        return new self($pdo, $table);
    }

    /**
     * Join a related table on a FK column.
     *
     * Example:
     *   ->include('created_by', 'users', ['id', 'username'])
     *
     * The FK column value is replaced in the result with the nested object:
     *   "created_by": { "id": 1, "username": "admin" }
     */
    public function include(string $fkColumn, string $foreignTable, array $columns = ['id', 'username']): self
    {
        $this->includes[$fkColumn] = ['table' => $foreignTable, 'columns' => $columns];
        return $this;
    }

    /**
     * Like include(), but fetches related rows from a separate PDO connection
     * (a different database). No SQL JOIN is generated; results are merged in PHP.
     *
     * Example:
     *   ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
     */
    public function includeExternal(string $fkColumn, PDO $externalPdo, string $foreignTable, array $columns = ['id', 'username']): self
    {
        $this->externalIncludes[$fkColumn] = ['pdo' => $externalPdo, 'table' => $foreignTable, 'columns' => $columns];
        return $this;
    }

    private function buildSql(?string $condition, array $orderBy): string
    {
        $t = '_t';
        $selects = ["{$t}.*"];
        $joins = [];
        $this->aliasMap = [];

        $quoteChar = $this->sql('`', '"'); // Use backticks for MySQL, double quotes for PostgreSQL

        foreach ($this->includes as $fkCol => $rel) {
            $joinAlias = "_r_{$fkCol}";
            foreach ($rel['columns'] as $col) {
                $alias = "__rel_{$fkCol}__{$col}";
                $selects[] = "{$joinAlias}.{$col} AS {$quoteChar}{$alias}{$quoteChar}";
                $this->aliasMap[$alias] = ['fk' => $fkCol, 'col' => $col];
            }
            $joins[] = "LEFT JOIN {$rel['table']} {$joinAlias} ON {$t}.{$fkCol} = {$joinAlias}.id";
        }

        $sql = 'SELECT ' . implode(', ', $selects)
            . " FROM {$this->table} {$t}"
            . ($joins ? ' ' . implode(' ', $joins) : '')
            . ($condition ? " WHERE {$condition}" : '')
            . ($orderBy ? ' ORDER BY ' . implode(', ', $orderBy) : '')
            . ($this->limitVal ? " LIMIT {$this->limitVal}" : '')
            . ($this->offsetVal ? " OFFSET {$this->offsetVal}" : '');

        return $sql;
    }

    private function nest(array $row): array
    {
        $result = [];
        $nested = array_fill_keys(array_keys($this->includes), []);

        foreach ($row as $key => $value) {
            if (isset($this->aliasMap[$key])) {
                ['fk' => $fk, 'col' => $col] = $this->aliasMap[$key];
                $nested[$fk][$col] = $value;
            } else {
                $result[$key] = $value;
            }
        }

        // Overwrite the FK integer with the nested object.
        // If all joined columns are null (LEFT JOIN found nothing), keep null.
        foreach ($nested as $fkCol => $relData) {
            $result[$fkCol] = array_filter($relData, fn($v) => $v !== null)
                ? $relData
                : null;
        }

        return $result;
    }

    /** Only include these comma-separated columns in the output. */
    public function includeCols(string $cols): self
    {
        $this->includeColsList = array_map('trim', explode(',', $cols));
        return $this;
    }

    /** Exclude these comma-separated columns from the output. */
    public function excludeCols(string $cols): self
    {
        $this->excludeColsList = array_map('trim', explode(',', $cols));
        return $this;
    }

    public function limit(int $n): self
    {
        $this->limitVal = $n;
        return $this;
    }

    /** Only meaningful with limit() and an orderBy(), or the page is arbitrary. */
    public function offset(int $n): self
    {
        $this->offsetVal = max(0, $n);
        return $this;
    }

    /** How many rows the current filters match, ignoring limit and offset. */
    public function count(?string $condition = null, array $params = []): int
    {
        $sql = "SELECT count(*) FROM {$this->table}" . ($condition ? " WHERE $condition" : '');
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);

        return (int) $statement->fetchColumn();
    }

    private function applyColFilters(array $row): array
    {
        if ($this->includeColsList !== null) {
            $row = array_intersect_key($row, array_flip($this->includeColsList));
        }
        if ($this->excludeColsList !== null) {
            $row = array_diff_key($row, array_flip($this->excludeColsList));
        }
        return $row;
    }

    public function orderBy(string ...$columns): self
    {
        $this->orderCols = array_map(function ($col) {
            $parts = explode(' ', trim($col), 2);
            $name = $parts[0];
            $direction = strtoupper($parts[1] ?? 'ASC');
            $prefix = str_contains($name, '(') ? '' : '_t.';
            return "{$prefix}{$name} {$direction}";
        }, $columns);
        return $this;
    }

    public function orderByRandom(): self
    {
        $randomFunction = $this->driver === 'pgsql' ? 'RANDOM()' : 'RAND()';
        $this->orderCols = ["{$randomFunction}"];
        return $this;
    }

    private function resolveExternalIncludes(array $rows): array
    {
        foreach ($this->externalIncludes as $fkCol => $rel) {
            $ids = array_values(array_unique(array_filter(array_column($rows, $fkCol))));
            $lookup = [];
            if (!empty($ids)) {
                $placeholders = implode(', ', array_fill(0, count($ids), '?'));
                $cols = implode(', ', $rel['columns']);
                $stmt = $rel['pdo']->prepare("SELECT {$cols} FROM {$rel['table']} WHERE id IN ({$placeholders})");
                $stmt->execute($ids);
                foreach ($stmt->fetchAll() as $r) {
                    $lookup[$r['id']] = $r;
                }
            }
            foreach ($rows as &$row) {
                $row[$fkCol] = $lookup[$row[$fkCol]] ?? null;
            }
            unset($row);
        }
        return $rows;
    }

    public function fetchAll(?string $condition = null, array $params = []): array
    {
        $stmt = $this->pdo->prepare($this->buildSql($condition, $this->orderCols));
        $stmt->execute($params);
        $rows = array_map(fn($row) => $this->applyColFilters($this->nest($row)), $stmt->fetchAll());
        $rows = $this->resolveExternalIncludes($rows);
        resolveAssetRows($this->pdo, $this->table, $rows);
        return $rows;
    }

    public function fetch(string $condition, array $params): ?array
    {
        $stmt = $this->pdo->prepare($this->buildSql($condition, $this->orderCols));
        $stmt->execute($params);
        $row = $stmt->fetch();
        if (!$row) return null;
        $rows = $this->resolveExternalIncludes([$this->applyColFilters($this->nest($row))]);
        resolveAssetRows($this->pdo, $this->table, $rows);
        return $rows[0];
    }

    public function find(array $where): ?array
    {
        $conditions = array_map(fn($col) => "_t.{$col} = ?", array_keys($where));
        $params = array_map(fn($v) => is_bool($v) ? (int) $v : $v, array_values($where));
        return $this->fetch(implode(' AND ', $conditions), $params);
    }

    public static function insert(PDO $pdo, string $table, array $data): string
    {
        $driver  = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $quote   = $driver === 'pgsql' ? '"' : '`';
        $columns = implode(', ', array_map(fn($col) => "{$quote}{$col}{$quote}", array_keys($data)));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        if ($driver === 'pgsql') {
            $stmt = $pdo->prepare("INSERT INTO $table ($columns) VALUES ($placeholders) RETURNING id");
            $stmt->execute(array_values($data));
            $newId = (string) $stmt->fetchColumn();
        } else {
            $stmt = $pdo->prepare("INSERT INTO $table ($columns) VALUES ($placeholders)");
            $stmt->execute(array_values($data));
            $newId = $pdo->lastInsertId();
        }

        $userId = isset($data['created_by']) ? (int)$data['created_by'] : null;
        if ($userId) {
            $skip    = ['created_by', 'created_at', 'updated_by', 'updated_at'];
            $logData = array_diff_key($data, array_flip($skip));
            self::writeAuditLog($pdo, $table, $newId, 'INSERT', $userId, $logData);
        }

        return $newId;
    }

    public static function update(PDO $pdo, string $table, array $data, int|string $id): void
    {
        $userId = isset($data['updated_by']) ? (int)$data['updated_by'] : null;
        if ($userId) {
            $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ?");
            $stmt->execute([$id]);
            $old  = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
            $diff = self::computeDiff($old, $data);
            if (!empty($diff)) {
                $action = (($diff['deleted']['new'] ?? null) === true) ? 'DELETE' : 'UPDATE';
                self::writeAuditLog($pdo, $table, (string)$id, $action, $userId, $diff);
            }
        }

        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $quote  = $driver === 'pgsql' ? '"' : '`';
        $sets   = implode(', ', array_map(fn($col) => "{$quote}{$col}{$quote} = ?", array_keys($data)));
        $pdo->prepare("UPDATE $table SET $sets WHERE id = ?")
            ->execute([...array_values($data), $id]);
    }

    // -------------------------------------------------------------------------
    // Audit helpers
    // -------------------------------------------------------------------------

    /** Normalize a PostgreSQL-fetched value to a comparable PHP type. */
    private static function normalizePgValue(mixed $v): mixed
    {
        if ($v === 't') return true;
        if ($v === 'f') return false;
        if (is_string($v) && is_numeric($v)) return $v + 0;
        return $v;
    }

    /**
     * Return only the fields that actually changed.
     * Format: { "field": { "old": <oldVal>, "new": <newVal> } }
     */
    private static function computeDiff(array $old, array $new): array
    {
        $skip = ['updated_by', 'updated_at', 'created_by', 'created_at'];
        $diff = [];
        foreach ($new as $key => $value) {
            if (in_array($key, $skip, true)) continue;
            $oldNorm = self::normalizePgValue($old[$key] ?? null);
            $newNorm = self::normalizePgValue($value);
            if ($oldNorm !== $newNorm) {
                $diff[$key] = ['old' => $oldNorm, 'new' => $newNorm];
            }
        }
        return $diff;
    }

    /**
     * Write a row to audit_logs. Silently skips if the table doesn't exist yet.
     *
     * `record_id` is the row that changed. `entity_id` is what it belongs to,
     * which is the same thing until a /full save says otherwise - it sets the
     * entity once and every child it re-inserts is filed under that rather than
     * under itself. See api/audit_scope.php.
     */
    private static function writeAuditLog(PDO $pdo, string $table, string $recordId, string $action, int $userId, array $changes): void
    {
        $scope = function_exists('auditScope') ? auditScope() : null;

        try {
            $pdo->prepare(
                'INSERT INTO audit_logs (table_name, record_id, action, changed_by, changes, entity_table, entity_id, session_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                $table,
                $recordId,
                $action,
                $userId,
                json_encode($changes),
                $scope['table'] ?? $table,
                $scope['id'] ?? $recordId,
                function_exists('auditSession') ? auditSession() : null,
            ]);
        } catch (\PDOException) {
            // silently skip if audit_logs table not yet created
        }
    }
}
