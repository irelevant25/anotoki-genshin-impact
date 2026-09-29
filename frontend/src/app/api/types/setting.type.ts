/**
 * What the site settings form sends back.
 *
 * The whole form in one request rather than a request per switch. Maintenance
 * mode and the words on the maintenance page are one decision, and saving them
 * separately leaves a window - however short - where the site is closed and
 * the sign is blank.
 *
 * Every value travels as text, whatever the setting's declared type says,
 * because that is the shape of the column it lands in. A boolean is the word
 * 'true' or the word 'false'; an i18n message and a list of sections are JSON.
 * The API checks each against its type and refuses the whole request if any
 * one of them does not fit.
 */
export interface SiteSettingChange {
  name: string;
  value: string;
}

export interface SiteSettingsSaveRequest {
  settings: SiteSettingChange[];
}

/**
 * What the pages form sends back.
 *
 * One row per page that changed, addressed by id rather than by path: the path
 * is what the router declares and this form cannot invent one, so sending it
 * back would only be a second name for the same row and a second thing to get
 * wrong.
 *
 * `endpoints` is the whole list for that page, not a diff. There are never
 * more than a handful, they have no identity of their own worth keeping, and
 * the API replaces them wholesale.
 */
export interface SiteRouteChange {
  id: number;
  visibility: string;
  blocked: boolean;
  endpoints: string[];
}

export interface SiteRoutesSaveRequest {
  routes: SiteRouteChange[];
}

/**
 * A page the migration did not seed.
 *
 * The seeded rows are every route the router declared at the time, so this is
 * for one written since - or for a page somebody wants governed before its
 * route exists, which is the useful order when the point is that it should not
 * be reachable yet. Nothing checks the path against the router: the API has no
 * idea what the front end declares.
 *
 * `visibility` defaults to ADMIN, because the safe default for a page nobody
 * has thought about is that nobody sees it.
 */
export interface SiteRouteCreateRequest {
  path: string;
  visibility?: string;
  blocked?: boolean;
}
