/**
 * The guides behind the question marks: what the pages ask for, and what the
 * admin Guides page sends back.
 *
 * Hand-written: a guide's markup per language is a map keyed by language code,
 * which a PHP constructor has no way to describe.
 */

/** Which language to read a guide in; English when left out, and where the guide has none in it. */
export interface GuideQuery {
  language?: string;
}

/**
 * One guide's markup, only the languages that changed. A blank one deletes
 * that language's markup - the guide then reads in English there - and English
 * cannot be sent blank.
 */
export interface GuideSaveRequest {
  values: Record<string, string>;
}
