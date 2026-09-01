#!/usr/bin/env node
/**
 * generate-openapi.mjs — describes the API to everything that is not this app.
 *
 *   php ../php/generate-api-spec.php     # read the backend
 *   node generate-openapi.mjs            # write php/api/openapi.json
 *
 * The same api-spec.json and the same decisions in api-config.mjs that produce
 * the TypeScript client produce this, so an operation is called the same thing
 * in both and answers with the same shape in both. It lands in the API's own
 * document root, next to docs.html, which is what serves it to Swagger UI.
 *
 * The one thing that could have drifted is the response schemas. Roughly forty
 * of them have no machine-readable source on the backend - the paged listings,
 * the composite `/full` bodies, the admin views assembled in a handler - and
 * are written by hand in src/app/api/types. Rather than describe those twice,
 * this reads the TypeScript itself: it writes a small file declaring every
 * operation's request and response type, compiles it with the compiler that is
 * already installed, and walks the resolved types into JSON Schema. So a type
 * corrected in api/types corrects the document, and a type that no longer
 * compiles fails here rather than quietly describing something that is untrue.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { analyse, argType, BLOBS, GROUP_DOCS, GROUPS, QUERIES } from './api-config.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SPEC = path.join(HERE, 'api-spec.json');

/** The API's document root: `.htaccess` serves a real file before routing. */
const OUT = path.join(HERE, '../php/api/openapi.json');

const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
const { routes, skipped, groupOf, operationName, responseType, bodyType } = analyse(spec);

/** Names TypeScript supplies, so the probe must not try to import them. */
const BUILTINS = new Set(['Partial', 'Record', 'Omit', 'Pick', 'Readonly', 'FormData', 'Blob', 'Date']);

const operationKey = (route) => `${route.method} ${route.path}`;

// ─────────────────────────────────────────────────────────────────────────────
// Ask TypeScript what each operation actually deals in
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Names for the two shapes a row takes once its audit columns are expanded.
 *
 * Left inline these would be written out in full on all 161 endpoints that
 * return one, which is most of the document. Named, each is described once and
 * referred to after that.
 *
 *   CharacterRead     read back, so both `created_by` and `updated_by` hold
 *                     the user they name
 *   CharacterCreated  answered by a create, where only `created_by` does -
 *                     nothing has updated the row yet
 */
const EXPANDED = [
  [/^Expanded<(\w+), 'created_by' \| 'updated_by'>/, 'Read'],
  [/^Expanded<(\w+), 'created_by'>/, 'Created'],
];

const shapes = new Map();

function named(expression) {
  for (const [pattern, suffix] of EXPANDED) {
    const hit = expression.match(pattern);
    if (hit) {
      const name = hit[1] + suffix;
      shapes.set(name, hit[0]);
      return expression.replace(hit[0], name);
    }
  }
  return expression;
}

/**
 * Every request and response type, written out as a file the compiler can read.
 *
 * A type expression like `Expanded<Character, 'created_by'>[]` is not a name
 * that can be looked up, so each one becomes a named alias here and the
 * compiler resolves it the same way it does for the client.
 */
function buildProbe() {
  const aliases = [];
  const wanted = new Set();
  const use = (expression) => {
    for (const word of expression.match(/[A-Z][A-Za-z0-9]*/g) ?? []) {
      if (!BUILTINS.has(word)) wanted.add(word);
    }
  };

  for (const route of routes) {
    const key = operationKey(route);
    const id = operationName(route);

    const response = responseType(route);
    if (response !== 'unknown' && !BLOBS.has(key)) {
      use(response);
      aliases.push(`export type Response_${id} = ${named(response)};`);
    }

    const body = bodyType(route);
    if (body && body !== 'FormData') {
      use(body);
      aliases.push(`export type Body_${id} = ${body};`);
    }

    const query = QUERIES[key]?.replace(/\?$/, '');
    if (query) {
      use(query);
      aliases.push(`export type Query_${id} = ${query};`);
    }
  }

  // The error shapes are already described in api/types; nothing returns them
  // as its success, so they are named here to get them into the document.
  for (const shared of ['ApiError', 'ApiValidationError']) {
    use(shared);
    aliases.push(`export type Shared_${shared} = ${shared};`);
  }

  const imports = [...wanted].sort();
  const declarations = [...shapes].map(([name, expression]) => `export type ${name} = ${expression};`);

  return [
    `import { ${imports.join(', ')} } from './src/app/api';`,
    '',
    ...declarations.sort(),
    '',
    ...aliases,
    '',
  ].join('\n');
}

