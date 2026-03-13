#!/usr/bin/env node
/**
 * generate-interfaces.js
 *
 * Reads php/schema.sql and generates TypeScript interfaces from each CREATE TABLE block.
 * Interface names are extracted from the comment above each table:
 *   -- SOME LABEL (InterfaceName)
 *
 * Usage:
 *   node generate-interfaces.js [--output <path>] [--stdout]
 *
 * Default output: src/app/shared/models.generated.ts
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const stdoutOnly = args.includes('--stdout');
const outputIdx = args.indexOf('--output');
const outputRelative =
  outputIdx !== -1 && args[outputIdx + 1]
    ? args[outputIdx + 1]
    : 'src/app/shared/models.generated.ts';

const schemaPath = path.resolve(__dirname, '../php/schema.sql');
const outputPath = path.resolve(__dirname, outputRelative);

// ---------------------------------------------------------------------------
// Type mapping
// ---------------------------------------------------------------------------
function mapSqlType(rawType) {
  const upper = rawType.trim().toUpperCase();

  if (upper.startsWith('ENUM')) {
    // ENUM('val1','val2',...) → 'val1' | 'val2' | ...
    const match = rawType.match(/ENUM\s*\(([^)]+)\)/i);
    if (match) {
      const values = match[1]
        .split(',')
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
        .map((v) => `'${v}'`)
        .join(' | ');
      return values;
    }
    return 'string';
  }

  if (
    upper.startsWith('TINYINT(1)') ||
    upper === 'BOOLEAN' ||
    upper === 'BOOL'
  ) {
    return 'boolean';
  }

  if (
    upper.startsWith('TINYINT') ||
    upper.startsWith('SMALLINT') ||
    upper.startsWith('MEDIUMINT') ||
    upper.startsWith('INT') ||
    upper.startsWith('BIGINT') ||
    upper.startsWith('FLOAT') ||
    upper.startsWith('DOUBLE') ||
    upper.startsWith('DECIMAL') ||
    upper.startsWith('NUMERIC')
  ) {
    return 'number';
  }

  if (
    upper.startsWith('VARCHAR') ||
    upper.startsWith('CHAR') ||
    upper.startsWith('TINYTEXT') ||
    upper.startsWith('TEXT') ||
    upper.startsWith('MEDIUMTEXT') ||
    upper.startsWith('LONGTEXT')
  ) {
    return 'string';
  }

  if (
    upper.startsWith('TIMESTAMP') ||
    upper.startsWith('DATETIME') ||
    upper.startsWith('DATE') ||
    upper.startsWith('TIME')
  ) {
    return 'string'; // ISO string on the wire
  }

  if (upper === 'JSON') {
    return 'any';
  }

  return 'any';
}

// ---------------------------------------------------------------------------
// snake_case → camelCase
// ---------------------------------------------------------------------------
function toCamelCase(name) {
  return name.replace(/_([a-z0-9])/gi, (_, c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Parse a single column definition line
// Returns { name: string, tsType: string, optional: boolean } or null
// ---------------------------------------------------------------------------
function parseColumnLine(raw) {
  // Strip inline comment and trailing comma
  let line = raw.replace(/--.*$/, '').replace(/,\s*$/, '').trim();
  if (!line) return null;

  const upper = line.toUpperCase();

  // Skip non-column lines
  if (
    upper.startsWith('PRIMARY KEY') ||
    upper.startsWith('CONSTRAINT') ||
    upper.startsWith('UNIQUE KEY') ||
    upper.startsWith('UNIQUE INDEX') ||
    upper.startsWith('INDEX') ||
    upper.startsWith('KEY ')
  ) {
    return null;
  }

  // Match: [backtick]column_name[backtick] TYPE_DEF [rest...]
  const colMatch = line.match(/^`?(\w+)`?\s+(.+)$/);
  if (!colMatch) return null;

  const colName = colMatch[1];
  const typeDef = colMatch[2].trim();

  // Extract the SQL type token (handles ENUM which contains spaces/commas inside parens)
  let sqlType;
  if (/^ENUM\s*\(/i.test(typeDef)) {
    const end = typeDef.indexOf(')') + 1;
    sqlType = typeDef.substring(0, end);
  } else {
    sqlType = typeDef.split(/\s+/)[0];
  }

  const tsType = mapSqlType(sqlType);

  // Nullability: optional if NOT NULL is absent
  const typeDefUpper = typeDef.toUpperCase();
  const isNotNull = typeDefUpper.includes('NOT NULL');
  const optional = !isNotNull;

  return {
    name: toCamelCase(colName),
    tsType,
    optional,
  };
}

// ---------------------------------------------------------------------------
// Parse the whole SQL file into an array of interface descriptors
// ---------------------------------------------------------------------------
function parseSql(sql) {
  const lines = sql.split('\n');
  const interfaces = [];

  let pendingName = null; // interface name found in comment
  let insideTable = false;
  let properties = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect interface name comment: -- ... (InterfaceName)
    if (!insideTable) {
      const commentMatch = line.match(/--+\s*[^(]*\((\w+)\)/);
      if (commentMatch) {
        pendingName = commentMatch[1];
        continue;
      }
    }

    // Detect CREATE TABLE start
    if (!insideTable && /^\s*CREATE\s+TABLE\s+/i.test(line)) {
      if (pendingName) {
        insideTable = true;
        properties = [];
      }
      continue;
    }

    // Inside table body
    if (insideTable) {
      // End of table
      if (/^\s*\)\s*;/.test(line)) {
        if (properties.length > 0) {
          interfaces.push({ name: pendingName, properties });
        }
        insideTable = false;
        pendingName = null;
        continue;
      }

      const col = parseColumnLine(line);
      if (col) {
        properties.push(col);
      }
    }
  }

  return interfaces;
}

// ---------------------------------------------------------------------------
// Generate TypeScript output
// ---------------------------------------------------------------------------
function generateTs(interfaces) {
  const header = [
    '// AUTO-GENERATED — do not edit manually.',
    '// Source: php/schema.sql',
    '// Regenerate: node angular/generate-interfaces.js',
    '',
  ].join('\n');

  const blocks = interfaces.map((iface) => {
    const props = iface.properties
      .map((p) => {
        const opt = p.optional ? '?' : '';
        const nullable = p.optional ? ' | null' : '';
        return `  ${p.name}${opt}: ${p.tsType}${nullable};`;
      })
      .join('\n');

    return `export interface ${iface.name} {\n${props}\n}`;
  });

  return header + blocks.join('\n\n') + '\n';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
if (!fs.existsSync(schemaPath)) {
  console.error(`Error: schema not found at ${schemaPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(schemaPath, 'utf-8');
const interfaces = parseSql(sql);

if (interfaces.length === 0) {
  console.error('No interfaces found — check the comment pattern in schema.sql');
  process.exit(1);
}

const output = generateTs(interfaces);

if (stdoutOnly) {
  process.stdout.write(output);
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`Generated ${interfaces.length} interfaces → ${outputPath}`);
  interfaces.forEach((i) =>
    console.log(`  • ${i.name} (${i.properties.length} properties)`)
  );
}
