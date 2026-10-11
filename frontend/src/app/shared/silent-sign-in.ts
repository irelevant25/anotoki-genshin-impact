import { type AnotokiAuthClient, type AnotokiAuthEnvironment, type AnotokiAuthOptions, type AnotokiInitResult, createAuthClient } from '@anotoki/lib/auth';

/**
 * Where this browser notes that the session it holds was made by a silent
 * sign-in - the IAM's sign-in hint signed the person in, nobody clicked
 * anything - and whose (the IAM user id). localStorage, like the session:
 * every tab shares it.
 */
export const SILENT_SIGN_IN_KEY = 'genshin-silent-sign-in';

/** The note, when the browser refuses storage: for this page load, which is all the session lasts then. */
let inMemory: string | null = null;

/** Notes a silent sign-in of `sub`, or - null - one the person made. */
function noteSignIn(sub: string | null): void {
  inMemory = sub;
  try {
    if (sub === null) {
      localStorage.removeItem(SILENT_SIGN_IN_KEY);
    } else {
      localStorage.setItem(SILENT_SIGN_IN_KEY, sub);
    }
  } catch {
    // Storage refused (a private window): the note lives in memory, as the session does then.
  }
}

/**
 * The library's IAM client (`createAuthClient`, given to it as
 * ANOTOKI_AUTH_CLIENT_FACTORY in app.config.ts), noting how each sign-in it
 * finishes was made. Only the callback knows - `AnotokiInitResult.silent`, the
 * hint's prompt=none hop - and only on that one page load; a later page load
 * restores the session without a word of how it began. So it is written down:
 * a silent sign-in notes its person, and one the person made (the Sign in
 * button, the registration form, "Sign in again", a required sign-in) clears
 * the note.
 *
 * What reads it, for as long as the session lasts: the move of this
 * browser's visitor into the account (VisitorKey) and the carry of the games
 * the browser kept by itself (QuizProgressService). After a silent sign-in
 * either comes in only when the account has nothing here yet - the server
 * decides, and answers `stayed` when it does not (the owner's decision of
 * 2026-10-11); a sign-in the person makes brings them along as ever.
 */
export function clientNotingSilentSignIns(options: AnotokiAuthOptions, environment: AnotokiAuthEnvironment): AnotokiAuthClient {
  const client = createAuthClient(options, environment);
  return {
    ...client,
    init: async (): Promise<AnotokiInitResult> => {
      const result = await client.init();
      // A callback that signed somebody in (returnTo is null on a page load that is no callback).
      if (result.returnTo !== null && result.error === null) {
        noteSignIn(result.silent ? (client.user()?.sub ?? null) : null);
      }
      return result;
    },
  };
}

/** Whether the session of `sub` - the IAM user id signed in now - was made by a silent sign-in. */
export function signedInSilently(sub: string | null): boolean {
  if (sub === null) {
    return false;
  }
  try {
    return localStorage.getItem(SILENT_SIGN_IN_KEY) === sub;
  } catch {
    return inMemory === sub;
  }
}