/**
 * The probe sits here rather than in a temp directory because it has to import
 * `./src/app/api` by a relative path, and on Windows the temp directory is on
 * another drive, where no relative path exists. tsconfig.app.json builds from
 * src/main.ts alone, so a file at this level is never part of a build, and it
 * is removed once the types have been read either way.
 */
const probePath = path.join(HERE, '.openapi-probe.ts');
fs.writeFileSync(probePath, buildProbe());
process.on('exit', () => fs.rmSync(probePath, { force: true }));

const program = ts.createProgram([probePath], {
  strict: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  skipLibCheck: true,
  noEmit: true,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
});

const checker = program.getTypeChecker();
const probeFile = program.getSourceFile(probePath);

const fatal = ts.getPreEmitDiagnostics(program).filter((d) => d.category === ts.DiagnosticCategory.Error);
if (fatal.length) {
  console.error('The API types do not compile, so the document would be describing something untrue:\n');
  for (const diagnostic of fatal.slice(0, 10)) {
    console.error('  ' + ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '));
  }
  process.exit(1);
}

/**
 * The concrete types api/index.ts exports, which are the ones worth a `$ref`.
 *
 * Generic helpers are left out on purpose: `Expanded<T, K>` and `Saved<T>`
 * describe how a shape is built rather than being a shape, so they are resolved
 * and written out wherever they are used.
 */
const nameable = new Map();
for (const exported of checker.getExportsOfModule(checker.getSymbolAtLocation(probeFile.statements[0].moduleSpecifier))) {
  const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
  const declaration = symbol.declarations?.[0];
  if (!declaration) continue;

  const isType = ts.isInterfaceDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration);
  if (isType && !declaration.typeParameters?.length) {
    // Both the re-export and the declaration, since a type may be reached
    // through either depending on how it was written down.
    nameable.set(symbol, symbol.getName());
    nameable.set(exported, symbol.getName());
  }
}

/**
 * Each probe alias, resolved.
 *
 * From the type node rather than the alias symbol: asking the checker for the
 * declared type of an exported alias hands back `any`, while the node it was
 * written as resolves properly.
 */
