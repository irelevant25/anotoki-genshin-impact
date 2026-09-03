/**
 * The shapes the backend does not declare.
 *
 * Everything in ../models is generated from the schema and the PHP models and
 * must not be edited. What is here has no declaration to be generated from: the
 * composite `/full` bodies, the paged listings, the assembled admin views, and
 * the endpoints that answer with an object built in the handler.
 *
 * When one of these drifts, the fix is here. When a table or a model changes,
 * the fix is to regenerate.
 */

export * from './admin.type';
export * from './auth.type';
export * from './backup.type';
export * from './common.type';
export * from './feedback.type';
export * from './file.type';
export * from './quiz.type';
export * from './setting.type';
export * from './translation.type';
export * from './user.type';
