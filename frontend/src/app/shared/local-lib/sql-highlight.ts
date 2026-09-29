/**
 * A small SQL tokeniser for read-only code display.
 *
 * It returns tokens rather than markup on purpose: the template renders each
 * one as its own span, so file contents never go anywhere near innerHTML and a
 * migration containing `<script>` is just text.
 *
 * It is a highlighter, not a parser - it knows enough to colour a migration
 * file and nothing more.
 */

export type SqlTokenKind = 'plain' | 'keyword' | 'type' | 'string' | 'number' | 'comment' | 'operator' | 'function' | 'identifier';

export interface SqlToken {
  text: string;
  kind: SqlTokenKind;
}

const KEYWORDS = new Set([
  'add', 'all', 'alter', 'and', 'as', 'asc', 'begin', 'between', 'by', 'cascade', 'case', 'cast', 'check', 'column',
  'commit', 'conflict', 'constraint', 'create', 'cross', 'current_timestamp', 'database', 'declare', 'default',
  'deferrable', 'delete', 'desc', 'distinct', 'do', 'drop', 'else', 'end', 'exists', 'false', 'for', 'foreign', 'from',
  'full', 'function', 'grant', 'group', 'having', 'if', 'in', 'index', 'inner', 'insert', 'into', 'is', 'join', 'key',
  'language', 'left', 'like', 'limit', 'not', 'null', 'nulls', 'offset', 'on', 'only', 'or', 'order', 'outer', 'over',
  'partition', 'primary', 'procedure', 'references', 'rename', 'replace', 'restrict', 'return', 'returns', 'revoke',
  'right', 'rollback', 'row', 'schema', 'select', 'sequence', 'set', 'table', 'temporary', 'then', 'to', 'trigger',
  'true', 'truncate', 'union', 'unique', 'update', 'using', 'values', 'view', 'when', 'where', 'with',
  'before', 'after', 'each', 'execute', 'instead', 'of', 'new', 'old', 'exclude', 'nothing', 'restart', 'identity',
]);

const TYPES = new Set([
  'bigint', 'bigserial', 'bool', 'boolean', 'bytea', 'char', 'character', 'date', 'decimal', 'double', 'float', 'int',
  'int2', 'int4', 'int8', 'integer', 'interval', 'json', 'jsonb', 'money', 'numeric', 'precision', 'real', 'serial',
  'smallint', 'smallserial', 'text', 'time', 'timestamp', 'timestamptz', 'uuid', 'varchar', 'varying', 'zone',
]);

const OPERATOR_CHARS = new Set(['(', ')', ',', ';', '=', '<', '>', '+', '-', '*', '/', '%', '|', '.', '[', ']', ':']);

const IDENTIFIER_START = /[A-Za-z_]/;
const IDENTIFIER_PART = /[A-Za-z0-9_$]/;

/** Splits SQL into coloured runs, in order, losing nothing. */
export function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  const push = (text: string, kind: SqlTokenKind) => {
    if (!text) {
      return;
    }
    // Merge neighbours of the same kind so the DOM stays small on big files.
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind) {
      last.text += text;
    } else {
      tokens.push({ text, kind });
    }
  };

  let i = 0;
  const n = sql.length;

  while (i < n) {
    const char = sql[i];

    // -- line comment
    if (char === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i);
      const stop = end === -1 ? n : end;
      push(sql.slice(i, stop), 'comment');
      i = stop;
      continue;
    }

    // /* block comment */
    if (char === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      push(sql.slice(i, stop), 'comment');
      i = stop;
      continue;
    }

    // 'string literal', where '' is an escaped quote
    if (char === "'") {
      let j = i + 1;
      while (j < n) {
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") {
            j += 2;
            continue;
          }
          j += 1;
          break;
        }
        j += 1;
      }
      push(sql.slice(i, j), 'string');
      i = j;
      continue;
    }

    // "quoted identifier"
    if (char === '"') {
      const end = sql.indexOf('"', i + 1);
      const stop = end === -1 ? n : end + 1;
      push(sql.slice(i, stop), 'identifier');
      i = stop;
      continue;
    }

    // $$ dollar-quoted body, which trigger functions are written in
    if (char === '$' && sql[i + 1] === '$') {
      const end = sql.indexOf('$$', i + 2);
      const stop = end === -1 ? n : end + 2;
      push(sql.slice(i, stop), 'string');
      i = stop;
      continue;
    }

    // number
    if (char >= '0' && char <= '9') {
      let j = i;
      while (j < n && /[0-9.]/.test(sql[j])) {
        j += 1;
      }
      push(sql.slice(i, j), 'number');
      i = j;
      continue;
    }

    // word: keyword, type, function call or plain identifier
    if (IDENTIFIER_START.test(char)) {
      let j = i;
      while (j < n && IDENTIFIER_PART.test(sql[j])) {
        j += 1;
      }
      const word = sql.slice(i, j);
      const lower = word.toLowerCase();
      let kind: SqlTokenKind = 'plain';
      if (KEYWORDS.has(lower)) {
        kind = 'keyword';
      } else if (TYPES.has(lower)) {
        kind = 'type';
      } else if (sql[j] === '(') {
        kind = 'function';
      }
      push(word, kind);
      i = j;
      continue;
    }

    if (OPERATOR_CHARS.has(char)) {
      push(char, 'operator');
      i += 1;
      continue;
    }

    push(char, 'plain');
    i += 1;
  }

  return tokens;
}