const declared = new Map();
for (const statement of probeFile.statements) {
  if (!ts.isTypeAliasDeclaration(statement)) continue;

  const name = statement.name.text;
  declared.set(name, checker.getTypeFromTypeNode(statement.type));

  // The expanded row shapes are named here rather than in api/index.ts, so
  // they have to be added to the set worth a `$ref` by hand.
  if (shapes.has(name)) {
    nameable.set(checker.getSymbolAtLocation(statement.name), name);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript types as JSON Schema
// ─────────────────────────────────────────────────────────────────────────────

const schemas = {};
const building = new Set();

const docOf = (symbol) => {
  const text = ts.displayPartsToString(symbol?.getDocumentationComment(checker) ?? []).trim();
  return text ? text.replace(/\s*\n\s*/g, ' ') : undefined;
};

function refFor(symbol, type) {
  const name = nameable.get(symbol);
  if (!schemas[name] && !building.has(name)) {
    building.add(name);
    schemas[name] = { title: name, description: docOf(symbol), ...objectSchema(type) };
    building.delete(name);
  }
  return { $ref: `#/components/schemas/${name}` };
}

function objectSchema(type) {
  const symbolName = type.getSymbol()?.getName();
  if (symbolName === 'Blob' || symbolName === 'File') {
    return { type: 'string', format: 'binary' };
  }

  const properties = {};
  const required = [];

  for (const property of checker.getPropertiesOfType(type)) {
    const propertyType = checker.getTypeOfSymbolAtLocation(property, probeFile);
    const optional = (property.flags & ts.SymbolFlags.Optional) !== 0;
    const schema = schemaFor(propertyType);
    const description = docOf(property);

    properties[property.getName()] = description ? { description, ...schema } : schema;
    if (!optional) required.push(property.getName());
  }

  const index = checker.getIndexInfoOfType(type, ts.IndexKind.String);
  const schema = { type: 'object' };
  if (Object.keys(properties).length) schema.properties = properties;
  if (required.length) schema.required = required;
  schema.additionalProperties = index ? schemaFor(index.type) : false;

  return schema;
}

/** One resolved type as JSON Schema, `$ref`-ing anything that has a name. */
function schemaFor(type) {
  const F = ts.TypeFlags;

  if (type.flags & (F.Any | F.Unknown)) return {};
  if (type.flags & F.Never) return { not: {} };
  if (type.flags & F.Null) return { type: 'null' };
  if (type.flags & F.StringLiteral) return { type: 'string', const: type.value };
  if (type.flags & F.NumberLiteral) return { type: 'number', const: type.value };
  if (type.flags & F.BooleanLiteral) return { type: 'boolean', const: checker.typeToString(type) === 'true' };
  if (type.flags & F.Boolean) return { type: 'boolean' };
  if (type.flags & F.String) return { type: 'string' };
  if (type.flags & F.Number) return { type: 'number' };

  const named = type.aliasSymbol ?? type.getSymbol();
  if (named && nameable.has(named)) return refFor(named, type);

  if (checker.isArrayType(type)) {
    return { type: 'array', items: schemaFor(checker.getTypeArguments(type)[0]) };
  }

  if (type.isUnion()) {
    // `undefined` in a union is optionality, which the property carries.
    const members = type.types.filter((member) => !(member.flags & F.Undefined));
    if (members.length === 1) return schemaFor(members[0]);

    const literals = members.filter((member) => member.flags & (F.StringLiteral | F.Null));
    if (literals.length === members.length) {
      const values = members.map((member) => (member.flags & F.Null ? null : member.value));
      const type_ = values.includes(null) ? ['string', 'null'] : 'string';
      return { type: type_, enum: values };
    }

    return { anyOf: members.map(schemaFor) };
  }

  if (type.isIntersection()) {
    // The checker has already worked out the properties across the parts, so
    // this reads as one object rather than an allOf nobody can skim.
    return objectSchema(type);
  }

  if (type.flags & F.Object) return objectSchema(type);

  return {};
}

/** The schema for a probe alias, or undefined where there was nothing to declare. */
function schemaOf(prefix, id) {
  const type = declared.get(`${prefix}_${id}`);
  return type ? schemaFor(type) : undefined;
}

// The error shapes are referred to by the shared responses rather than by any
// operation, so they are resolved here to get them into components.schemas.
schemaFor(declared.get('Shared_ApiError'));
schemaFor(declared.get('Shared_ApiValidationError'));

// ─────────────────────────────────────────────────────────────────────────────
// The document
// ─────────────────────────────────────────────────────────────────────────────

const title = spec.site
  ? spec.site.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
  : 'Anotoki';

/** `getCharacterBuildTeams` -> `Get character build teams`. */
function summaryOf(id) {
  const words = id.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  return words[0].toUpperCase() + words.slice(1);
}

function describe(route) {
  const lines = [];
  if (route.roles.length) {
    lines.push(`Requires the ${route.roles.map((role) => `\`${role}\``).join(' or ')} role.`);
  } else if (route.auth) {
    lines.push('Requires a signed-in user.');
  } else {
    lines.push('Public.');
  }
  if (route.tables.length) {
    lines.push(`Reads \`${route.tables[0]}\`.`);
  }
  return lines.join(' ');
}

function parametersFor(route, id) {
  const parameters = route.args.map((arg) => ({
    name: arg.name,
    in: 'path',
    required: true,
    // The route's own regex, where it has one. This is what separates
    // `/api/materials/full` from `/api/materials/{id}` - Slim will not match a
    // literal against `[0-9]+`, and saying so keeps the document as unambiguous
    // as the routing is.
    schema:
      argType(arg) === 'number'
        ? { type: 'integer' }
        : { type: 'string', ...(arg.constraint ? { pattern: `^${arg.constraint}$` } : {}) },
  }));

  // Expanded rather than resolved through schemaOf(): a query type is a named
  // interface, so that would hand back a `$ref`, and a `$ref` has no fields to
  // turn into one parameter each.
  const query = declared.get(`Query_${id}`);
  if (query) {
    const object = objectSchema(query);
    for (const [name, schema] of Object.entries(object.properties ?? {})) {
      parameters.push({
        name,
        in: 'query',
        required: (object.required ?? []).includes(name),
        schema,
      });
    }
  }

  return parameters;
}

function requestBodyFor(route, id) {
  const declared = bodyType(route);
  if (!declared) return undefined;

  if (declared === 'FormData') {
    return {
      required: true,
      description: 'Sent as multipart/form-data: the fields, and the files alongside them.',
      content: { 'multipart/form-data': { schema: { type: 'object', additionalProperties: true } } },
    };
  }

  const schema = schemaOf('Body', id);
  return schema ? { required: true, content: { 'application/json': { schema } } } : undefined;
}

/** What each failure a handler can answer with means, in this API's terms. */
const FAILURE_TEXT = {
  400: 'The request was malformed.',
  401: 'No token, or one that has expired.',
  403: 'Signed in, but without the role this needs.',
  404: 'No such record.',
  409: 'That would collide with something that already exists.',
  415: 'The file was of a type this will not take, or could not be read.',
  422: 'The body was understood but will not do.',
  429: 'Too many of these, too quickly.',
  500: 'Something went wrong on the server.',
};

const FAILURES = Object.fromEntries(
  Object.entries(FAILURE_TEXT).map(([status, description]) => [
    status,
    { description, content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
  ])
);

function responsesFor(route, id) {
  const key = operationKey(route);
  const success = String(route.success ?? 200);

  const content = BLOBS.has(key)
    ? { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } }
    : (() => {
        const schema = schemaOf('Response', id);
        return schema ? { 'application/json': { schema } } : undefined;
      })();

  const responses = {
    [success]: {
      description: success === '201' ? 'Created.' : 'The request succeeded.',
      ...(content ? { content } : {}),
    },
  };

  // The failures the handler can actually produce, read out of its own
  // respondJson() calls rather than assumed from the shape of the route.
  for (const status of route.statuses ?? []) {
    if (status < 400 || responses[status]) continue;
    responses[String(status)] = FAILURES[status] ?? {
      description: 'The request failed.',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    };
  }

  // These two come from the middleware rather than the handler, so they are not
  // among the statuses above - the request never reaches the body.
  if (route.auth) {
    responses['401'] = { $ref: '#/components/responses/Unauthorized' };
  }
  if (route.roles.length) {
    responses['403'] = { $ref: '#/components/responses/Forbidden' };
  }
  // Only where validateRequest() is actually on the route. An endpoint that
  // checks its own body - login, the contact form - says what it says, and
  // promising a 422 it never sends would be worse than saying nothing.
  if (route.payload) {
    responses['422'] = { $ref: '#/components/responses/Invalid' };
  }
  responses.default = { $ref: '#/components/responses/Error' };

  return Object.fromEntries(
    Object.entries(responses).sort(([a], [b]) => (a === 'default' ? 1 : b === 'default' ? -1 : Number(a) - Number(b)))
  );
}

const paths = {};
for (const route of routes) {
  const id = operationName(route);
  const entry = (paths[route.path] ??= {});

  entry[route.method.toLowerCase()] = {
    tags: [groupOf(route)],
    operationId: id,
    summary: summaryOf(id),
    description: describe(route),
    ...(parametersFor(route, id).length ? { parameters: parametersFor(route, id) } : {}),
    ...(requestBodyFor(route, id) ? { requestBody: requestBodyFor(route, id) } : {}),
    responses: responsesFor(route, id),
    ...(route.auth ? { security: [{ bearerAuth: [] }] } : { security: [] }),
  };
}

const document = {
  openapi: '3.1.0',
  info: {
    title: `${title} API`,
    version: '1.0.0',
    description: [
      `The ${title} API, as it is actually registered.`,
      '',
      'Generated from the running route table by php/generate-api-spec.php and',
      'angular/generate-openapi.mjs - not maintained by hand, and not annotated',
      'onto the handlers. Regenerate with `npm run api` in angular/.',
      '',
      skipped
        ? `${skipped} registered routes are left out: they reference tables and model classes that do not exist, and answer 500.`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
  },
  servers: [{ url: '/', description: 'Wherever this document is served from.' }],
  tags: GROUPS.map(([name]) => name)
    .filter((name) => Object.values(paths).some((entry) => Object.values(entry).some((op) => op.tags[0] === name)))
    .map((name) => ({ name, description: GROUP_DOCS[name] ?? undefined })),
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'The token from `POST /api/auth/login`, as `Authorization: Bearer <token>`.',
      },
    },
    responses: {
      Unauthorized: {
        description: 'No token, or one that has expired.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      Forbidden: {
        description: 'Signed in, but without the role this needs.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      Invalid: {
        description: 'The body did not pass validateBody(); one message per field.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiValidationError' } } },
      },
      Error: {
        description: 'Something went wrong.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
    },
    schemas: Object.fromEntries(Object.entries(schemas).sort(([a], [b]) => a.localeCompare(b))),
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(document, null, 2) + '\n');

const operations = Object.values(paths).reduce((total, entry) => total + Object.keys(entry).length, 0);
console.log(path.relative(path.join(HERE, '..'), OUT).replace(/\\/g, '/'));
console.log(`  ${Object.keys(paths).length} paths, ${operations} operations, ${Object.keys(schemas).length} schemas`);
